"use server";

import { cookies } from "next/headers";
import { refreshUserToken } from "@/lib/user";
import { setAuthCookies } from "@/lib/auth-cookies";

export const refresh = async () => {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (!refreshToken) {
      return { error: "Token de rafraîchissement manquant" };
    }

    const result = await refreshUserToken(refreshToken);
    if ("error" in result) {
      return { error: result.error };
    }

    // Le refresh token a tourné : on remplace les deux cookies
    setAuthCookies(cookieStore, result);

    return { success: "Token rafraîchi avec succès" };
  } catch (error) {
    console.error("Erreur dans refreshAction:", error);
    return { error: "Erreur serveur" };
  }
};
