import { z } from "zod";

// Mêmes limites que le serveur (lib/upload.ts)
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const IMAGE_MAX = 5 * 1024 * 1024;

// `File` n'existe pas côté serveur au chargement du module : vérification à l'exécution
export const imageFile = z
  .custom<File>((v) => typeof File !== "undefined" && v instanceof File, "Fichier invalide")
  .refine((f) => IMAGE_TYPES.includes(f.type), "Formats acceptés : JPG, PNG, WebP, GIF")
  .refine((f) => f.size <= IMAGE_MAX, "Image trop volumineuse (5 Mo maximum)");

/** Total des images d'un enregistrement : sous la limite de 4,5 Mo par requête de Vercel. */
export const UPLOAD_TOTAL_MAX = 4 * 1024 * 1024;

/** Refuse un formulaire dont l'image principale + la galerie dépassent UPLOAD_TOTAL_MAX. */
export function uploadTotalRefinement(
  data: { mainImage?: File | null; gallery?: File[] },
  ctx: z.RefinementCtx
) {
  const files = [...(data.mainImage ? [data.mainImage] : []), ...(data.gallery ?? [])];
  const total = files.reduce((sum, f) => sum + (f?.size ?? 0), 0);
  if (total > UPLOAD_TOTAL_MAX) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["gallery"],
      message: `Images trop lourdes pour un seul envoi (${(total / 1024 / 1024).toFixed(1)} Mo, 4 Mo maximum) : retirez des images ou ajoutez-les en plusieurs fois.`,
    });
  }
}
