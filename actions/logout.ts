"use server";

import { cookies } from "next/headers";
import { clearAuthCookies } from "@/lib/auth-cookies";

export const logout = async () => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  const refreshToken = cookieStore.get("refreshToken")?.value;

  try {
    if (accessToken || refreshToken) {
      // Supprime la session côté serveur : les deux jetons deviennent inutilisables
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/logout`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: accessToken, refreshToken }),
        }
      );

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        console.error("Erreur API logout:", result.error);
      }
    }

    return { success: "Déconnexion réussie" };
  } catch (error) {
    console.error("Erreur dans logoutAction:", error);
    return { error: "Erreur serveur" };
  } finally {
    // Les cookies sont toujours supprimés côté navigateur
    clearAuthCookies(cookieStore);
  }
};
