'use server'
import { makeAuthenticatedRequest } from "./makeAuthenticatedRequest";

const BASE = `${process.env.NEXT_PUBLIC_APP_URL}/api/editor/images`;

/** Envoie une image de l'éditeur riche ; renvoie { url } ou { error }. */
export const uploadEditorImage = async (body: FormData): Promise<{ url?: string; error?: string }> => {
  const res = await makeAuthenticatedRequest(BASE, "POST", body);
  if (res instanceof Response) {
    const data = await res.json().catch(() => ({}));
    return { error: (data as { error?: string }).error ?? "Téléversement impossible" };
  }
  return JSON.parse(JSON.stringify(res ?? {}));
};
