import crypto from "node:crypto";
import { db } from "@/lib/db";
import { createEncryptedJWT } from "@/lib/tokens";
import appConfig from "@/settings";

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  /** Durée de vie du jeton d'accès, en secondes */
  accessTokenExpiresAt: number;
  /** Durée de vie restante du refresh token, en secondes */
  refreshTokenExpiresAt: number;
}

export type RotateResult =
  | { ok: true; tokens: IssuedTokens }
  | { ok: false; error: string; status: number };

const newRefreshToken = () => crypto.randomBytes(64).toString("hex");

function accessTokenFor(userId: string, sessionId: string) {
  const ttl = appConfig.auth.accessTokenTtl;
  return {
    accessToken: createEncryptedJWT({ userId, sid: sessionId }, ttl),
    expires: new Date(Date.now() + ttl * 1000),
    ttl,
  };
}

/** Crée une session et ses jetons (connexion). */
export async function issueSession(
  userId: string,
  rememberMe = false
): Promise<IssuedTokens> {
  const sessionId = crypto.randomUUID();
  const refreshTtl = rememberMe
    ? appConfig.auth.refreshTokenTtlRememberMe
    : appConfig.auth.refreshTokenTtl;
  const { accessToken, expires, ttl } = accessTokenFor(userId, sessionId);
  const refreshToken = newRefreshToken();

  await db.session.create({
    data: {
      id: sessionId,
      userId,
      sessionToken: accessToken,
      refreshToken,
      expires,
      refreshTokenExpires: new Date(Date.now() + refreshTtl * 1000),
      lastActivity: new Date(),
    },
  });

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresAt: ttl,
    refreshTokenExpiresAt: refreshTtl,
  };
}

/**
 * Échange un refresh token contre un nouveau couple de jetons (rotation).
 *
 * - Le refresh token présenté est remplacé ; l'ancien reste accepté pendant
 *   `refreshReuseGraceSeconds` (requêtes parallèles du même navigateur).
 * - Un ancien refresh token présenté après ce délai signale un vol probable :
 *   la session est supprimée et tous ses jetons deviennent invalides.
 */
export async function rotateRefreshToken(presented: string): Promise<RotateResult> {
  const now = new Date();
  let session = await db.session.findUnique({ where: { refreshToken: presented } });
  let withinGrace = false;

  if (!session) {
    const rotated = await db.session.findUnique({
      where: { previousRefreshToken: presented },
    });
    if (!rotated) {
      return { ok: false, error: "Token de rafraîchissement expiré ou introuvable", status: 403 };
    }

    const graceMs = appConfig.auth.refreshReuseGraceSeconds * 1000;
    const rotatedAt = rotated.refreshRotatedAt?.getTime() ?? 0;
    if (now.getTime() - rotatedAt > graceMs) {
      await db.session.deleteMany({ where: { id: rotated.id } });
      return { ok: false, error: "Session révoquée, veuillez vous reconnecter", status: 403 };
    }
    session = rotated;
    withinGrace = true;
  }

  if (session.refreshTokenExpires < now) {
    await db.session.deleteMany({ where: { id: session.id } });
    return { ok: false, error: "Token de rafraîchissement expiré ou introuvable", status: 403 };
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { isActive: true, isDeleted: true },
  });
  if (!user || user.isDeleted || !user.isActive) {
    await db.session.deleteMany({ where: { id: session.id } });
    return { ok: false, error: "Compte indisponible", status: 403 };
  }

  const { accessToken, expires, ttl } = accessTokenFor(session.userId, session.id);
  // Dans le délai de grâce, on renvoie le refresh token déjà émis sans nouvelle rotation
  let refreshToken = withinGrace ? session.refreshToken : newRefreshToken();

  if (!withinGrace) {
    // Rotation conditionnelle : si une requête parallèle a déjà fait tourner ce token,
    // on reprend le token qu'elle a émis au lieu de l'écraser.
    const rotated = await db.session.updateMany({
      where: { id: session.id, refreshToken: presented },
      data: {
        sessionToken: accessToken,
        expires,
        lastActivity: now,
        refreshToken,
        previousRefreshToken: presented,
        refreshRotatedAt: now,
      },
    });
    if (rotated.count === 0) {
      const current = await db.session.findUnique({ where: { id: session.id } });
      if (!current) {
        return { ok: false, error: "Token de rafraîchissement expiré ou introuvable", status: 403 };
      }
      refreshToken = current.refreshToken;
      withinGrace = true;
    }
  }

  if (withinGrace) {
    await db.session.update({
      where: { id: session.id },
      data: { sessionToken: accessToken, expires, lastActivity: now },
    });
  }

  return {
    ok: true,
    tokens: {
      accessToken,
      refreshToken,
      accessTokenExpiresAt: ttl,
      refreshTokenExpiresAt: Math.max(
        0,
        Math.floor((session.refreshTokenExpires.getTime() - now.getTime()) / 1000)
      ),
    },
  };
}

/** Supprime une session (déconnexion). */
export async function deleteSessionById(sessionId: string) {
  return db.session.deleteMany({ where: { id: sessionId } });
}

/** Supprime la session liée à un refresh token, courant ou tout juste remplacé. */
export async function deleteSessionByRefreshToken(refreshToken: string) {
  return db.session.deleteMany({
    where: {
      OR: [{ refreshToken }, { previousRefreshToken: refreshToken }],
    },
  });
}
