export interface ArticleAuthor {
  id: string;
  name: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
}

/** Article tel que renvoyé par /api/articles */
export interface Article {
  id: string;
  title: string;
  description: string | null;
  link: string | null;
  image: string | null;
  gallery: string[] | null;
  createdAt: string;
  updatedAt: string;
  createdByUser?: ArticleAuthor | null;
  updatedByUser?: ArticleAuthor | null;
}
