import React from "react";
import { fetchMedias } from "@/actions/medias";
import ButtonAddMedia from "@/components/Buttons/ButtonAddMedia";
import TableMedia from "@/components/Tables/Table/TableMedia";
import type { Media } from "@/types/media";

export const dynamic = "force-dynamic";

const page = async () => {
  const medias = (await fetchMedias()) as Media[];

  return (
    <div>
      <div className="flex items-center justify-end my-4"><ButtonAddMedia /></div>
      <div>
        <TableMedia title={"Les médias"} subTitle={"Tous les médias publiés sur le portail"} medias={medias} />
      </div>
    </div>
  );
};

export default page;
