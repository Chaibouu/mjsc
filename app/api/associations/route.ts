import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/api-users-auth";
import { createAssociationSchema } from "@/schemas/association";
import { uploadAssociationSlotFile } from "@/lib/upload";

export const dynamic = "force-dynamic";

const SLOTS = ["logo", "statuts", "reglement", "recepisse", "pv"] as const;

function parseFormBody(formData: FormData) {
  const g = (k: string) => (formData.get(k) as string)?.trim();
  const num = (k: string) => {
    const v = formData.get(k);
    if (v == null || v === "") return undefined;
    const n = Number(v);
    return Number.isNaN(n) ? undefined : n;
  };
  const date = (k: string) => {
    const v = formData.get(k) as string;
    if (!v) return undefined;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? undefined : d;
  };
  const json = (k: string): string[] | undefined => {
    const v = formData.get(k) as string;
    if (!v) return undefined;
    try {
      const a = JSON.parse(v) as unknown;
      return Array.isArray(a) ? a.filter((x) => typeof x === "string") : undefined;
    } catch {
      return undefined;
    }
  };
  const jsonObj = (k: string): Record<string, string> | undefined => {
    const v = formData.get(k) as string;
    if (!v) return undefined;
    try {
      const o = JSON.parse(v) as unknown;
      return o && typeof o === "object" && !Array.isArray(o)
        ? (o as Record<string, string>)
        : undefined;
    } catch {
      return undefined;
    }
  };

  return {
    nomOfficiel: g("nomOfficiel"),
    description: g("description") || undefined,
    emailContact: g("emailContact"),
    numeroRecepisse: g("numeroRecepisse") || undefined,
    autoriteReconnaissance: g("autoriteReconnaissance") || undefined,
    statutJuridique: g("statutJuridique") || undefined,
    nombreMembres: num("nombreMembres"),
    impactSocial: g("impactSocial") || undefined,
    dateCreation: date("dateCreation"),
    pays: g("pays") || undefined,
    region: g("region") || undefined,
    villeCommune: g("villeCommune") || undefined,
    quartier: g("quartier") || undefined,
    adressePhysique: g("adressePhysique") || undefined,
    telephonePrincipal: g("telephonePrincipal") || undefined,
    telephoneSecondaire: g("telephoneSecondaire") || undefined,
    emailOfficiel: g("emailOfficiel") || undefined,
    siteWeb: g("siteWeb") || undefined,
    reseauxSociaux: jsonObj("reseauxSociaux"),
    domaineIntervention: g("domaineIntervention") || undefined,
    missionPrincipale: g("missionPrincipale") || undefined,
    objectifsGeneraux: json("objectifsGeneraux"),
    activitesPrincipales: json("activitesPrincipales"),
    publicCible: g("publicCible") || undefined,
    zoneIntervention: g("zoneIntervention") || undefined,
  };
}

export async function GET() {
  try {
    const list = await db.association.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: "desc" },
      include: {
        createdByUser: {
          select: { id: true, name: true, email: true, firstName: true, lastName: true },
        },
        updatedByUser: {
          select: { id: true, name: true, email: true, firstName: true, lastName: true },
        },
      },
    });
    return NextResponse.json(list);
  } catch (e) {
    console.error("GET /api/associations:", e);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des associations" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdminApi();
    if (!auth.ok) return auth.response;

    const formData = await req.formData();
    const body = parseFormBody(formData);
    const parsed = createAssociationSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? "Données invalides";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const d = parsed.data;
    const created = await db.association.create({
      data: {
        nomOfficiel: d.nomOfficiel,
        description: d.description ?? null,
        emailContact: d.emailContact,
        numeroRecepisse: d.numeroRecepisse ?? null,
        autoriteReconnaissance: d.autoriteReconnaissance ?? null,
        statutJuridique: d.statutJuridique ?? null,
        nombreMembres: d.nombreMembres ?? null,
        impactSocial: d.impactSocial ?? null,
        dateCreation: d.dateCreation ?? null,
        pays: d.pays ?? null,
        region: d.region ?? null,
        villeCommune: d.villeCommune ?? null,
        quartier: d.quartier ?? null,
        adressePhysique: d.adressePhysique ?? null,
        telephonePrincipal: d.telephonePrincipal ?? null,
        telephoneSecondaire: d.telephoneSecondaire ?? null,
        emailOfficiel: d.emailOfficiel ?? null,
        siteWeb: d.siteWeb ?? null,
        reseauxSociaux: d.reseauxSociaux ?? undefined,
        domaineIntervention: d.domaineIntervention ?? null,
        missionPrincipale: d.missionPrincipale ?? null,
        objectifsGeneraux: d.objectifsGeneraux ?? undefined,
        activitesPrincipales: d.activitesPrincipales ?? undefined,
        publicCible: d.publicCible ?? null,
        zoneIntervention: d.zoneIntervention ?? null,
        createdBy: auth.adminId,
      },
    });

    const slotFiles: Record<string, string> = {};
    for (const slot of SLOTS) {
      const f = formData.get(slot) as File | null;
      if (f && f instanceof File && f.size > 0) {
        const res = await uploadAssociationSlotFile(f, created.id, slot);
        if (slot === "logo") slotFiles.logoPath = res.path;
        else if (slot === "statuts") slotFiles.statutsPath = res.path;
        else if (slot === "reglement") slotFiles.reglementInterieurPath = res.path;
        else if (slot === "recepisse") slotFiles.recepissePath = res.path;
        else if (slot === "pv") slotFiles.pvCreationPath = res.path;
      }
    }

    if (Object.keys(slotFiles).length > 0) {
      await db.association.update({
        where: { id: created.id },
        data: slotFiles,
      });
    }

    const updated = await db.association.findUnique({
      where: { id: created.id },
      include: {
        createdByUser: {
          select: { id: true, name: true, email: true, firstName: true, lastName: true },
        },
        updatedByUser: {
          select: { id: true, name: true, email: true, firstName: true, lastName: true },
        },
      },
    });
    return NextResponse.json(
      { data: updated, message: "Association créée avec succès" },
      { status: 201 }
    );
  } catch (e) {
    console.error("POST /api/associations:", e);
    const msg = e instanceof Error ? e.message : "Erreur lors de la création";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
