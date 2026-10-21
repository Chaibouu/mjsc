import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/api-users-auth";
import { assignableRoles, canManageUser, isRole } from "@/lib/roles";
import {
  getUserById,
  updateUser,
  softDeleteUser,
  type UpdateUserData,
} from "@/data/user";

export const dynamic = "force-dynamic";

/**
 * GET /api/users/[id]
 * Récupère un utilisateur par ID (ADMIN).
 */
export async function GET(
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

    const user = await getUserById(id);
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    const target = await db.user.findUnique({
      where: { id },
      select: { isDeleted: true },
    });
    if (!target || target.isDeleted) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Erreur GET /api/users/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * PATCH /api/users/[id]
 * Modifier les infos d'un utilisateur ou activer/désactiver son compte.
 * Un ADMIN ne gère que les comptes USER / ASSOCIATION ; le SUPER_ADMIN gère aussi ADMIN et WEBMASTER.
 * Body: { name?, firstName?, lastName?, email?, phone?, address?, bio?, role?, isActive?, ... }
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

    const target = await db.user.findUnique({
      where: { id },
      select: { id: true, isDeleted: true, role: true },
    });
    if (!target || target.isDeleted) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }
    if (!canManageUser(auth.role, target.role)) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas modifier ce compte" },
        { status: 403 }
      );
    }

    const body = (await req.json()) as Record<string, unknown>;
    const {
      name,
      firstName,
      lastName,
      email,
      phone,
      address,
      bio,
      role,
      isActive,
      sexe,
      nigerLanguage,
      image,
      profilePicture,
      headerPicture,
    } = body;

    const data: UpdateUserData = {};
    if (name !== undefined) data.name = name as string | null;
    if (firstName !== undefined) data.firstName = firstName as string | null;
    if (lastName !== undefined) data.lastName = lastName as string | null;
    if (email !== undefined) data.email = email as string | null;
    if (phone !== undefined) data.phone = phone as string | null;
    if (address !== undefined) data.address = address as string | null;
    if (bio !== undefined) data.bio = bio as string | null;
    if (role !== undefined) {
      if (!isRole(role) || !assignableRoles(auth.role).includes(role)) {
        return NextResponse.json(
          { error: "Vous ne pouvez pas attribuer ce rôle" },
          { status: 403 }
        );
      }
      data.role = role;
    }
    if (typeof isActive === "boolean") data.isActive = isActive;
    if (sexe === "MASCULIN" || sexe === "FEMININ" || sexe === null) data.sexe = sexe;
    if (Array.isArray(nigerLanguage)) data.nigerLanguage = nigerLanguage as UpdateUserData["nigerLanguage"];
    if (image !== undefined) data.image = image as string | null;
    if (profilePicture !== undefined) data.profilePicture = profilePicture as string | null;
    if (headerPicture !== undefined) data.headerPicture = headerPicture as string | null;

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "Aucune donnée à mettre à jour" },
        { status: 400 }
      );
    }

    if (data.isActive === false && id === auth.adminId) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas désactiver votre propre compte" },
        { status: 400 }
      );
    }

    if (typeof data.email === "string" && data.email.trim()) {
      const existing = await db.user.findFirst({
        where: { email: data.email.trim(), id: { not: id }, isDeleted: false },
      });
      if (existing) {
        return NextResponse.json(
          { error: "Un autre utilisateur utilise déjà cet email" },
          { status: 400 }
        );
      }
    }

    const user = await updateUser(id, data);
    const out = await getUserById(user.id);
    return NextResponse.json({ user: out });
  } catch (error) {
    console.error("Erreur PATCH /api/users/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * DELETE /api/users/[id]
 * Suppression logique (soft delete) d'un utilisateur (ADMIN).
 */
export async function DELETE(
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

    if (id === auth.adminId) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas supprimer votre propre compte" },
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
        { error: "Vous ne pouvez pas supprimer ce compte" },
        { status: 403 }
      );
    }

    await softDeleteUser(id);
    return NextResponse.json({ message: "Utilisateur supprimé" });
  } catch (error) {
    console.error("Erreur DELETE /api/users/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
