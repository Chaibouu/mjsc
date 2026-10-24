import type { ArticleAuthor } from "./article";

export type ActualiteAuthor = ArticleAuthor;

/** Actualité telle que renvoyée par /api/actualites */
export interface Actualite {
  id: string;
  title: string;
  description: string | null;
  link: string | null;
  image: string | null;
  gallery: string[] | null;
  createdAt: string;
  updatedAt: string;
  createdByUser?: ActualiteAuthor | null;
  updatedByUser?: ActualiteAuthor | null;
}
