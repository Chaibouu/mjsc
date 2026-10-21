import { isAuthTokens, type AuthTokens } from "@/lib/auth-cookies";

/**
 * Échange le refresh token contre de nouveaux jetons. Le refresh token est remplacé
 * à chaque appel : l'appelant doit enregistrer les deux jetons renvoyés.
 */
export const refreshUserToken = async (
  refreshToken: string
): Promise<AuthTokens | { error: string }> => {
  const refreshResponse = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/refresh`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    }
  );

  if (!refreshResponse.ok) {
    return { error: "Impossible de rafraîchir le token" };
  }
  const result = await refreshResponse.json();
  return isAuthTokens(result) ? result : { error: "Réponse de rafraîchissement invalide" };
};

export const getUserInfo = async (accessToken: string) => {
  const userResponse = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/profile`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  if (!userResponse.ok) {
    return {
      error:
        "Impossible de récupérer les informations de l'utilisateur après rafraîchissement",
    };
  }
  return await userResponse.json();
};
