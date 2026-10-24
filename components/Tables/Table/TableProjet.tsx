"use client";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import React from "react";
import { ExternalLink, ImageOff } from "lucide-react";
import { DataTable } from "../DataTables/data-table";
import { DataTableColumnHeader } from "../DataTables/data-table-column-header";
import Delete from "../Delete/Delete";
import Update from "../Update/Update";
import UpdateProjet from "@/components/Forms/Update/UpdateProjet";
import { uploadSrc } from "@/components/Forms/ImageFields";
import { deleteProjet, fetchProjets } from "@/actions/projets";
import type { Projet, ProjetAuthor } from "@/types/projet";

interface TableProps {
  title: string,
  subTitle: string,
  projets?: Projet[],
}

function authorName(u?: ProjetAuthor | null) {
  if (!u) return "—";
  return [u.firstName, u.lastName].filter(Boolean).join(" ") || u.name || u.email || "—";
}

const columns: ColumnDef<Projet>[] = [
  {
    accessorKey: "image",
    header: "Image",
    enableSorting: false,
    enableGlobalFilter: false,
    meta: { label: "Image" },
    cell: ({ row }) => {
      const src = uploadSrc(row.original.image, row.original.updatedAt);
      return src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-12 w-16 rounded-md object-cover" />
      ) : (
        <div className="flex h-12 w-16 items-center justify-center rounded-md bg-slate-100 text-slate-400">
          <ImageOff className="h-5 w-5" aria-label="Pas d'image" />
        </div>
      );
    },
  },
  {
    accessorKey: "title",
    meta: { label: "Titre" },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Titre" />,
    cell: ({ row }) => (
      <div className="max-w-[320px]">
        <p className="font-medium text-slate-900">{row.original.title}</p>
        {row.original.description && (
          <p className="line-clamp-1 text-sm text-slate-500">{row.original.description}</p>
        )}
      </div>
    ),
  },
  {
    id: "gallery",
    accessorFn: (a) => (Array.isArray(a.gallery) ? a.gallery.length : 0),
    meta: { label: "Galerie" },
    enableGlobalFilter: false,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Galerie" />,
    cell: ({ getValue }) => {
      const n = getValue<number>();
      return <span className="text-slate-600">{n ? `${n} image${n > 1 ? "s" : ""}` : "—"}</span>;
    },
  },
  {
    accessorKey: "link",
    meta: { label: "Lien" },
    enableSorting: false,
    header: "Lien",
    cell: ({ row }) =>
      row.original.link ? (
        <a
          href={row.original.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-blue-600 hover:underline"
        >
          Ouvrir <ExternalLink className="h-3.5 w-3.5" />
        </a>
      ) : (
        <span className="text-slate-400">—</span>
      ),
  },
  {
    id: "author",
    accessorFn: (a) => authorName(a.createdByUser),
    meta: { label: "Auteur" },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Auteur" />,
  },
  {
    accessorKey: "createdAt",
    meta: { label: "Date" },
    enableGlobalFilter: false,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
    cell: ({ row }) =>
      new Date(row.original.createdAt).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
  },
  {
    id: "actions",
    header: "Action",
    enableHiding: false,
    cell: ({ row }) => (
      <div className="flex gap-4">
        <Update label={`Modifier le projet ${row.original.title}`}>
          {(onClose) => <UpdateProjet projet={row.original} onClose={onClose} />}
        </Update>
        <Delete
          id={row.original.id}
          queryKey="projets"
          label={`le projet « ${row.original.title} »`}
          deleteFnct={deleteProjet}
        />
      </div>
    ),
  },
];

const TableProjet = ({ title, subTitle, projets }: TableProps) => {
  const { data } = useQuery({
    queryKey: ["projets"],
    queryFn: () => fetchProjets() as Promise<Projet[]>,
    initialData: projets,
  });

  return (
    <div className="bg-white shadow border h-full flex-1 flex-col space-y-8 p-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          <p className="text-muted-foreground">{subTitle}</p>
        </div>
      </div>
      <DataTable<Projet>
        data={data ?? []}
        columns={columns}
        queryKey="projets"
        searchPlaceholder="Rechercher un projet..."
      />
    </div>
  );
}

export default TableProjet
