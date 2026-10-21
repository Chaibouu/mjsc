import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromToken } from "@/lib/tokens";
import { db } from "@/lib/db";
import { ADMIN_ROLES, hasRole } from "@/lib/roles";

export type AssociationAuthResult =
  | { ok: true; userId: string; isAdmin: boolean; associationId?: string }
  | { ok: false; response: NextResponse };

function getToken(req: NextRequest): string | null {
  return req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "").trim() ?? null;
}

/**
 * Vérifie l'auth et que l'utilisateur peut gérer l'association (ADMIN ou association liée).
 * Si associationId fourni, vérifie aussi que l'association existe et n'est pas supprimée.
 */
export async function requireAssociationAccess(
  req: NextRequest,
  associationId?: string
): Promise<AssociationAuthResult> {
  return checkAssociationAccess(getToken(req), associationId);
}

/**
 * Même vérification que requireAssociationAccess, à partir d'un token déjà extrait
 * (en-tête Authorization ou cookie accessToken).
 */
export async function checkAssociationAccess(
  token: string | null,
  associationId?: string
): Promise<AssociationAuthResult> {
  if (!token) {
    return { ok: false, response: NextResponse.json({ error: "Token manquant" }, { status: 401 }) };
  }

  const userId = await getUserIdFromToken(token);
  if (!userId) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Token invalide ou expiré" }, { status: 403 }),
    };
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true, isDeleted: true, id: true },
  });
  if (!user || user.isDeleted) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Utilisateur introuvable" }, { status: 403 }),
    };
  }

  const isAdmin = hasRole(user.role, ADMIN_ROLES);

  if (associationId) {
    const assoc = await db.association.findFirst({
      where: { id: associationId, isDeleted: false },
      select: { id: true, userId: true },
    });
    if (!assoc) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Association non trouvée" }, { status: 404 }),
      };
    }
    const canManage = isAdmin || assoc.userId === userId;
    if (!canManage) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Vous ne pouvez pas modifier cette association" },
          { status: 403 }
        ),
      };
    }
    return { ok: true, userId, isAdmin, associationId: assoc.id };
  }

  return { ok: true, userId, isAdmin };
}
