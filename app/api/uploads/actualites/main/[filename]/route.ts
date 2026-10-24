import { NextRequest } from "next/server";
import { serveImage } from "@/lib/serve-image";

export const dynamic = "force-dynamic";

/** GET /api/uploads/actualites/main/[filename] : image principale (actualité). */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  return serveImage("actualites/main", filename);
}
