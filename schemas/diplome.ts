import * as z from "zod";

export const DiplomeSchema = z.object({
  name: z
    .string({ required_error: "Le nom du diplôme est requis" })
    .trim()
    .min(2, "Le nom du diplôme doit contenir au moins 2 caractères")
    .max(255, "Le nom du diplôme ne doit pas dépasser 255 caractères"),
});

export type DiplomeInput = z.infer<typeof DiplomeSchema>;
