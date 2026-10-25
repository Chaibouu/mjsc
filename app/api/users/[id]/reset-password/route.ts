import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/api-users-auth";
import { canManageUser } from "@/lib/roles";
import { db } from "@/lib/db";
import { generatePasswordResetToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/mail";

export const dynamic = "force-dynamic";

/**
 * POST /api/users/[id]/reset-password
 * Envoie à l'utilisateur un email avec un lien pour choisir un nouveau mot de passe
 * (selon la hiérarchie des rôles).
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi();
    if (!auth.ok) return auth.response;

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID utilisateur requis" }, { status: 400 });
    }

    const target = await db.user.findUnique({
      where: { id },
      select: { id: true, isDeleted: true, role: true, email: true },
    });
    if (!target || target.isDeleted) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }
    if (!canManageUser(auth.role, target.role)) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas réinitialiser le mot de passe de ce compte" },
        { status: 403 }
      );
    }
    if (!target.email) {
      return NextResponse.json(
        { error: "Ce compte n'a pas d'adresse email" },
        { status: 400 }
      );
    }

    const token = await generatePasswordResetToken(target.email);
    await sendPasswordResetEmail(target.email, token);
    return NextResponse.json({ message: `Lien de réinitialisation envoyé à ${target.email}` });
  } catch (error) {
    console.error("Erreur POST /api/users/[id]/reset-password:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
