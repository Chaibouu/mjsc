"use client";

import Loader from "@/components/loader";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { roleLabels, sexeLabels } from "@/settings/labels";
import { useSession } from "@/context/SessionContext";
import { assignableRoles, canManageUser, type Role } from "@/lib/roles";
import { updateUser, deleteUser, getUserById } from "@/actions/users";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  User,
  Mail,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Power,
  Phone,
  MapPin,
  Calendar,
  ShieldCheck,
  FileText,
  Languages,
  Clock,
} from "lucide-react";

export type ViewUserFull = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  isActive: boolean;
  image: string | null;
  profilePicture: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  address: string | null;
  bio: string | null;
  sexe: string | null;
  nigerLanguage?: string[];
  createdAt: string;
  updatedAt: string;
};

function displayNameFull(u: { firstName?: string | null; lastName?: string | null; name?: string | null }): string {
  const parts = [u.firstName, u.lastName].filter(Boolean);
  if (parts.length) return parts.join(" ").trim();
  return u.name ?? "—";
}

export type UserListItem = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  isActive: boolean;
  image: string | null;
  profilePicture: string | null;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
  updatedAt: string;
};

function getProfileImageSrc(path: string | null | undefined, updatedAt?: string | null): string {
  if (!path) return "/avatar/default-avatar.jpg";
  const ts = updatedAt ? new Date(updatedAt).getTime() : null;
  const qs = path.startsWith("/api/uploads/") && ts != null ? `?t=${ts}` : "";
  const base = process.env.NEXT_PUBLIC_APP_URL;
  if (path.startsWith("/api/") && base) {
    return `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}${qs}`;
  }
  return `${path}${qs}`;
}

function displayName(u: UserListItem): string {
  const parts = [u.firstName, u.lastName].filter(Boolean);
  if (parts.length) return parts.join(" ");
  return u.name ?? "—";
}

export type UtilisateursProps = {
  users: UserListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  search: string;
};

export function Utilisateurs({
  users: initialUsers,
  total,
  page,
  limit,
  totalPages,
  search,
}: UtilisateursProps) {
  const router = useRouter();
  const { user: currentUser } = useSession();
  const currentRole = currentUser?.role as string | undefined;
  const roleOptions = assignableRoles(currentRole);
  const [users, setUsers] = useState(initialUsers);
  const [searchInput, setSearchInput] = useState(search);

  const [viewUser, setViewUser] = useState<UserListItem | null>(null);
  const [viewUserFull, setViewUserFull] = useState<ViewUserFull | null>(null);
  const [viewUserLoading, setViewUserLoading] = useState(false);
  const [viewUserError, setViewUserError] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<UserListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserListItem | null>(null);
  const [toggleTarget, setToggleTarget] = useState<UserListItem | null>(null);

  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "USER" as Role,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    if (editUser) {
      setEditForm({
        firstName: editUser.firstName ?? "",
        lastName: editUser.lastName ?? "",
        email: editUser.email ?? "",
        role: (editUser.role as Role) ?? "USER",
      });
      setError(null);
    }
  }, [editUser]);

  useEffect(() => {
    if (!viewUser) {
      setViewUserFull(null);
      setViewUserLoading(false);
      setViewUserError(null);
      return;
    }
    let cancelled = false;
    setViewUserFull(null);
    setViewUserError(null);
    setViewUserLoading(true);
    getUserById(viewUser.id)
      .then((res) => {
        if (cancelled) return;
        const u = (res as { user?: ViewUserFull }).user;
        if (u) setViewUserFull(u);
        else setViewUserError("Utilisateur introuvable");
      })
      .catch((e) => {
        if (!cancelled) setViewUserError(e instanceof Error ? e.message : "Erreur lors du chargement");
      })
      .finally(() => {
        if (!cancelled) setViewUserLoading(false);
      });
    return () => { cancelled = true; };
  }, [viewUser?.id]);

  const base = "/users";
  const q = search.trim() ? `search=${encodeURIComponent(search.trim())}` : "";
  const pagination = (p: number) => (q ? `${base}?page=${p}&${q}` : `${base}?page=${p}`);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const v = searchInput.trim();
    const url = v ? `${base}?page=1&search=${encodeURIComponent(v)}` : `${base}?page=1`;
    router.replace(url);
  };

  const handleEdit = async () => {
    if (!editUser) return;
    setLoading(true);
    setError(null);
    try {
      await updateUser(editUser.id, {
        firstName: editForm.firstName || null,
        lastName: editForm.lastName || null,
        email: editForm.email || null,
        ...(editForm.role !== editUser.role && { role: editForm.role }),
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editUser.id
            ? { ...u, firstName: editForm.firstName, lastName: editForm.lastName, email: editForm.email, role: editForm.role }
            : u
        )
      );
      setEditUser(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    setError(null);
    try {
      await deleteUser(deleteTarget.id);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!toggleTarget) return;
    setLoading(true);
    setError(null);
    try {
      await updateUser(toggleTarget.id, { isActive: !toggleTarget.isActive });
      setUsers((prev) =>
        prev.map((u) => (u.id === toggleTarget.id ? { ...u, isActive: !u.isActive } : u))
      );
      setToggleTarget(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors du changement de statut");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Utilisateurs
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {total} utilisateur{total !== 1 ? "s" : ""} au total
          </p>
        </div>
      </div>

      {/* Barre gradient + recherche */}
      <div className="rounded-t-2xl bg-gradient-to-r from-primaryColor to-primaryDarkColor px-4 py-4 sm:px-6">
        <form
          onSubmit={handleSearch}
          className="flex flex-col gap-2 sm:flex-row sm:items-center"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Rechercher par nom, email…"
              className="border-0 bg-white/95 pl-9 dark:bg-gray-900/95 dark:placeholder:text-gray-400"
            />
          </div>
          <Button
            type="submit"
            variant="secondary"
            className="bg-white/90 text-gray-900 hover:bg-white dark:bg-gray-900/90 dark:text-gray-100 dark:hover:bg-gray-900"
          >
            Rechercher
          </Button>
        </form>
      </div>

      {/* Liste */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Liste des utilisateurs</CardTitle>
          <CardDescription>
            Page {page} sur {totalPages || 1}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center text-gray-500 dark:text-gray-400">
              <User className="mb-2 h-10 w-10" />
              <p>Aucun utilisateur trouvé</p>
              {search && (
                <p className="mt-1 text-sm">Essayez un autre terme de recherche.</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-3 font-medium text-gray-600 dark:text-gray-400">Utilisateur</th>
                    <th className="pb-3 font-medium text-gray-600 dark:text-gray-400">Email</th>
                    <th className="pb-3 font-medium text-gray-600 dark:text-gray-400">Rôle</th>
                    <th className="pb-3 font-medium text-gray-600 dark:text-gray-400">Statut</th>
                    <th className="pb-3 font-medium text-gray-600 dark:text-gray-400">Inscrit le</th>
                    <th className="pb-3 font-medium text-gray-600 dark:text-gray-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-gray-100 dark:border-gray-800 last:border-0"
                    >
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage
                              src={getProfileImageSrc(u.profilePicture ?? u.image, u.updatedAt)}
                              alt=""
                            />
                            <AvatarFallback className="bg-primaryColor/10 text-primaryColor text-xs">
                              {displayName(u).split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {displayName(u)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Mail className="h-4 w-4 shrink-0" />
                          {u.email ?? "—"}
                        </span>
                      </td>
                      <td className="py-4">
                        <Badge variant="secondary">{roleLabels[u.role] ?? u.role}</Badge>
                      </td>
                      <td className="py-4">
                        <Badge
                          variant={u.isActive ? "success" : "outline"}
                          className={!u.isActive ? "border-red-300 text-red-600 dark:border-red-700 dark:text-red-400" : ""}
                        >
                          {u.isActive ? "Actif" : "Inactif"}
                        </Badge>
                      </td>
                      <td className="py-4 text-gray-500 dark:text-gray-400">
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td className="py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewUser(u)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Voir
                            </DropdownMenuItem>
                            {canManageUser(currentRole, u.role) && (
                              <>
                                <DropdownMenuItem onClick={() => setEditUser(u)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setToggleTarget(u)}>
                                  <Power className="mr-2 h-4 w-4" />
                                  {u.isActive ? "Désactiver" : "Activer"}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setDeleteTarget(u)}
                                  className="text-red-600 focus:text-red-600 dark:text-red-400"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Supprimer
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {(page - 1) * limit + 1} – {Math.min(page * limit, total)} sur {total}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild disabled={page <= 1}>
                  <Link href={page > 1 ? pagination(page - 1) : "#"}>
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Précédent
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild disabled={page >= totalPages}>
                  <Link href={page < totalPages ? pagination(page + 1) : "#"}>
                    Suivant
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: Voir utilisateur */}
      <Dialog open={!!viewUser} onOpenChange={(open) => !open && setViewUser(null)}>
        <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl sm:rounded-xl">
          <div className="flex-shrink-0 rounded-t-xl bg-gradient-to-r from-primaryColor to-primaryDarkColor px-6 py-5 pr-14">
            <DialogTitle className="text-lg font-semibold text-white">
              Détails de l'utilisateur
            </DialogTitle>
            <p className="mt-1 text-sm text-white/80">
              Informations complètes du compte
            </p>
          </div>
          {viewUser && (
            <>
              {viewUserLoading && (
                <div className="flex flex-1 items-center justify-center py-16">
                  <Loader message="Chargement…" className="py-0" />
                </div>
              )}
              {viewUserError && (
                <div className="flex-1 px-6 py-6">
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
                    {viewUserError}
                  </div>
                </div>
              )}
              {!viewUserLoading && !viewUserError && viewUserFull && (
                <div className="flex-1 overflow-y-auto">
                  <div className="px-6 pt-2 pb-6">
                    {/* Profil */}
                    <div className="mb-6 flex flex-wrap items-end gap-4">
                      <Avatar className="h-20 w-20 shrink-0 rounded-full border-4 border-white shadow-lg dark:border-gray-900">
                        <AvatarImage
                          src={getProfileImageSrc(viewUserFull.profilePicture ?? viewUserFull.image, viewUserFull.updatedAt)}
                        />
                        <AvatarFallback className="bg-primaryColor/10 text-primaryColor text-xl">
                          {displayNameFull(viewUserFull).split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 pb-1">
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {displayNameFull(viewUserFull)}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge variant="secondary" className="font-medium">
                            {roleLabels[viewUserFull.role] ?? viewUserFull.role}
                          </Badge>
                          <Badge
                            variant={viewUserFull.isActive ? "success" : "outline"}
                            className={!viewUserFull.isActive ? "border-red-300 text-red-600 dark:border-red-700 dark:text-red-400" : ""}
                          >
                            {viewUserFull.isActive ? "Actif" : "Inactif"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Sections */}
                    <div className="space-y-6">
                      <section>
                        <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primaryColor">
                          <User className="h-4 w-4" />
                          Identité
                        </h3>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {(viewUserFull.firstName != null && viewUserFull.firstName !== "") && (
                            <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primaryColor/10 text-primaryColor">
                                <User className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Prénom</p>
                                <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {viewUserFull.firstName}
                                </p>
                              </div>
                            </div>
                          )}
                          {(viewUserFull.lastName != null && viewUserFull.lastName !== "") && (
                            <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primaryColor/10 text-primaryColor">
                                <User className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Nom</p>
                                <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {viewUserFull.lastName}
                                </p>
                              </div>
                            </div>
                          )}
                          {(viewUserFull.sexe != null && viewUserFull.sexe !== "") && (
                            <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primaryColor/10 text-primaryColor">
                                <User className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Sexe</p>
                                <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {sexeLabels[viewUserFull.sexe] ?? viewUserFull.sexe}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </section>

                      <section>
                        <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primaryColor">
                          <Mail className="h-4 w-4" />
                          Contact
                        </h3>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primaryColor/10 text-primaryColor">
                              <Mail className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Email</p>
                              <p className="mt-0.5 break-all text-sm font-medium text-gray-900 dark:text-gray-100">
                                {viewUserFull.email ?? "—"}
                              </p>
                            </div>
                          </div>
                          {(viewUserFull.phone != null && viewUserFull.phone !== "") && (
                            <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primaryColor/10 text-primaryColor">
                                <Phone className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Téléphone</p>
                                <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {viewUserFull.phone}
                                </p>
                              </div>
                            </div>
                          )}
                          {(viewUserFull.address != null && viewUserFull.address !== "") && (
                            <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/50 p-3 dark:border-gray-700 dark:bg-gray-800/50 sm:col-span-2">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primaryColor/10 text-primaryColor">
                                <MapPin className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Adresse</p>
                                <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {viewUserFull.address}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </section>

                      {(viewUserFull.bio != null && viewUserFull.bio !== "") && (
                        <section>
                          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primaryColor">
                            <FileText className="h-4 w-4" />
                            À propos
                          </h3>
                          <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primaryColor/10 text-primaryColor">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Bio</p>
                              <p className="mt-0.5 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                                {viewUserFull.bio}
                              </p>
                            </div>
                          </div>
                        </section>
                      )}

                      {Array.isArray(viewUserFull.nigerLanguage) && viewUserFull.nigerLanguage.length > 0 && (
                        <section>
                          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primaryColor">
                            <Languages className="h-4 w-4" />
                            Langues
                          </h3>
                          <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primaryColor/10 text-primaryColor">
                              <Languages className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Langues du Niger</p>
                              <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                                {viewUserFull.nigerLanguage.join(", ")}
                              </p>
                            </div>
                          </div>
                        </section>
                      )}

                      <section>
                        <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primaryColor">
                          <Calendar className="h-4 w-4" />
                          Compte
                        </h3>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primaryColor/10 text-primaryColor">
                              <Calendar className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Inscrit le</p>
                              <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                                {viewUserFull.createdAt
                                  ? new Date(viewUserFull.createdAt).toLocaleDateString("fr-FR", {
                                      day: "numeric",
                                      month: "long",
                                      year: "numeric",
                                    })
                                  : "—"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primaryColor/10 text-primaryColor">
                              <Clock className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Modifié le</p>
                              <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                                {viewUserFull.updatedAt
                                  ? new Date(viewUserFull.updatedAt).toLocaleDateString("fr-FR", {
                                      day: "numeric",
                                      month: "long",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : "—"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </section>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div className="flex-shrink-0 border-t border-gray-200 px-6 py-4 dark:border-gray-800">
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setViewUser(null)}>
                Fermer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Modifier utilisateur */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-md sm:rounded-xl">
          <div className="flex-shrink-0 rounded-t-xl bg-gradient-to-r from-primaryColor to-primaryDarkColor px-6 py-5 pr-14">
            <DialogTitle className="text-lg font-semibold text-white">
              Modifier l'utilisateur
            </DialogTitle>
            <p className="mt-1 text-sm text-white/80">
              Modifiez les informations de base du compte.
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-6 px-6 py-6">
              <section>
                <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primaryColor">
                  <User className="h-4 w-4" />
                  Identité
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-firstName" className="text-gray-700 dark:text-gray-300">
                      Prénom
                    </Label>
                    <Input
                      id="edit-firstName"
                      value={editForm.firstName}
                      onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))}
                      className="rounded-lg border-gray-200 focus-visible:ring-primaryColor dark:border-gray-700"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-lastName" className="text-gray-700 dark:text-gray-300">
                      Nom
                    </Label>
                    <Input
                      id="edit-lastName"
                      value={editForm.lastName}
                      onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))}
                      className="rounded-lg border-gray-200 focus-visible:ring-primaryColor dark:border-gray-700"
                    />
                  </div>
                </div>
              </section>
              <section>
                <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primaryColor">
                  <Mail className="h-4 w-4" />
                  Contact
                </h3>
                <div className="grid gap-2">
                  <Label htmlFor="edit-email" className="text-gray-700 dark:text-gray-300">
                    Email
                  </Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                    className="rounded-lg border-gray-200 focus-visible:ring-primaryColor dark:border-gray-700"
                  />
                </div>
              </section>
              <section>
                <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primaryColor">
                  <ShieldCheck className="h-4 w-4" />
                  Compte
                </h3>
                <div className="grid gap-2">
                  <Label htmlFor="edit-role" className="text-gray-700 dark:text-gray-300">
                    Rôle
                  </Label>
                  <Select
                    value={editForm.role}
                    onValueChange={(v) => setEditForm((f) => ({ ...f, role: v as Role }))}
                  >
                    <SelectTrigger
                      id="edit-role"
                      className="rounded-lg border-gray-200 focus:ring-primaryColor dark:border-gray-700"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((r) => (
                        <SelectItem key={r} value={r}>
                          {roleLabels[r] ?? r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </section>
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
                  {error}
                </div>
              )}
            </div>
          </div>
          <div className="flex-shrink-0 border-t border-gray-200 px-6 py-4 dark:border-gray-800">
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setEditUser(null)} disabled={loading}>
                Annuler
              </Button>
              <Button
                onClick={handleEdit}
                loading={loading}
                className="bg-primaryColor hover:bg-primaryDarkColor"
              >
                Enregistrer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Confirmer suppression */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer l'utilisateur</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer <strong>{deleteTarget && displayName(deleteTarget)}</strong> ?
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={loading}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete} loading={loading}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Confirmer activation/désactivation */}
      <Dialog open={!!toggleTarget} onOpenChange={(open) => !open && setToggleTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{toggleTarget?.isActive ? "Désactiver" : "Activer"} le compte</DialogTitle>
            <DialogDescription>
              {toggleTarget?.isActive
                ? `Voulez-vous désactiver le compte de ${toggleTarget && displayName(toggleTarget)} ? L'utilisateur ne pourra plus se connecter.`
                : `Voulez-vous réactiver le compte de ${toggleTarget && displayName(toggleTarget)} ?`}
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setToggleTarget(null)} disabled={loading}>
              Annuler
            </Button>
            <Button
              variant={toggleTarget?.isActive ? "destructive" : "default"}
              onClick={handleToggleActive}
              loading={loading}
            >
              {toggleTarget?.isActive ? "Désactiver" : "Activer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
