import * as z from "zod";
import { ALL_ROLES, type Role } from "@/lib/roles";

/** Création d'un compte par un administrateur (le rôle est contrôlé côté serveur). */
export const CreateUserSchema = z.object({
  firstName: z.string().trim().min(1, "Indiquez le prénom").max(100, "100 caractères maximum"),
  lastName: z.string().trim().min(1, "Indiquez le nom").max(100, "100 caractères maximum"),
  email: z.string().trim().toLowerCase().email("Adresse email invalide").max(200),
  phone: z.string().trim().max(30, "30 caractères maximum").optional(),
  role: z.enum(ALL_ROLES as [Role, ...Role[]], { errorMap: () => ({ message: "Choisissez un rôle" }) }),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
});

export type CreateUserValues = z.infer<typeof CreateUserSchema>;
