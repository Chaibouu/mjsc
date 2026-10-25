import { NextResponse } from "next/server";
import { requireContentEditorApi } from "@/lib/api-users-auth";
import { uploadEditorImage } from "@/lib/upload";

export const dynamic = "force-dynamic";

/**
 * POST /api/editor/images : image insérée dans une description (éditeur riche).
 * Réservé aux rôles qui éditent le contenu ; renvoie { url } à placer dans le HTML.
 */
export async function POST(req: Request) {
  try {
    const auth = await requireContentEditorApi();
    if (!auth.ok) return auth.response;

    const file = (await req.formData()).get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    const uploaded = await uploadEditorImage(file);
    return NextResponse.json({ url: uploaded.path }, { status: 201 });
  } catch (e) {
    console.error("POST /api/editor/images:", e);
    const msg = e instanceof Error ? e.message : "Téléversement impossible";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
