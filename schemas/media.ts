import { z } from "zod";
import { imageFile, uploadTotalRefinement } from "./image";

export const createMediaSchema = z.object({
  title: z.string().min(1, "Titre requis").max(255),
  description: z.string().optional(),
});

export const updateMediaSchema = createMediaSchema.partial();

export type CreateMediaData = z.infer<typeof createMediaSchema>;
export type UpdateMediaData = z.infer<typeof updateMediaSchema>;

/** Schéma du formulaire média (création + édition) : pas de lien ni d'image principale. */
export const mediaFormSchema = z.object({
  title: z.string().trim().min(1, "Titre requis").max(255, "255 caractères maximum"),
  description: z.string().optional(),
  gallery: z.array(imageFile).optional(),
  galleryRemove: z.array(z.string()).optional(),
}).superRefine(uploadTotalRefinement);

export type MediaFormData = z.infer<typeof mediaFormSchema>;
