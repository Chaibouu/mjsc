import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireContentEditorApi } from "@/lib/api-users-auth";
import { updateMediaSchema } from "@/schemas/media";
import {
  uploadMediaGalleryImage,
  deleteMediaGalleryImage,
} from "@/lib/upload";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const a = await db.media.findFirst({
      where: { id, isDeleted: false },
      include: {
        createdByUser: {
          select: { id: true, name: true, email: true, firstName: true, lastName: true },
        },
        updatedByUser: {
          select: { id: true, name: true, email: true, firstName: true, lastName: true },
        },
        deletedByUser: {
          select: { id: true, name: true, email: true, firstName: true, lastName: true },
        },
      },
    });
    return a
      ? NextResponse.json(a)
      : NextResponse.json({ error: "Média non trouvé" }, { status: 404 });
  } catch (e) {
    console.error("GET /api/medias/[id]:", e);
    return NextResponse.json(
      { error: "Erreur lors de la récupération" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireContentEditorApi();
    if (!auth.ok) return auth.response;
    const userId = auth.adminId;

    const { id } = await params;
    const existing = await db.media.findFirst({
      where: { id, isDeleted: false },
    });
    if (!existing) {
      return NextResponse.json({ error: "Média non trouvé" }, { status: 404 });
    }

    const formData = await req.formData();
    const title = (formData.get("title") as string)?.trim();
    const description = (formData.get("description") as string)?.trim();
    const galleryRemoveRaw = formData.get("galleryRemove") as string | null;
    const galleryAdd: File[] = [];

    const parsed = updateMediaSchema.safeParse({
      title: title ?? undefined,
      description: description ?? undefined,
    });
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? "Données invalides";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    for (const [k, v] of formData.entries()) {
      if ((k === "galleryAdd" || k.startsWith("galleryAdd[")) && v instanceof File && v.size > 0)
        galleryAdd.push(v);
    }

    let galleryRemove: string[] = [];
    if (typeof galleryRemoveRaw === "string") {
      try {
        const arr = JSON.parse(galleryRemoveRaw) as unknown;
        galleryRemove = Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
      } catch {
        galleryRemove = [];
      }
    }

    const currentGallery = (existing.gallery as string[]) ?? [];
    const afterRemove = currentGallery.filter((p) => !galleryRemove.includes(p));
    for (const p of galleryRemove) {
      await deleteMediaGalleryImage(p);
    }

    const added: string[] = [];
    for (const f of galleryAdd) {
      const g = await uploadMediaGalleryImage(f, id);
      added.push(g.path);
    }
    const newGallery = [...afterRemove, ...added];

    const data: Record<string, unknown> = {
      gallery: newGallery,
      updatedBy: userId,
    };
    if (parsed.data.title !== undefined) data.title = parsed.data.title;
    if (parsed.data.description !== undefined) data.description = parsed.data.description ?? null;

    const updated = await db.media.update({
      where: { id },
      data: data as Parameters<typeof db.media.update>[0]["data"],
      include: {
        createdByUser: {
          select: { id: true, name: true, email: true, firstName: true, lastName: true },
        },
        updatedByUser: {
          select: { id: true, name: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    return NextResponse.json({
      data: updated,
      message: "Média mis à jour avec succès",
    });
  } catch (e) {
    console.error("PUT /api/medias/[id]:", e);
    const msg = e instanceof Error ? e.message : "Erreur lors de la mise à jour";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireContentEditorApi();
    if (!auth.ok) return auth.response;
    const userId = auth.adminId;

    const { id } = await params;
    const existing = await db.media.findFirst({
      where: { id, isDeleted: false },
    });
    if (!existing) {
      return NextResponse.json({ error: "Média non trouvé" }, { status: 404 });
    }

    await db.media.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });

    return NextResponse.json({ message: "Média supprimé" });
  } catch (e) {
    console.error("DELETE /api/medias/[id]:", e);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}
