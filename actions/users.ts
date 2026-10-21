"use server";

import { makeAuthenticatedRequest } from "./makeAuthenticatedRequest";
import type { Role } from "@/lib/roles";

const BASE = `${process.env.NEXT_PUBLIC_APP_URL}/api/users`;

export const getUsers = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
}) => {
  try {
    const p = params ?? {};
    const page = Math.max(1, p.page ?? 1);
    const limit = Math.min(100, Math.max(1, p.limit ?? 50));
    const search = typeof p.search === "string" ? p.search : undefined;
    const qs = new URLSearchParams();
    qs.set("page", String(page));
    qs.set("limit", String(limit));
    if (search?.trim()) qs.set("search", search.trim());

    const test = await makeAuthenticatedRequest(
      `${BASE}?${qs.toString()}`,
      "GET"
    );
    if (test && typeof test === "object" && "error" in test) {
      throw new Error((test as { error: string }).error);
    }
    if (test instanceof Response) {
      const d = await test.json();
      throw new Error((d as { error?: string }).error ?? "Erreur serveur");
    }
    return JSON.parse(JSON.stringify(test));
  } catch (error: unknown) {
    throw new Error(
      error instanceof Error ? error.message : "Échec de la récupération des utilisateurs"
    );
  }
};

export async function getUserById(id: string) {
  try {
    const test = await makeAuthenticatedRequest(
      `${BASE}/${encodeURIComponent(id)}`,
      "GET"
    );
    if (test && typeof test === "object" && "error" in test) {
      throw new Error((test as { error: string }).error);
    }
    if (test instanceof Response) {
      const d = await test.json();
      throw new Error((d as { error?: string }).error ?? "Erreur serveur");
    }
    return JSON.parse(JSON.stringify(test));
  } catch (error: unknown) {
    throw new Error(
      error instanceof Error ? error.message : "Échec de la récupération de l'utilisateur"
    );
  }
}

export async function updateUser(
  id: string,
  data: {
    name?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    bio?: string | null;
    role?: Role;
    isActive?: boolean;
    sexe?: "MASCULIN" | "FEMININ" | null;
    nigerLanguage?: string[];
    image?: string | null;
    profilePicture?: string | null;
    headerPicture?: string | null;
  }
) {
  try {
    const test = await makeAuthenticatedRequest(
      `${BASE}/${encodeURIComponent(id)}`,
      "PATCH",
      data
    );
    if (test && typeof test === "object" && "error" in test) {
      throw new Error((test as { error: string }).error);
    }
    if (test instanceof Response) {
      const d = await test.json();
      throw new Error((d as { error?: string }).error ?? "Erreur serveur");
    }
    return JSON.parse(JSON.stringify(test));
  } catch (error: unknown) {
    throw new Error(
      error instanceof Error ? error.message : "Échec de la mise à jour de l'utilisateur"
    );
  }
}

export async function deleteUser(id: string) {
  try {
    const test = await makeAuthenticatedRequest(
      `${BASE}/${encodeURIComponent(id)}`,
      "DELETE"
    );
    if (test && typeof test === "object" && "error" in test) {
      throw new Error((test as { error: string }).error);
    }
    if (test instanceof Response) {
      const d = await test.json();
      throw new Error((d as { error?: string }).error ?? "Erreur serveur");
    }
    return JSON.parse(JSON.stringify(test));
  } catch (error: unknown) {
    throw new Error(
      error instanceof Error ? error.message : "Échec de la suppression de l'utilisateur"
    );
  }
}

export async function updateUserPassword(id: string, newPassword: string) {
  try {
    const test = await makeAuthenticatedRequest(
      `${BASE}/${encodeURIComponent(id)}/password`,
      "PATCH",
      { newPassword }
    );
    if (test && typeof test === "object" && "error" in test) {
      throw new Error((test as { error: string }).error);
    }
    if (test instanceof Response) {
      const d = await test.json();
      throw new Error((d as { error?: string }).error ?? "Erreur serveur");
    }
    return JSON.parse(JSON.stringify(test));
  } catch (error: unknown) {
    throw new Error(
      error instanceof Error ? error.message : "Échec de la modification du mot de passe"
    );
  }
}
