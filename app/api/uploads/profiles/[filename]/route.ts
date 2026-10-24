import { NextRequest } from "next/server";
import { serveImage } from "@/lib/serve-image";

export const dynamic = "force-dynamic";

/** GET /api/uploads/profiles/[filename] : photo de profil. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  return serveImage("profiles", filename);
}
