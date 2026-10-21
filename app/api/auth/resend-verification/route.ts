import { NextResponse } from "next/server";
import { getUserByEmail } from "@/data/user";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";
import { ResendVerificationSchema } from "@/schemas";
import { applyRateLimit } from "@/lib/rateLimit";

// Même réponse que le compte existe ou non (pas d'énumération des comptes)
const GENERIC_MESSAGE =
  "Si un compte non vérifié existe pour cette adresse, un nouvel email de vérification a été envoyé.";

export async function POST(req: Request) {
  try {
    const limited = await applyRateLimit(req, "resend-verification");
    if (limited) return limited;

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "L'adresse email est requise" },
        { status: 400 }
      );
    }
    // Validation des données avec Zod
    const parsedData = ResendVerificationSchema.safeParse({ email });
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

    // Rien à envoyer si le compte n'existe pas, est supprimé ou déjà vérifié
    if (!user || user.isDeleted || user.emailVerified) {
      return NextResponse.json({ message: GENERIC_MESSAGE }, { status: 200 });
    }

    // Générer un nouveau token de vérification
    const verificationToken = await generateVerificationToken(
      user.email as string
    );

    // Envoyer un nouvel email de vérification
    await sendVerificationEmail(user.email as string, verificationToken);

    return NextResponse.json({ message: GENERIC_MESSAGE }, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de vérification :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
