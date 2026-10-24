import React from "react";
import { fetchActualites } from "@/actions/actualites";
import ButtonAddActualite from "@/components/Buttons/ButtonAddActualite";
import TableActualite from "@/components/Tables/Table/TableActualite";
import type { Actualite } from "@/types/actualite";

export const dynamic = "force-dynamic";

const page = async () => {
  const actualites = (await fetchActualites()) as Actualite[];

  return (
    <div>
      <div className="flex items-center justify-end my-4"><ButtonAddActualite /></div>
      <div>
        <TableActualite title={"Les actualités"} subTitle={"Toutes les actualités publiées sur le portail"} actualites={actualites} />
      </div>
    </div>
  );
};

export default page;
