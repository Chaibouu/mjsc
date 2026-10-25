import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireContentEditorApi } from "@/lib/api-users-auth";
import { cleanRichField } from "@/lib/rich-content";
import { updateProjetSchema } from "@/schemas/projet";
import {
  uploadProjetMainImage,
  uploadProjetGalleryImage,
  deleteProjetGalleryImage,
} from "@/lib/upload";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const a = await db.projet.findFirst({
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
      : NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
  } catch (e) {
    console.error("GET /api/projets/[id]:", e);
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
    const existing = await db.projet.findFirst({
      where: { id, isDeleted: false },
    });
    if (!existing) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
    }

    const formData = await req.formData();
    const title = (formData.get("title") as string)?.trim();
    const description = cleanRichField(formData.get("description"));
    const linkRaw = (formData.get("link") as string)?.trim();
    const link = linkRaw && linkRaw !== "" ? linkRaw : null;
    const mainImage = formData.get("mainImage") as File | null;
    const galleryRemoveRaw = formData.get("galleryRemove") as string | null;
    const galleryAdd: File[] = [];

    const parsed = updateProjetSchema.safeParse({
      title: title ?? undefined,
      description: description ?? undefined,
      link: link ?? undefined,
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

    let imagePath: string | null = existing.image;
    if (mainImage && mainImage.size > 0) {
      const res = await uploadProjetMainImage(mainImage, id);
      imagePath = res.path;
    }

    const currentGallery = (existing.gallery as string[]) ?? [];
    const afterRemove = currentGallery.filter((p) => !galleryRemove.includes(p));
    for (const p of galleryRemove) {
      await deleteProjetGalleryImage(p);
    }

    const added: string[] = [];
    for (const f of galleryAdd) {
      const g = await uploadProjetGalleryImage(f, id);
      added.push(g.path);
    }
    const newGallery = [...afterRemove, ...added];

    const data: Record<string, unknown> = {
      image: imagePath,
      gallery: newGallery,
      updatedBy: userId,
    };
    if (parsed.data.title !== undefined) data.title = parsed.data.title;
    if (parsed.data.description !== undefined) data.description = parsed.data.description ?? null;
    // Un champ "link" envoyé vide efface le lien existant
    if (formData.has("link")) data.link = link;

    const updated = await db.projet.update({
      where: { id },
      data: data as Parameters<typeof db.projet.update>[0]["data"],
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
      message: "Projet mis à jour avec succès",
    });
  } catch (e) {
    console.error("PUT /api/projets/[id]:", e);
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
    const existing = await db.projet.findFirst({
      where: { id, isDeleted: false },
    });
    if (!existing) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
    }

    await db.projet.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });

    return NextResponse.json({ message: "Projet supprimé" });
  } catch (e) {
    console.error("DELETE /api/projets/[id]:", e);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}
