"use server";

import { clientRequestHeaders } from "@/lib/forward-headers";
export const resendVerification = async (email: string) => {
  try {
    // Appeler l'API resend-verification
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/resend-verification`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await clientRequestHeaders()),
        },
        body: JSON.stringify({ email }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      // Afficher l'erreur envoyée par le backend
      return {
        error:
          result.error || "Erreur lors de l'envoi de l'email de vérification",
      };
    }

    return {
      success:
        result.message ||
        "Si un compte non vérifié existe pour cette adresse, un nouvel email de vérification a été envoyé.",
    };
  } catch (error) {
    console.error("Erreur dans resendVerificationAction:", error);
    return { error: "Erreur serveur" };
  }
};
