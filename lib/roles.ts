/**
 * Rôles de la plateforme et règles d'autorisation associées.
 *
 * - SUPER_ADMIN : accès total, administre les administrateurs et le webmaster.
 *   Créé uniquement par le seed (variables SUPER_ADMIN_* du .env).
 * - ADMIN       : administre la plateforme (utilisateurs, associations, contenus).
 * - WEBMASTER   : gère le site web public (actualités, articles, projets, médias).
 * - USER, ASSOCIATION : comptes standards.
 */

export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  WEBMASTER: "WEBMASTER",
  USER: "USER",
  ASSOCIATION: "ASSOCIATION",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ALL_ROLES: readonly Role[] = Object.values(ROLES);

/** Administration de la plateforme (utilisateurs, associations, référentiels). */
export const ADMIN_ROLES: readonly Role[] = [ROLES.SUPER_ADMIN, ROLES.ADMIN];

/** Gestion des contenus du site web public. */
export const CONTENT_ROLES: readonly Role[] = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.WEBMASTER,
];

/** Comptes à privilèges : seul le SUPER_ADMIN peut les gérer. */
export const PRIVILEGED_ROLES: readonly Role[] = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.WEBMASTER,
];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ALL_ROLES as readonly string[]).includes(value);
}

export function hasRole(role: string | null | undefined, allowed: readonly Role[]): boolean {
  return isRole(role) && allowed.includes(role);
}

/** Rôles qu'un utilisateur peut attribuer. Le rôle SUPER_ADMIN n'est jamais attribuable. */
export function assignableRoles(actorRole: string | null | undefined): Role[] {
  if (actorRole === ROLES.SUPER_ADMIN) {
    return [ROLES.ADMIN, ROLES.WEBMASTER, ROLES.USER, ROLES.ASSOCIATION];
  }
  if (actorRole === ROLES.ADMIN) {
    return [ROLES.USER, ROLES.ASSOCIATION];
  }
  return [];
}

/**
 * Indique si `actorRole` peut modifier, réinitialiser ou supprimer un compte de rôle `targetRole`.
 * Un compte SUPER_ADMIN n'est jamais modifiable par cette voie.
 */
export function canManageUser(
  actorRole: string | null | undefined,
  targetRole: string | null | undefined
): boolean {
  if (targetRole === ROLES.SUPER_ADMIN) return false;
  if (actorRole === ROLES.SUPER_ADMIN) return true;
  if (actorRole === ROLES.ADMIN) {
    return !hasRole(targetRole, PRIVILEGED_ROLES);
  }
  return false;
}
