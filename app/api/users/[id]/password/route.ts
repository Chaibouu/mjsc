import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireAdminApi } from "@/lib/api-users-auth";
import { canManageUser } from "@/lib/roles";
import { db } from "@/lib/db";
import { setUserPassword } from "@/data/user";
import { passwordSchema } from "@/lib/validation-utils";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/users/[id]/password
 * Modifier le mot de passe d'un utilisateur (selon la hiérarchie des rôles).
 * Body: { newPassword: string }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi();
    if (!auth.ok) return auth.response;

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID utilisateur requis" }, { status: 400 });
    }

    const body = await req.json();
    const { newPassword } = body ?? {};
    const parsed = passwordSchema.safeParse(newPassword);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Mot de passe invalide" },
        { status: 400 }
      );
    }

    const target = await db.user.findUnique({
      where: { id },
      select: { id: true, isDeleted: true, role: true },
    });
    if (!target || target.isDeleted) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }
    if (!canManageUser(auth.role, target.role)) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas modifier le mot de passe de ce compte" },
        { status: 403 }
      );
    }

    const hashed = await bcrypt.hash(parsed.data, 10);
    await setUserPassword(id, hashed);
    return NextResponse.json({ message: "Mot de passe modifié" });
  } catch (error) {
    console.error("Erreur PATCH /api/users/[id]/password:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
