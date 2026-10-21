import { NextResponse } from "next/server";
import { getSessionFromToken } from "@/lib/tokens";
import { deleteSessionById, deleteSessionByRefreshToken } from "@/data/session";

/**
 * POST /api/auth/logout
 * Body: { token?: string, refreshToken?: string }
 * Supprime la session : le jeton d'accès et le refresh token deviennent
 * immédiatement inutilisables, même avant leur expiration.
 */
export async function POST(req: Request) {
  try {
    const { token, refreshToken } = (await req.json()) as {
      token?: string;
      refreshToken?: string;
    };

    if (!token && !refreshToken) {
      return NextResponse.json(
        { error: "Token d'accès ou de rafraîchissement manquant" },
        { status: 400 }
      );
    }

    if (refreshToken) {
      await deleteSessionByRefreshToken(refreshToken);
    }

    if (token) {
      const session = await getSessionFromToken(token);
      if (session) await deleteSessionById(session.sessionId);
    }

    // Réponse identique que la session ait existé ou non
    return NextResponse.json({ message: "Déconnexion réussie" }, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la déconnexion :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
