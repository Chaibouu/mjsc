"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { EditProfilPicture } from "./editProfilPicture";
import { ResetPasswordModal } from "./ResetPasswordModal";
import { revalidateProfil } from "@/actions/updateProfilePicture";
import { User } from "@prisma/client";
import { roleLabels, sexeLabels } from "@/settings/labels";
import { Camera, Mail, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const getProfileImageSrc = (
  path: string | null | undefined,
  updatedAt?: string | Date | null
): string => {
  if (!path) return "/avatar/default-avatar.jpg";
  const ts =
    updatedAt instanceof Date
      ? updatedAt.getTime()
      : typeof updatedAt === "string"
        ? new Date(updatedAt).getTime()
        : null;
  const qs = path.startsWith("/api/uploads/") && ts != null ? `?t=${ts}` : "";
  const base = process.env.NEXT_PUBLIC_APP_URL;
  if (path.startsWith("/api/") && base) {
    return `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}${qs}`;
  }
  return `${path}${qs}`;
};

const formatDate = (value: string | Date | null | undefined) =>
  value
    ? new Date(value).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })
    : null;

type Tab = "details" | "infos";
const TABS: { id: Tab; label: string }[] = [
  { id: "details", label: "Détails du compte" },
  { id: "infos", label: "Informations personnelles" },
];

/** Une ligne « libellé : valeur » ; sur mobile le libellé passe au-dessus. */
function Field({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  const empty = value === null || value === undefined || value === "";
  return (
    <div className={cn("grid gap-1 py-3 sm:grid-cols-[11rem_1fr] sm:gap-6", className)}>
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className={cn("min-w-0 break-words text-[15px]", empty ? "text-gray-400" : "font-medium text-gray-900")}>
        {empty ? "Non renseigné" : value}
      </dd>
    </div>
  );
}

/** Groupe d'informations : titre + liste de lignes séparées. */
function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white px-5 pb-2 pt-5 sm:px-6">
      <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
        <Icon className="h-[18px] w-[18px] text-primaryColor" aria-hidden />
        {title}
      </h3>
      <dl className="mt-2 divide-y divide-gray-100">{children}</dl>
    </section>
  );
}

export const Profil = ({ user }: { user: User | null }) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("details");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [profileImgError, setProfileImgError] = useState(false);

  useEffect(() => {
    setProfileImgError(false);
  }, [user?.id, user?.profilePicture, user?.image, user?.updatedAt]);

  const handleEditSuccess = async () => {
    setShowEditModal(false);
    setShowResetPasswordModal(false);
    await revalidateProfil();
    router.refresh();
  };

  if (!user) {
    return (
      <div className="flex h-full min-h-[240px] items-center justify-center p-8 text-gray-500">
        Connectez-vous pour accéder à votre profil.
      </div>
    );
  }

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  const displayName = fullName || user.name || user.email || "Utilisateur";
  const roleLabel = roleLabels[user.role] ?? user.role;
  const languages =
    Array.isArray(user.nigerLanguage) && user.nigerLanguage.length > 0 ? user.nigerLanguage.join(", ") : null;

  // Navigation clavier entre onglets (flèches gauche/droite)
  const onTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const index = TABS.findIndex((t) => t.id === activeTab);
    const next = TABS[(index + (event.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length];
    setActiveTab(next.id);
    document.getElementById(`profil-tab-${next.id}`)?.focus();
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Titre de la page */}
      <div className="mb-5 sm:mb-6">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-[28px]">Mon profil</h1>
        <p className="mt-1 text-sm text-gray-600 sm:text-base">Consultez et gérez vos informations personnelles.</p>
      </div>

      {/* Carte d'identité : couverture, avatar, nom, statut */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div
          className="relative h-28 bg-primaryColor bg-cover bg-center sm:h-40"
          style={{ backgroundImage: `url(${user.headerPicture || "/niamey.jpg"})` }}
          role="img"
          aria-label="Image de couverture"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-primaryDarkColor/60 via-primaryColor/10 to-transparent" />
        </div>

        <div className="px-5 pb-5 sm:px-8 sm:pb-6">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-end sm:gap-6 sm:pt-4 sm:text-left">
            {/* Avatar à cheval sur la couverture */}
            <div className="relative -mt-12 shrink-0 sm:-mt-14">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="h-24 w-24 rounded-full bg-white object-cover shadow-md ring-4 ring-white sm:h-28 sm:w-28"
                src={
                  profileImgError
                    ? "/avatar/default-avatar.jpg"
                    : getProfileImageSrc((user.profilePicture ?? user.image) as string, user.updatedAt)
                }
                alt={displayName}
                onError={() => setProfileImgError(true)}
              />
              <button
                type="button"
                onClick={() => setShowEditModal(true)}
                aria-label="Modifier la photo de profil"
                title="Modifier la photo de profil"
                className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-secondaryColor text-white shadow-md ring-[3px] ring-white transition-colors hover:bg-[#c75f0f] focus-visible:outline-none focus-visible:ring-primaryColor"
              >
                <Camera className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <div className="min-w-0 flex-1 sm:pb-1">
              <h2 className="text-xl font-bold leading-tight text-gray-900 sm:text-2xl">{displayName}</h2>
              <p className="mt-1 break-all text-sm text-gray-600 sm:break-words">{user.email}</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primaryColor/10 px-3 py-1 text-xs font-semibold text-primaryColor">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                  {roleLabel}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                    user.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                  )}
                >
                  <span
                    className={cn("h-1.5 w-1.5 rounded-full", user.isActive ? "bg-green-600" : "bg-red-600")}
                    aria-hidden
                  />
                  {user.isActive ? "Compte actif" : "Compte inactif"}
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="hidden shrink-0 sm:inline-flex"
              onClick={() => setShowEditModal(true)}
            >
              <Camera className="mr-2 h-4 w-4" aria-hidden />
              Changer la photo
            </Button>
          </div>
        </div>

        {/* Onglets */}
        <div
          role="tablist"
          aria-label="Sections du profil"
          className="flex overflow-x-auto border-t border-gray-200 px-2 sm:px-6 [scrollbar-width:none]"
        >
          {TABS.map((tab) => {
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`profil-tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`profil-panel-${tab.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={onTabKeyDown}
                className={cn(
                  "relative min-h-12 shrink-0 whitespace-nowrap px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primaryColor sm:px-4",
                  "after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:transition-colors sm:after:inset-x-4",
                  selected
                    ? "text-primaryColor after:bg-primaryColor"
                    : "text-gray-600 after:bg-transparent hover:text-gray-900"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenu de l'onglet actif */}
      {activeTab === "details" && (
        <div
          id="profil-panel-details"
          role="tabpanel"
          aria-labelledby="profil-tab-details"
          className="mt-5 grid gap-5 lg:mt-6 lg:grid-cols-3 lg:items-start lg:gap-6"
        >
          <div className="space-y-5 lg:col-span-2 lg:space-y-6">
            <Section icon={UserRound} title="Identité">
              <Field label="Prénom" value={user.firstName} />
              <Field label="Nom" value={user.lastName} />
              <Field label="Sexe" value={user.sexe ? (sexeLabels[user.sexe] ?? user.sexe) : null} />
              <Field label="Langues parlées" value={languages} />
              <Field
                label="Biographie"
                value={user.bio ? <span className="block max-w-prose whitespace-pre-wrap font-normal leading-relaxed text-gray-800">{user.bio}</span> : null}
              />
            </Section>

            <Section icon={Mail} title="Contact">
              <Field label="Adresse e-mail" value={user.email} />
              <Field label="Téléphone" value={user.phone ? <span className="tabular-nums">{user.phone}</span> : null} />
              <Field label="Adresse" value={user.address} />
            </Section>
          </div>

          <Section icon={ShieldCheck} title="Compte">
            <Field className="sm:grid-cols-1 sm:gap-1" label="Rôle" value={roleLabel} />
            <Field
              className="sm:grid-cols-1 sm:gap-1"
              label="Statut"
              value={user.isActive ? "Actif" : "Inactif"}
            />
            <Field className="sm:grid-cols-1 sm:gap-1" label="Membre depuis le" value={formatDate(user.createdAt)} />
            <Field
              className="sm:grid-cols-1 sm:gap-1"
              label="Dernière mise à jour"
              value={formatDate(user.updatedAt)}
            />
          </Section>
        </div>
      )}

      {activeTab === "infos" && (
        <div
          id="profil-panel-infos"
          role="tabpanel"
          aria-labelledby="profil-tab-infos"
          className="mt-5 rounded-lg border border-gray-200 bg-white p-5 sm:p-8 lg:mt-6"
        >
          <form className="grid max-w-3xl grid-cols-1 gap-5 md:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <label htmlFor="profil-phone" className="block text-sm font-medium text-gray-700">
                Téléphone
              </label>
              <Input
                id="profil-phone"
                type="tel"
                name="phone"
                autoComplete="tel"
                defaultValue={user.phone ?? ""}
                placeholder="Ex. : +227 90 00 00 00"
                className="h-11 bg-white"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="profil-address" className="block text-sm font-medium text-gray-700">
                Adresse
              </label>
              <Input
                id="profil-address"
                type="text"
                name="address"
                autoComplete="street-address"
                defaultValue={user.address ?? ""}
                placeholder="Ex. : Niamey, Niger"
                className="h-11 bg-white"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="profil-bio" className="block text-sm font-medium text-gray-700">
                Biographie
              </label>
              <Textarea
                id="profil-bio"
                name="bio"
                rows={5}
                defaultValue={user.bio ?? ""}
                placeholder="Quelques mots sur vous, votre fonction, vos domaines d'action…"
                className="bg-white leading-relaxed"
              />
            </div>
            <div className="flex md:col-span-2 md:justify-end">
              <Button type="submit" className="h-11 w-full bg-primaryColor text-white hover:bg-primaryDarkColor md:w-auto md:px-8">
                Enregistrer
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Modaux */}
      <EditProfilPicture
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleEditSuccess}
        user={user}
      />
      <ResetPasswordModal
        isOpen={showResetPasswordModal}
        onClose={() => setShowResetPasswordModal(false)}
        onSuccess={handleEditSuccess}
        user={user}
      />
    </div>
  );
};
