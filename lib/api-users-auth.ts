import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getUserIdFromToken } from "@/lib/tokens";
import { db } from "@/lib/db";
import { ADMIN_ROLES, CONTENT_ROLES, hasRole, type Role } from "@/lib/roles";

export type AdminAuthResult =
  | { ok: true; adminId: string; role: Role }
  | { ok: false; response: NextResponse };

/**
 * Vérifie que la requête est authentifiée et que l'utilisateur a l'un des rôles autorisés.
 */
export async function requireRoleApi(
  allowedRoles: readonly Role[],
  forbiddenMessage = "Accès non autorisé pour votre rôle"
): Promise<AdminAuthResult> {
  const headersList = await headers();
  const token = headersList.get("Authorization")?.replace(/^Bearer\s+/i, "").trim();
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

  const current = await db.user.findUnique({
    where: { id: userId },
    select: { role: true, isDeleted: true, isActive: true },
  });
  if (!current || current.isDeleted || current.isActive === false) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Utilisateur introuvable" }, { status: 403 }),
    };
  }
  if (!hasRole(current.role, allowedRoles)) {
    return {
      ok: false,
      response: NextResponse.json({ error: forbiddenMessage }, { status: 403 }),
    };
  }

  return { ok: true, adminId: userId, role: current.role as Role };
}

/**
 * Administration de la plateforme : SUPER_ADMIN et ADMIN.
 * À utiliser dans les routes /api/users/*, référentiels, etc.
 */
export function requireAdminApi(): Promise<AdminAuthResult> {
  return requireRoleApi(ADMIN_ROLES, "Accès réservé aux administrateurs");
}

/**
 * Contenus du site web public : SUPER_ADMIN, ADMIN et WEBMASTER.
 */
export function requireContentEditorApi(): Promise<AdminAuthResult> {
  return requireRoleApi(CONTENT_ROLES, "Accès réservé aux gestionnaires du site web");
}
