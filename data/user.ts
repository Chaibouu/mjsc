import type { Role } from "@/lib/roles";
import { db } from "@/lib/db";

// Les erreurs de base de données remontent : les avaler ferait passer une panne
// pour "compte inexistant" (et masquerait l'échec d'envoi des emails).
export const getUserByEmail = async (email: string) => {
  return db.user.findUnique({ where: { email } });
};

// export const getUserById = async (id: string) => {
//   try {
//     const user = await db.user.findUnique({ where: { id } });

//     return user;
//   } catch {
//     return null;
//   }
// };

export async function getUserById(userId: string) {
  try {
    // Récupérer les informations de l'utilisateur depuis la base de données
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        image: true,
        firstName: true,
        lastName: true,
        phone: true,
        address: true,
        bio: true,
        profilePicture: true,
        headerPicture: true,
        sexe: true,
        nigerLanguage: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    return user;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error);
    return null;
  }
}

export type GetUsersOptions = {
  page?: number;
  limit?: number;
  search?: string;
};

export async function getUsers(options: GetUsersOptions = {}) {
  const { page = 1, limit = 50, search } = options;
  const skip = (page - 1) * limit;

  const where = {
    isDeleted: false,
    ...(search?.trim()
      ? {
          OR: [
            { name: { contains: search.trim(), mode: "insensitive" as const } },
            { email: { contains: search.trim(), mode: "insensitive" as const } },
            { firstName: { contains: search.trim(), mode: "insensitive" as const } },
            { lastName: { contains: search.trim(), mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        image: true,
        profilePicture: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    db.user.count({ where }),
  ]);

  return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export type UpdateUserData = {
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  bio?: string | null;
  role?: Role;
  isActive?: boolean;
  sexe?: "MASCULIN" | "FEMININ" | null;
  nigerLanguage?: ("FRANCAIS" | "HAOUSSA" | "ZARMA" | "TAMASHEQ" | "KANURI" | "FULFULDE" | "GOURMANTCHE" | "ARABE" | "TOUBOU" | "BUDUMA" | "TASSAWAQ" | "ANGLAIS" | "TAGDALT")[];
  image?: string | null;
  profilePicture?: string | null;
  headerPicture?: string | null;
};

export async function updateUser(userId: string, data: UpdateUserData) {
  const { isActive, ...rest } = data;
  const update: Record<string, unknown> = { ...rest };
  if (typeof isActive === "boolean") {
    update.isActive = isActive;
    update.deactivatedAt = isActive ? null : new Date();
  }
  return db.user.update({
    where: { id: userId },
    data: update as Parameters<typeof db.user.update>[0]["data"],
  });
}

export async function softDeleteUser(userId: string) {
  return db.user.update({
    where: { id: userId },
    data: { isDeleted: true, isActive: false, deactivatedAt: new Date() },
  });
}

export async function setUserPassword(userId: string, hashedPassword: string) {
  return db.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
}
