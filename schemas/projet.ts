import { z } from "zod";
import { imageFile, uploadTotalRefinement } from "./image";

export const createProjetSchema = z.object({
  title: z.string().min(1, "Titre requis").max(255),
  description: z.string().optional(),
  link: z.union([z.string().url(), z.literal("")]).optional(),
});

export const updateProjetSchema = createProjetSchema.partial();

export type CreateProjetData = z.infer<typeof createProjetSchema>;
export type UpdateProjetData = z.infer<typeof updateProjetSchema>;

/** Schéma du formulaire projet (création + édition). */
export const projetFormSchema = z.object({
  title: z.string().trim().min(1, "Titre requis").max(255, "255 caractères maximum"),
  description: z.string().optional(),
  link: z.union([z.string().url("URL invalide"), z.literal("")]).optional(),
  mainImage: imageFile.optional().nullable(),
  gallery: z.array(imageFile).optional(),
  galleryRemove: z.array(z.string()).optional(),
}).superRefine(uploadTotalRefinement);

export type ProjetFormData = z.infer<typeof projetFormSchema>;
