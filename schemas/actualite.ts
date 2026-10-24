import { z } from "zod";
import { imageFile, uploadTotalRefinement } from "./image";

export const createActualiteSchema = z.object({
  title: z.string().min(1, "Titre requis").max(255),
  description: z.string().optional(),
  link: z.union([z.string().url(), z.literal("")]).optional(),
});

export const updateActualiteSchema = createActualiteSchema.partial();

export type CreateActualiteData = z.infer<typeof createActualiteSchema>;
export type UpdateActualiteData = z.infer<typeof updateActualiteSchema>;

/** Schéma du formulaire actualité (création + édition). */
export const actualiteFormSchema = z.object({
  title: z.string().trim().min(1, "Titre requis").max(255, "255 caractères maximum"),
  description: z.string().optional(),
  link: z.union([z.string().url("URL invalide"), z.literal("")]).optional(),
  mainImage: imageFile.optional().nullable(),
  gallery: z.array(imageFile).optional(),
  galleryRemove: z.array(z.string()).optional(),
}).superRefine(uploadTotalRefinement);

export type ActualiteFormData = z.infer<typeof actualiteFormSchema>;
