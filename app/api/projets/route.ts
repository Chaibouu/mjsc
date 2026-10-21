import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireContentEditorApi } from "@/lib/api-users-auth";
import { createProjetSchema } from "@/schemas/projet";
import {
  uploadProjetMainImage,
  uploadProjetGalleryImage,
} from "@/lib/upload";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const list = await db.projet.findMany({
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
    console.error("GET /api/projets:", e);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des projets" },
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
    const linkRaw = (formData.get("link") as string)?.trim();
    const link = linkRaw && linkRaw !== "" ? linkRaw : undefined;
    const mainImage = formData.get("mainImage") as File | null;
    const galleryFiles: File[] = [];

    const parsed = createProjetSchema.safeParse({ title, description, link });
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? "Données invalides";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    for (const [k, v] of formData.entries()) {
      if ((k === "gallery" || k.startsWith("gallery[")) && v instanceof File && v.size > 0)
        galleryFiles.push(v);
    }

    const created = await db.projet.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        link: parsed.data.link ?? null,
        image: null,
        gallery: [],
        createdBy: userId,
      },
    });

    let imagePath: string | null = null;
    if (mainImage && mainImage.size > 0) {
      const res = await uploadProjetMainImage(mainImage, created.id);
      imagePath = res.path;
    }

    const galleryPaths: string[] = [];
    for (const f of galleryFiles) {
      const g = await uploadProjetGalleryImage(f, created.id);
      galleryPaths.push(g.path);
    }

    await db.projet.update({
      where: { id: created.id },
      data: {
        image: imagePath,
        gallery: galleryPaths.length ? galleryPaths : [],
      },
    });

    const updated = await db.projet.findUnique({
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
      { data: updated, message: "Projet créé avec succès" },
      { status: 201 }
    );
  } catch (e) {
    console.error("POST /api/projets:", e);
    const msg = e instanceof Error ? e.message : "Erreur lors de la création";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
