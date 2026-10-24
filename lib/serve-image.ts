import { NextResponse } from "next/server";
import { getObject } from "@/lib/storage";

const MIMES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

// Les images de galerie ont un nom unique (jamais réécrit) : cache long. Les images à nom fixe
// (image principale {id}.ext, photo de profil {userId}.ext) peuvent être remplacées : cache court,
// les écrans ajoutant ?t={updatedAt} pour afficher tout de suite la nouvelle version.
const UNIQUE_NAME_CACHE = "public, max-age=86400, immutable";
const FIXED_NAME_CACHE = "public, max-age=60, stale-while-revalidate=300";

const ID_RE = /^[a-zA-Z0-9_-]+$/;
const FILENAME_RE = /^[a-zA-Z0-9_.-]+\.[a-z]+$/;

/**
 * Sert une image publique stockée sous {dir}/[{id}/]{filename} (R2, ou disque local pour les
 * fichiers envoyés avant la migration). Le type renvoyé dépend de l'extension : seules des
 * images peuvent sortir d'ici.
 */
export async function serveImage(dir: string, filename: string, id?: string): Promise<NextResponse> {
  if (id !== undefined && !ID_RE.test(id)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }
  if (!filename || !FILENAME_RE.test(filename) || filename.includes("..")) {
    return NextResponse.json({ error: "Nom de fichier invalide" }, { status: 400 });
  }

  const contentType = MIMES[filename.split(".").pop()?.toLowerCase() ?? ""];
  if (!contentType) {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }

  try {
    const key = id === undefined ? `${dir}/${filename}` : `${dir}/${id}/${filename}`;
    const object = await getObject(key);
    if (!object) {
      return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
    }
    return new NextResponse(object.body as BodyInit, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": id === undefined ? FIXED_NAME_CACHE : UNIQUE_NAME_CACHE,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    console.error(`GET /api/uploads/${dir}:`, e);
    return NextResponse.json({ error: "Erreur lecture fichier" }, { status: 500 });
  }
}
