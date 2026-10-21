import { NextResponse } from "next/server";
import appConfig from "@/settings";
import { db } from "@/lib/db";
import { getClientIP } from "./geo";

export type RateLimitBucket = keyof typeof appConfig.rateLimit;

/**
 * Limitation de débit persistante (table rate_limits) : survit aux redémarrages
 * et est partagée entre toutes les instances de l'application.
 *
 * Retourne une réponse 429 si la limite est dépassée, sinon null.
 */
export async function applyRateLimit(
  req: { headers: Headers },
  bucket: RateLimitBucket,
  identifier?: string
): Promise<NextResponse | null> {
  const { max, windowMs } = appConfig.rateLimit[bucket];
  const key = `${bucket}:${identifier ?? getClientIP(req)}`;
  const windowStart = new Date(Date.now() - windowMs);

  try {
    // Incrément atomique : la fenêtre repart à zéro si elle est expirée
    const rows = await db.$queryRaw<{ count: number; windowStart: Date }[]>`
      INSERT INTO "rate_limits" ("key", "count", "windowStart")
      VALUES (${key}, 1, NOW())
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "rate_limits"."windowStart" < ${windowStart} THEN 1 ELSE "rate_limits"."count" + 1 END,
        "windowStart" = CASE WHEN "rate_limits"."windowStart" < ${windowStart} THEN NOW() ELSE "rate_limits"."windowStart" END
      RETURNING "count", "windowStart"
    `;

    // Nettoyage occasionnel des compteurs expirés
    if (Math.random() < 0.01) {
      await db.rateLimit.deleteMany({
        where: { windowStart: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      });
    }

    const row = rows[0];
    if (row && row.count > max) {
      const retryAfter = Math.max(
        1,
        Math.ceil((new Date(row.windowStart).getTime() + windowMs - Date.now()) / 1000)
      );
      return NextResponse.json(
        { error: "Trop de tentatives, veuillez réessayer plus tard." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }
  } catch (error) {
    // En cas d'indisponibilité de la base, on ne bloque pas l'authentification
    console.error("Erreur de limitation de débit :", error);
  }

  return null;
}
