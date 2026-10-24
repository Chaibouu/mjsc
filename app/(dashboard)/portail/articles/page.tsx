import React from "react";
import { fetchArticles } from "@/actions/articles";
import ButtonAddArticle from "@/components/Buttons/ButtonAddArticle";
import TableArticle from "@/components/Tables/Table/TableArticle";
import type { Article } from "@/types/article";

export const dynamic = "force-dynamic";

const page = async () => {
  const articles = (await fetchArticles()) as Article[];

  return (
    <div>
      <div className="flex items-center justify-end my-4"><ButtonAddArticle /></div>
      <div>
        <TableArticle title={"Les articles"} subTitle={"Tous les articles publiés sur le portail"} articles={articles} />
      </div>
    </div>
  );
};

export default page;
