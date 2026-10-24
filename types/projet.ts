import type { ArticleAuthor } from "./article";

export type ProjetAuthor = ArticleAuthor;

/** Projet tel que renvoyé par /api/projets */
export interface Projet {
  id: string;
  title: string;
  description: string | null;
  link: string | null;
  image: string | null;
  gallery: string[] | null;
  createdAt: string;
  updatedAt: string;
  createdByUser?: ProjetAuthor | null;
  updatedByUser?: ProjetAuthor | null;
}
