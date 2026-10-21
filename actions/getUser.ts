"use server";

import { getUserInfo, refreshUserToken } from "@/lib/user";
import { cookies } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { cache } from "react";

// Utiliser cache() pour optimiser les performances
export const getUser = cache(async () => {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;
    const refreshToken = cookieStore.get("refreshToken")?.value;

    // Si le refreshToken est absent, retourner une erreur
    if (!refreshToken) {
      return { error: "Token de rafraîchissement manquant" };
    }

    // Si l'accessToken est présent, essayer de le déchiffrer
    if (accessToken) {
      try {
        // Utiliser le token pour récupérer les informations de l'utilisateur
        const userData = await getUserInfo(accessToken);
        if (!userData.error) {
          return { user: userData };
        } else {
          return { error: userData.error };
        }
      } catch (error) {
        console.error(
          "Erreur lors de la vérification du token d'accès:",
          error
        );
      }
    }

    // Si l'`accessToken` est absent ou invalide, tenter de rafraîchir le token d'accès
    try {
      const refreshed = await refreshUserToken(refreshToken);
      if ("error" in refreshed) {
        return { error: refreshed.error };
      }

      const userData = await getUserInfo(refreshed.accessToken);
      // Le refresh token a tourné : l'appelant (middleware) doit enregistrer les deux jetons
      if (!userData.error) {
        return { user: userData, tokenInfo: refreshed };
      } else {
        return { error: userData.error };
      }
    } catch (error) {
      console.error("Erreur lors du rafraîchissement du token:", error);
      return { error: "Erreur lors du rafraîchissement" };
    }
  } catch (error) {
    // Laisser passer les erreurs internes de Next (rendu dynamique, redirect...)
    unstable_rethrow(error);
    console.error("Erreur générale dans getUser:", error);
    return { error: "Erreur serveur" };
  }
});
