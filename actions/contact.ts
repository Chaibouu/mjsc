"use server";

import { headers } from "next/headers";
import { ContactSchema, type ContactValues } from "@/schemas/contact";
import { applyRateLimit } from "@/lib/rateLimit";
import { sendContactMessageEmail } from "@/lib/mail";

export const sendContactMessage = async (
  data: ContactValues
): Promise<{ success: string } | { error: string }> => {
  const validated = ContactSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.issues.map((issue) => issue.message).join(", ") };
  }

  const { website, ...message } = validated.data;
  // Robot : on fait comme si l'envoi avait réussi
  if (website) return { success: "Votre message a bien été envoyé." };

  const limited = await applyRateLimit({ headers: await headers() }, "contact");
  if (limited) return { error: "Trop de messages envoyés, veuillez réessayer plus tard." };

  try {
    await sendContactMessageEmail(message);
    return { success: "Votre message a bien été envoyé." };
  } catch (error) {
    console.error("Erreur d'envoi du formulaire de contact :", error);
    return { error: "Le message n'a pas pu être envoyé. Veuillez réessayer plus tard." };
  }
};
