import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

/**
 * Crée (ou met à niveau) le compte SUPER_ADMIN à partir des variables d'environnement :
 *   SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD, SUPER_ADMIN_NAME (optionnel)
 *   SUPER_ADMIN_RESET_PASSWORD=true pour réappliquer le mot de passe du .env à un compte existant.
 * Aucun identifiant n'est stocké dans ce fichier.
 */

// `prisma db seed` charge déjà le .env ; `npm run seed` (ts-node) ne le fait pas.
if (!process.env.SUPER_ADMIN_EMAIL) {
  try {
    process.loadEnvFile(".env");
  } catch {
    // Pas de fichier .env : les variables doivent venir de l'environnement
  }
}

const prisma = new PrismaClient();

function readConfig() {
  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD ?? "";
  const name = process.env.SUPER_ADMIN_NAME?.trim() || "Super Administrateur";
  const resetPassword = process.env.SUPER_ADMIN_RESET_PASSWORD === "true";

  const errors: string[] = [];
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("SUPER_ADMIN_EMAIL est manquant ou invalide.");
  }
  if (
    password.length < 12 ||
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/[0-9]/.test(password) ||
    !/[^A-Za-z0-9]/.test(password)
  ) {
    errors.push(
      "SUPER_ADMIN_PASSWORD doit contenir au moins 12 caractères, avec majuscule, minuscule, chiffre et caractère spécial."
    );
  }
  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }

  return { email: email as string, password, name, resetPassword };
}

async function main() {
  const { email, password, name, resetPassword } = readConfig();
  console.log("Seeding super admin...");

  const existing = await prisma.user.findUnique({ where: { email } });

  if (!existing) {
    await prisma.user.create({
      data: {
        name,
        email,
        role: UserRole.SUPER_ADMIN,
        emailVerified: new Date(),
        isActive: true,
        password: await bcrypt.hash(password, 12),
      },
    });
    console.log(`Super admin créé : ${email}`);
    return;
  }

  // Compte existant : on garantit le rôle et l'accès, sans toucher au mot de passe
  // (sauf demande explicite), pour ne pas écraser un mot de passe changé dans l'application.
  await prisma.user.update({
    where: { id: existing.id },
    data: {
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      isDeleted: false,
      deactivatedAt: null,
      emailVerified: existing.emailVerified ?? new Date(),
      ...(resetPassword && { password: await bcrypt.hash(password, 12) }),
    },
  });
  console.log(
    `Super admin mis à jour : ${email}${resetPassword ? " (mot de passe réinitialisé)" : ""}`
  );
}

main()
  .catch((error) => {
    console.error("Erreur lors du seed :", error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
