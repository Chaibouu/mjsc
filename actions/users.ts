"use server";

import { makeAuthenticatedRequest } from "./makeAuthenticatedRequest";
import type { Role } from "@/lib/roles";
import type { CreateUserValues } from "@/schemas/user";

// Même organisation que les autres ressources : une action par opération, chacune passant par
// makeAuthenticatedRequest. Les erreurs sont renvoyées dans le résultat (et non levées) pour que
// leur message reste lisible côté client en production.

const BASE = `${process.env.NEXT_PUBLIC_APP_URL}/api/users`;

export type ActionResult<T = unknown> = { message?: string; error?: string } & T;

export type UserStatusFilter = "active" | "inactive";

export type UserListItem = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  isActive: boolean;
  image: string | null;
  profilePicture: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  emailVerified: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UserDetails = UserListItem & {
  address: string | null;
  bio: string | null;
  sexe: string | null;
  nigerLanguage?: string[];
};

export type UsersPage = {
  users: UserListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type UpdateUserInput = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: Role;
  isActive?: boolean;
};

/** Rend la réponse transmissible au client (objet simple), erreurs comprises. */
async function toResult<T>(res: unknown): Promise<ActionResult<Partial<T>>> {
  if (res instanceof Response) {
    const body = await res.json().catch(() => ({}));
    return { error: (body as { error?: string }).error ?? "Erreur serveur" } as ActionResult<Partial<T>>;
  }
  return JSON.parse(JSON.stringify(res ?? {}));
}

const userUrl = (id: string, suffix = "") => `${BASE}/${encodeURIComponent(id)}${suffix}`;

export const getUsers = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  role?: Role;
  status?: UserStatusFilter;
} = {}) => {
  const qs = new URLSearchParams();
  qs.set("page", String(Math.max(1, params.page ?? 1)));
  qs.set("limit", String(Math.min(100, Math.max(1, params.limit ?? 20))));
  if (params.search?.trim()) qs.set("search", params.search.trim());
  if (params.role) qs.set("role", params.role);
  if (params.status) qs.set("status", params.status);

  const res = await makeAuthenticatedRequest(`${BASE}?${qs.toString()}`, "GET");
  return toResult<UsersPage>(res);
};

export const createUser = async (data: CreateUserValues) => {
  const res = await makeAuthenticatedRequest(BASE, "POST", data);
  return toResult<{ user: { id: string; email: string } }>(res);
};

export const getUserById = async (id: string) => {
  const res = await makeAuthenticatedRequest(userUrl(id), "GET");
  return toResult<{ user: UserDetails }>(res);
};

export const updateUser = async (id: string, data: UpdateUserInput) => {
  const res = await makeAuthenticatedRequest(userUrl(id), "PATCH", data);
  return toResult<{ user: UserDetails }>(res);
};

/** Suppression logique : le compte passe en isDeleted = true. */
export const deleteUser = async (id: string) => {
  const res = await makeAuthenticatedRequest(userUrl(id), "DELETE");
  return toResult(res);
};

export const updateUserPassword = async (id: string, newPassword: string) => {
  const res = await makeAuthenticatedRequest(userUrl(id, "/password"), "PATCH", { newPassword });
  return toResult(res);
};

/** Envoie à l'utilisateur un lien de réinitialisation du mot de passe. */
export const sendUserPasswordReset = async (id: string) => {
  const res = await makeAuthenticatedRequest(userUrl(id, "/reset-password"), "POST");
  return toResult(res);
};
