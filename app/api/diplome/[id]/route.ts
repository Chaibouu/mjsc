import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/errors";
import { requireAdminApi } from "@/lib/api-users-auth";
import { DiplomeSchema } from "@/schemas/diplome";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const field = await db.diplome.findFirst({
      where: { id, isDeleted: false },
    });
    return field
      ? NextResponse.json(field)
      : NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi();
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const existing = await db.diplome.findFirst({
      where: { id, isDeleted: false },
    });
    if (!existing) {
      return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
    }

    const body = await req.json();
    const validation = DiplomeSchema.safeParse(body);
    if (!validation.success) {
      const msg = validation.error.errors[0]?.message ?? "Données invalides";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { name } = validation.data;

    const duplicate = await db.diplome.findFirst({
      where: { name, isDeleted: false, NOT: { id } },
    });
    if (duplicate) {
      return NextResponse.json(
        { error: "Ce diplome existe déjà" },
        { status: 409 }
      );
    }

    const updatedField = await db.diplome.update({
      where: { id },
      data: { name },
    });

    return NextResponse.json({
      data: updatedField,
      message: "Diplome mis à jour avec succès",
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi();
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const existing = await db.diplome.findFirst({
      where: { id, isDeleted: false },
    });
    if (!existing) {
      return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
    }

    // Le nom est unique : on le préfixe pour pouvoir recréer un diplôme du même nom
    const deletedAt = new Date();
    await db.diplome.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt,
        deletedBy: auth.adminId,
        name: `deleted_${deletedAt.getTime()}_${existing.name}`,
      },
    });

    return NextResponse.json({ message: "Diplome supprimé" });
  } catch (error) {
    return handleApiError(error);
  }
}
