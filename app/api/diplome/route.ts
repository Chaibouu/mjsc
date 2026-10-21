import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/errors";
import { requireAdminApi } from "@/lib/api-users-auth";
import { DiplomeSchema } from "@/schemas/diplome";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const fields = await db.diplome.findMany({
      where: { isDeleted: false },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(fields);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdminApi();
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const validation = DiplomeSchema.safeParse(body);
    if (!validation.success) {
      const msg = validation.error.errors[0]?.message ?? "Données invalides";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { name } = validation.data;

    // Vérification de l'unicité
    const existingField = await db.diplome.findFirst({
      where: { name, isDeleted: false },
    });

    if (existingField) {
      return NextResponse.json(
        { error: "Ce diplome existe déjà" },
        { status: 409 }
      );
    }

    const newField = await db.diplome.create({
      data: { name },
    });

    return NextResponse.json(
      { data: newField, message: "Diplome créé avec succès" },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
