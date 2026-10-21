import { NextRequest, NextResponse } from "next/server";
import { getObject } from "@/lib/storage";
import { checkAssociationAccess } from "@/lib/api-association-auth";

export const dynamic = "force-dynamic";

const KINDS = ["logo", "statuts", "reglement", "recepisse", "pv", "dirigeants", "documents"] as const;
// Le logo est affiché publiquement ; tous les autres fichiers sont confidentiels
const PUBLIC_KINDS: readonly string[] = ["logo"];
const MIMES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  pdf: "application/pdf",
};

function getToken(req: NextRequest): string | null {
  const header = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "").trim();
  return header || req.cookies.get("accessToken")?.value || null;
}

/**
 * GET /api/uploads/associations/[id]/[kind]/[filename]
 * Sert logo (public), statuts, règlement, récépissé, PV, pièces dirigeants, documents
 * (réservés à l'ADMIN et au compte lié à l'association).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; kind: string; filename: string }> }
) {
  const { id, kind, filename } = await params;
  if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }
  if (!KINDS.includes(kind as (typeof KINDS)[number])) {
    return NextResponse.json({ error: "Type invalide" }, { status: 400 });
  }
  if (!filename || !/^[a-zA-Z0-9_-][a-zA-Z0-9_.-]*\.[a-z]+$/.test(filename) || filename.includes("..")) {
    return NextResponse.json({ error: "Nom de fichier invalide" }, { status: 400 });
  }

  const isPublic = PUBLIC_KINDS.includes(kind);
  if (!isPublic) {
    const auth = await checkAssociationAccess(getToken(req), id);
    if (!auth.ok) return auth.response;
  }

  try {
    const object = await getObject(`associations/${id}/${kind}/${filename}`);
    if (!object) {
      return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
    }

    const ext = filename.split(".").pop()?.toLowerCase() ?? "";
    return new NextResponse(Buffer.from(object.body), {
      headers: {
        "Content-Type": MIMES[ext] ?? "application/octet-stream",
        "Cache-Control": isPublic
          ? "public, max-age=300"
          : "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("GET /api/uploads/associations:", error);
    return NextResponse.json({ error: "Erreur lecture fichier" }, { status: 500 });
  }
}
