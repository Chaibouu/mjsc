import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireContentEditorApi } from "@/lib/api-users-auth";
import { createMediaSchema } from "@/schemas/media";
import { uploadMediaGalleryImage } from "@/lib/upload";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const list = await db.media.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: "desc" },
      include: {
        createdByUser: {
          select: { id: true, name: true, email: true, firstName: true, lastName: true },
        },
        updatedByUser: {
          select: { id: true, name: true, email: true, firstName: true, lastName: true },
        },
      },
    });
    return NextResponse.json(list);
  } catch (e) {
    console.error("GET /api/medias:", e);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des médias" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireContentEditorApi();
    if (!auth.ok) return auth.response;
    const userId = auth.adminId;

    const formData = await req.formData();
    const title = (formData.get("title") as string)?.trim();
    const description = (formData.get("description") as string)?.trim() || undefined;
    const galleryFiles: File[] = [];

    const parsed = createMediaSchema.safeParse({ title, description });
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? "Données invalides";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    for (const [k, v] of formData.entries()) {
      if ((k === "gallery" || k.startsWith("gallery[")) && v instanceof File && v.size > 0)
        galleryFiles.push(v);
    }

    const created = await db.media.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        gallery: [],
        createdBy: userId,
      },
    });

    const galleryPaths: string[] = [];
    for (const f of galleryFiles) {
      const g = await uploadMediaGalleryImage(f, created.id);
      galleryPaths.push(g.path);
    }

    if (galleryPaths.length > 0) {
      await db.media.update({
        where: { id: created.id },
        data: { gallery: galleryPaths },
      });
    }

    const updated = await db.media.findUnique({
      where: { id: created.id },
      include: {
        createdByUser: {
          select: { id: true, name: true, email: true, firstName: true, lastName: true },
        },
        updatedByUser: {
          select: { id: true, name: true, email: true, firstName: true, lastName: true },
        },
      },
    });
    return NextResponse.json(
      { data: updated, message: "Média créé avec succès" },
      { status: 201 }
    );
  } catch (e) {
    console.error("POST /api/medias:", e);
    const msg = e instanceof Error ? e.message : "Erreur lors de la création";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
