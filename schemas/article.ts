import { z } from "zod";
import { imageFile, uploadTotalRefinement } from "./image";

export const createArticleSchema = z.object({
  title: z.string().min(1, "Titre requis").max(255),
  description: z.string().optional(),
  link: z.union([z.string().url(), z.literal("")]).optional(),
});

export const updateArticleSchema = createArticleSchema.partial();

export type CreateArticleData = z.infer<typeof createArticleSchema>;
export type UpdateArticleData = z.infer<typeof updateArticleSchema>;

/** Schéma du formulaire article (création + édition). */
export const articleFormSchema = z.object({
  title: z.string().trim().min(1, "Titre requis").max(255, "255 caractères maximum"),
  description: z.string().optional(),
  link: z.union([z.string().url("URL invalide"), z.literal("")]).optional(),
  mainImage: imageFile.optional().nullable(),
  gallery: z.array(imageFile).optional(),
  galleryRemove: z.array(z.string()).optional(),
}).superRefine(uploadTotalRefinement);

export type ArticleFormData = z.infer<typeof articleFormSchema>;
