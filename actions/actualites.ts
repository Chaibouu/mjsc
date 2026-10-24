'use server'
import { makeAuthenticatedRequest } from "./makeAuthenticatedRequest";

// Même organisation que les autres ressources : une action par opération, chacune passant par
// makeAuthenticatedRequest (jetons et rafraîchissement gérés automatiquement).

const BASE = `${process.env.NEXT_PUBLIC_APP_URL}/api/actualites`;

export type ActionResult<T = unknown> = { message?: string; error?: string; data?: T };

/** Rend la réponse transmissible au client (objet simple), erreurs comprises. */
async function toResult<T>(res: unknown): Promise<ActionResult<T>> {
  if (res instanceof Response) {
    const body = await res.json().catch(() => ({}));
    return { error: (body as { error?: string }).error ?? "Erreur serveur" };
  }
  return JSON.parse(JSON.stringify(res ?? {}));
}

export const fetchActualites = async () => {
  const res = await makeAuthenticatedRequest(BASE, "GET");
  const result = await toResult(res);
  // La route renvoie directement le tableau des actualités
  return Array.isArray(result) ? result : [];
};

export const postActualite = async (body: FormData) => {
  const res = await makeAuthenticatedRequest(BASE, "POST", body);
  return toResult(res);
};

export const putActualite = async ({ body, id }: { body: FormData; id: string }) => {
  const res = await makeAuthenticatedRequest(`${BASE}/${encodeURIComponent(id)}`, "PUT", body);
  return toResult(res);
};

export const deleteActualite = async (id: string) => {
  const res = await makeAuthenticatedRequest(`${BASE}/${encodeURIComponent(id)}`, "DELETE");
  return toResult(res);
};
