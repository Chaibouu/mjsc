import { NextRequest } from "next/server";
import { serveImage } from "@/lib/serve-image";

export const dynamic = "force-dynamic";

/** GET /api/uploads/actualites/gallery/[id]/[filename] : image de galerie (actualité). */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; filename: string }> }
) {
  const { id, filename } = await params;
  return serveImage("actualites/gallery", filename, id);
}
