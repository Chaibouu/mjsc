import React from "react";
import { fetchProjets } from "@/actions/projets";
import ButtonAddProjet from "@/components/Buttons/ButtonAddProjet";
import TableProjet from "@/components/Tables/Table/TableProjet";
import type { Projet } from "@/types/projet";

export const dynamic = "force-dynamic";

const page = async () => {
  const projets = (await fetchProjets()) as Projet[];

  return (
    <div>
      <div className="flex items-center justify-end my-4"><ButtonAddProjet /></div>
      <div>
        <TableProjet title={"Les projets"} subTitle={"Tous les projets publiés sur le portail"} projets={projets} />
      </div>
    </div>
  );
};

export default page;
