import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/rateLimit";
import { db } from "@/lib/db";
import {
  generateVerificationTokenForModifyEmail,
  verifyVerificationToken,
} from "@/lib/tokens";
import {
  getVerificationTokenByTokenId,
  getVerificationTokenByToken,
} from "@/data/verification-token";
import { sendChangeEmailVerification } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const limited = await applyRateLimit(req, "change-email");
    if (limited) return limited;

    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Token manquant" }, { status: 400 });
    }

    const { tokenPayload, error } = await verifyVerificationToken(token);

    if (error === "Token expiré") {
      const storedToken = await getVerificationTokenByToken(token);
      // Seuls les tokens de changement d'email (liés à un userId) sont renouvelés ici
      if (!storedToken || !storedToken.userId) {
        return NextResponse.json(
          { error: "Token introuvable" },
          { status: 400 }
        );
      }

      const newToken = await generateVerificationTokenForModifyEmail(
        storedToken.email,
        storedToken.userId
      );
      await sendChangeEmailVerification(storedToken.email, newToken);

      return NextResponse.json(
        {
          error: "Token expiré. Un nouvel email de vérification a été envoyé.",
        },
        { status: 400 }
      );
    }

    if (error || !tokenPayload || typeof tokenPayload !== "object") {
      return NextResponse.json({ error: "Token invalide" }, { status: 400 });
    }

    const { email, tokenId, userId } = tokenPayload as {
      email?: string;
      tokenId?: string;
      userId?: string;
    };

    // Un token d'inscription ne contient pas de userId : il ne doit pas être accepté ici
    if (!email || !tokenId || !userId) {
      return NextResponse.json({ error: "Token invalide" }, { status: 400 });
    }

    const storedToken = await getVerificationTokenByTokenId(tokenId);
    if (
      !storedToken ||
      storedToken.userId !== userId ||
      storedToken.email !== email
    ) {
      return NextResponse.json(
        { error: "Token introuvable ou déjà utilisé" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, isDeleted: true },
    });

    if (!user || user.isDeleted) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    const emailTaken = await db.user.findUnique({
      where: { email: storedToken.email },
      select: { id: true },
    });
    if (emailTaken && emailTaken.id !== user.id) {
      return NextResponse.json(
        { error: "Cette adresse e-mail est déjà utilisée" },
        { status: 409 }
      );
    }

    await db.user.update({
      where: { id: user.id },
      data: { email: storedToken.email, emailVerified: new Date() },
    });

    await db.verificationToken.delete({ where: { id: storedToken.id } });

    return NextResponse.json(
      { message: "Adresse e-mail mise à jour avec succès." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la vérification de l'email :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
