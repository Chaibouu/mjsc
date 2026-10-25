import * as z from "zod";

export const ContactSchema = z.object({
  name: z.string().trim().min(2, "Indiquez votre nom").max(100, "Nom trop long (100 caractères max.)"),
  email: z.string().trim().email("Adresse email invalide").max(200),
  subject: z.string().trim().min(3, "Indiquez l'objet de votre message").max(150, "Objet trop long (150 caractères max.)"),
  message: z
    .string()
    .trim()
    .min(10, "Votre message doit contenir au moins 10 caractères")
    .max(5000, "Message trop long (5000 caractères max.)"),
  // Champ piège invisible : rempli uniquement par les robots
  website: z.string().max(200).optional(),
});

export type ContactValues = z.infer<typeof ContactSchema>;
