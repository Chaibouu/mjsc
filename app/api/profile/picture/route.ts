import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromToken } from "@/lib/tokens";
import { db } from "@/lib/db";
import { uploadProfilePicture } from "@/lib/upload";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

async function getUserId(req: NextRequest) {
  const headersList = await headers();
  const auth = headersList.get("Authorization") ?? req.headers.get("Authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  return getUserIdFromToken(token);
}

/**
 * POST /api/profile/picture
 * FormData :
 * - "avatar" (string) : chemin d'un avatar prédéfini ex. /avatar/man.png
 * - "file" (File) : image depuis l'appareil → stockée sous profiles/{userId}.ext (R2 ou disque local), remplace l'ancienne
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const formData = await req.formData();
    const avatar = formData.get("avatar");
    const file = formData.get("file");

    if (typeof avatar === "string" && avatar.trim()) {
      const path = avatar.trim();
      await db.user.update({
        where: { id: userId },
        data: { profilePicture: path, image: path },
      });
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { id: true, profilePicture: true, image: true, name: true, email: true },
      });
      return NextResponse.json({ success: true, user });
    }

    if (file instanceof File && file.size > 0) {
      const result = await uploadProfilePicture(file, userId);
      await db.user.update({
        where: { id: userId },
        data: { profilePicture: result.path, image: result.path },
      });
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { id: true, profilePicture: true, image: true, name: true, email: true },
      });
      return NextResponse.json({ success: true, user });
    }

    return NextResponse.json(
      { error: "Fournir soit 'avatar' (chemin) soit 'file' (image)" },
      { status: 400 }
    );
  } catch (e) {
    console.error("Erreur POST /api/profile/picture:", e);
    const message = e instanceof Error ? e.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
