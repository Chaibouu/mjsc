import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/api-users-auth";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getUsers } from "@/data/user";
import { assignableRoles, isRole } from "@/lib/roles";
import { CreateUserSchema } from "@/schemas/user";

export const dynamic = "force-dynamic";

/**
 * GET /api/users
 * Récupère la liste des utilisateurs (réservé aux ADMIN).
 * Query: ?page=1&limit=50&search=...&role=USER&status=active|inactive
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdminApi();
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10) || 50));
    const search = searchParams.get("search") ?? undefined;
    const roleParam = searchParams.get("role");
    const role = isRole(roleParam) ? roleParam : undefined;
    const statusParam = searchParams.get("status");
    const status = statusParam === "active" || statusParam === "inactive" ? statusParam : undefined;

    const result = await getUsers({ page, limit, search, role, status });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Erreur GET /api/users:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * POST /api/users
 * Crée un compte de la plateforme (réservé aux ADMIN). Le compte est actif et son email
 * considéré comme vérifié. Un ADMIN ne crée que des comptes USER / ASSOCIATION ;
 * le SUPER_ADMIN crée aussi des ADMIN et des WEBMASTER.
 * Body: { firstName, lastName, email, phone?, role, password }
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdminApi();
    if (!auth.ok) return auth.response;

    const parsed = CreateUserSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((issue) => issue.message).join(", ") },
        { status: 400 }
      );
    }
    const { firstName, lastName, email, phone, role, password } = parsed.data;

    if (!assignableRoles(auth.role).includes(role)) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas attribuer ce rôle" },
        { status: 403 }
      );
    }

    const existing = await db.user.findUnique({
      where: { email },
      select: { isDeleted: true },
    });
    if (existing) {
      return NextResponse.json(
        {
          error: existing.isDeleted
            ? "Cet email appartient à un compte supprimé"
            : "Un utilisateur utilise déjà cet email",
        },
        { status: 400 }
      );
    }

    const user = await db.user.create({
      data: {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        email,
        phone: phone || null,
        role,
        password: await bcrypt.hash(password, 10),
        isActive: true,
        emailVerified: new Date(),
      },
      select: { id: true, email: true },
    });

    return NextResponse.json({ message: "Utilisateur créé", user }, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/users:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
