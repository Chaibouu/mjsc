"use server";

import { clientRequestHeaders } from "@/lib/forward-headers";
import { LoginSchema } from "@/schemas";
import { cookies } from "next/headers";
import { isAuthTokens, setAuthCookies } from "@/lib/auth-cookies";

export const login = async (data: {
  email: string;
  password: string;
  rememberMe?: boolean;
}) => {
  // Valider les données avec Zod
  const validatedData = LoginSchema.safeParse(data);

  if (!validatedData.success) {
    return {
      error: validatedData.error.issues
        .map((issue) => issue.message)
        .join(", "),
    };
  }

  const { email, password, rememberMe } = validatedData.data;

  try {
    // Appeler l'API login
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await clientRequestHeaders()),
        },
        body: JSON.stringify({ email, password, rememberMe }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      // Afficher l'erreur envoyée par le backend
      return { error: result.error || "Erreur lors de la connexion" };
    }

    if (!isAuthTokens(result)) {
      return { error: "Réponse de connexion invalide" };
    }

    // Cookies httpOnly pour le jeton d'accès et le refresh token
    setAuthCookies(await cookies(), result);

    return { success: "Connexion réussie" };
  } catch (error) {
    console.error("Erreur dans loginAction:", error);
    return { error: "Erreur serveur" };
  }
};
