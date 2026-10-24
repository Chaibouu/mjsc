import type { ArticleAuthor } from "./article";

export type MediaAuthor = ArticleAuthor;

/** Média (album photo) tel que renvoyé par /api/medias */
export interface Media {
  id: string;
  title: string;
  description: string | null;
  gallery: string[] | null;
  createdAt: string;
  updatedAt: string;
  createdByUser?: MediaAuthor | null;
  updatedByUser?: MediaAuthor | null;
}
