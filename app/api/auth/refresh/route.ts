import { NextResponse } from "next/server";
import { rotateRefreshToken } from "@/data/session";

/**
 * POST /api/auth/refresh
 * Échange un refresh token contre un nouveau jeton d'accès ET un nouveau refresh token.
 * Le client doit remplacer les deux cookies.
 */
export async function POST(req: Request) {
  try {
    const { refreshToken } = await req.json();

    if (!refreshToken || typeof refreshToken !== "string") {
      return NextResponse.json(
        { error: "Token de rafraîchissement manquant" },
        { status: 400 }
      );
    }

    const result = await rotateRefreshToken(refreshToken);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result.tokens);
  } catch (error) {
    console.error("Erreur lors du rafraîchissement des tokens :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
