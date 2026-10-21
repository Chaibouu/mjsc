import { NextResponse } from "next/server";
import { generatePasswordResetToken } from "@/lib/tokens";
import { getUserByEmail } from "@/data/user";
import { sendPasswordResetEmail } from "@/lib/mail";
import { PasswordResetSchema } from "@/schemas";
import { applyRateLimit } from "@/lib/rateLimit";

// Même réponse que le compte existe ou non (pas d'énumération des comptes)
const GENERIC_MESSAGE =
  "Si un compte existe pour cette adresse, un email de réinitialisation a été envoyé.";

export async function POST(req: Request) {
  try {
    const limited = await applyRateLimit(req, "forgot-password");
    if (limited) return limited;

    const { email } = await req.json();

    // Vérifier si l'email est fourni
    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }
    // Validation des données avec Zod
    const parsedData = PasswordResetSchema.safeParse({ email });

    // Si la validation échoue, renvoyer les erreurs de Zod
    if (!parsedData.success) {
      return NextResponse.json(
        {
          error: parsedData.error.issues
            .map((issue) => issue.message)
            .join(", "),
        },
        { status: 400 }
      );
    }
    // Recherche de l'utilisateur par email
    const user = await getUserByEmail(email);
    if (!user || user.isDeleted) {
      return NextResponse.json({ message: GENERIC_MESSAGE }, { status: 200 });
    }

    // Générer un token de réinitialisation sécurisé
    const resetToken = await generatePasswordResetToken(user.email as string);

    // Envoyer un email avec le lien de réinitialisation de mot de passe
    await sendPasswordResetEmail(user.email as string, resetToken);

    return NextResponse.json({ message: GENERIC_MESSAGE }, { status: 200 });
  } catch (error) {
    console.error(
      "Erreur lors de la réinitialisation du mot de passe :",
      error
    );
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
