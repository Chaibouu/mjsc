"use client";

import React, { useEffect, useRef, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  KeyRound,
  Mail,
  MoreHorizontal,
  Pencil,
  Power,
  RotateCcw,
  UserPlus,
  Search,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import { ButtonLoader } from "@/components/loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useSession } from "@/context/SessionContext";
import { ALL_ROLES, assignableRoles, canManageUser, isRole, type Role } from "@/lib/roles";
import { roleLabels } from "@/settings/labels";
import { getUsers, type UserListItem, type UserStatusFilter } from "@/actions/users";
import { StatusBadge, UserAvatarImage, formatDate, fullName } from "./utilisateurs-ui";
import {
  CreateUserDialog,
  DeleteUserDialog,
  EditUserDialog,
  PasswordDialog,
  ResetPasswordDialog,
  ToggleActiveDialog,
  ViewUserDialog,
} from "./utilisateurs-dialogs";

export type { UserListItem };

const PAGE_SIZE = 20;
const ALL = "all";

type Filters = { page: number; search: string; role?: Role; status?: UserStatusFilter };

type DialogKind = "view" | "edit" | "password" | "reset" | "toggle" | "delete";
// La fenêtre garde son utilisateur après fermeture : son contenu reste affiché pendant l'animation
type DialogState = { kind: DialogKind; user: UserListItem; open: boolean } | null;

/** Garde l'URL synchronisée (lien partageable) sans relancer le rendu serveur. */
function syncUrl({ page, search, role, status }: Filters) {
  const qs = new URLSearchParams();
  if (page > 1) qs.set("page", String(page));
  if (search) qs.set("search", search);
  if (role) qs.set("role", role);
  if (status) qs.set("status", status);
  const query = qs.toString();
  window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
}

function useDebounced<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function Utilisateurs({
  initialPage = 1,
  initialSearch = "",
  initialRole,
  initialStatus,
}: {
  initialPage?: number;
  initialSearch?: string;
  initialRole?: string;
  initialStatus?: string;
}) {
  const { user: currentUser } = useSession();
  const currentRole = currentUser?.role as string | undefined;
  const roleOptions = assignableRoles(currentRole);

  const [page, setPage] = useState(initialPage);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [role, setRole] = useState<Role | undefined>(isRole(initialRole) ? initialRole : undefined);
  const [status, setStatus] = useState<UserStatusFilter | undefined>(
    initialStatus === "active" || initialStatus === "inactive" ? initialStatus : undefined
  );
  const search = useDebounced(searchInput.trim());
  const [dialog, setDialog] = useState<DialogState>(null);
  const [creating, setCreating] = useState(false);

  // Toute modification d'un filtre ramène à la première page (sauf au premier rendu)
  const filtersKey = `${search}|${role ?? ""}|${status ?? ""}`;
  const previousFilters = useRef(filtersKey);
  useEffect(() => {
    if (previousFilters.current !== filtersKey) setPage(1);
    previousFilters.current = filtersKey;
  }, [filtersKey]);
  useEffect(() => syncUrl({ page, search, role, status }), [page, search, role, status]);

  const { data, isPending, isFetching, isPlaceholderData, error, refetch } = useQuery({
    queryKey: ["users", { page, search, role, status }],
    queryFn: async () => {
      const result = await getUsers({ page, limit: PAGE_SIZE, search, role, status });
      if (result.error) throw new Error(result.error);
      return {
        users: result.users ?? [],
        total: result.total ?? 0,
        totalPages: Math.max(1, result.totalPages ?? 1),
      };
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const users = data?.users ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const hasFilters = !!(search || role || status);
  const close = () => setDialog((d) => (d ? { ...d, open: false } : d));
  const open = (kind: DialogKind, user: UserListItem) => setDialog({ kind, user, open: true });
  const dialogProps = (kind: DialogKind) => ({
    open: dialog?.kind === kind && dialog.open,
    user: dialog?.kind === kind ? dialog.user : null,
    onClose: close,
  });

  const resetFilters = () => {
    setSearchInput("");
    setRole(undefined);
    setStatus(undefined);
  };

  const rowActions = (u: UserListItem) => {
    const manageable = canManageUser(currentRole, u.role);
    const isSelf = u.id === currentUser?.id;
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-none" aria-label={`Actions pour ${fullName(u)}`}>
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuItem onSelect={() => open("view", u)}>
            <Eye className="mr-2 h-4 w-4" aria-hidden />
            Voir le détail
          </DropdownMenuItem>
          {manageable && (
            <>
              <DropdownMenuItem onSelect={() => open("edit", u)}>
                <Pencil className="mr-2 h-4 w-4" aria-hidden />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => open("password", u)}>
                <KeyRound className="mr-2 h-4 w-4" aria-hidden />
                Changer le mot de passe
              </DropdownMenuItem>
              {u.email && (
                <DropdownMenuItem onSelect={() => open("reset", u)}>
                  <Mail className="mr-2 h-4 w-4" aria-hidden />
                  Envoyer un lien de réinitialisation
                </DropdownMenuItem>
              )}
              {!isSelf && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => open("toggle", u)}>
                    <Power className="mr-2 h-4 w-4" aria-hidden />
                    {u.isActive ? "Désactiver le compte" : "Activer le compte"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => open("delete", u)}
                    className="text-red-600 focus:bg-red-50 focus:text-red-700"
                  >
                    <Trash2 className="mr-2 h-4 w-4" aria-hidden />
                    Supprimer
                  </DropdownMenuItem>
                </>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      {/* En-tête */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-[28px]">Utilisateurs</h1>
          <p className="mt-1 text-sm text-gray-600">Gérez les comptes, leurs accès et leurs mots de passe.</p>
          <p className="mt-2 flex items-center gap-2 text-sm text-gray-600" aria-live="polite">
            {isFetching && !isPending && <ButtonLoader className="text-primaryColor" />}
            {isPending ? "Chargement…" : `${total} compte${total > 1 ? "s" : ""}${hasFilters ? " trouvé" + (total > 1 ? "s" : "") : ""}`}
          </p>
        </div>
        {roleOptions.length > 0 && (
          <Button
            type="button"
            onClick={() => setCreating(true)}
            className="h-11 w-full rounded-none bg-primaryColor px-5 text-white hover:bg-primaryDarkColor sm:w-auto"
          >
            <UserPlus className="mr-2 h-4 w-4" aria-hidden />
            Ajouter un utilisateur
          </Button>
        )}
      </div>

      <div className="border border-gray-200 bg-white shadow-sm">
        {/* Barre de filtres */}
        <div className="flex flex-col gap-3 border-b border-gray-200 p-3 sm:p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden />
            <Input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Rechercher par nom ou email…"
              aria-label="Rechercher un utilisateur"
              className="h-10 rounded-none pl-9"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 lg:flex">
            <Select value={role ?? ALL} onValueChange={(v) => setRole(v === ALL ? undefined : (v as Role))}>
              <SelectTrigger className="h-10 rounded-none lg:w-48" aria-label="Filtrer par rôle">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Tous les rôles</SelectItem>
                {ALL_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {roleLabels[r] ?? r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={status ?? ALL}
              onValueChange={(v) => setStatus(v === ALL ? undefined : (v as UserStatusFilter))}
            >
              <SelectTrigger className="h-10 rounded-none lg:w-40" aria-label="Filtrer par statut">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Tous les statuts</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="inactive">Désactivés</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {hasFilters && (
            <Button type="button" variant="ghost" onClick={resetFilters} className="h-10 rounded-none text-gray-600">
              <X className="mr-1.5 h-4 w-4" aria-hidden />
              Effacer
            </Button>
          )}
        </div>

        {/* Contenu */}
        {error ? (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <p className="font-medium text-gray-900">Impossible de charger les utilisateurs</p>
            <p className="text-sm text-gray-600">{(error as Error).message}</p>
            <Button variant="outline" className="rounded-none" onClick={() => refetch()}>
              <RotateCcw className="mr-2 h-4 w-4" aria-hidden />
              Réessayer
            </Button>
          </div>
        ) : isPending ? (
          <ul className="divide-y divide-gray-100" aria-hidden>
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48 max-w-full" />
                  <Skeleton className="h-3 w-64 max-w-full" />
                </div>
                <Skeleton className="hidden h-5 w-24 md:block" />
              </li>
            ))}
          </ul>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="mb-4 flex h-14 w-14 items-center justify-center bg-primaryColor/10 text-primaryColor">
              <UsersRound className="h-7 w-7" aria-hidden />
            </span>
            <p className="font-medium text-gray-900">Aucun utilisateur trouvé</p>
            <p className="mt-1 text-sm text-gray-600">
              {hasFilters ? "Aucun compte ne correspond à ces critères." : "Aucun compte n'est encore enregistré."}
            </p>
            {hasFilters && (
              <Button variant="outline" className="mt-4 rounded-none" onClick={resetFilters}>
                Effacer les filtres
              </Button>
            )}
          </div>
        ) : (
          <div className={isPlaceholderData ? "opacity-60 transition-opacity" : "transition-opacity"}>
            {/* Tableau (tablette et ordinateur) */}
            <table className="hidden w-full text-left text-sm md:table">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Utilisateur</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Rôle</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Statut</th>
                  <th scope="col" className="hidden px-4 py-3 font-semibold lg:table-cell">Téléphone</th>
                  <th scope="col" className="hidden px-4 py-3 font-semibold xl:table-cell">Inscrit le</th>
                  <th scope="col" className="w-14 px-2 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-gray-50/80">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => open("view", u)}
                        className="group flex min-w-0 items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaryColor"
                      >
                        <UserAvatarImage user={u} />
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-gray-900 group-hover:text-primaryColor">
                            {fullName(u)}
                            {u.id === currentUser?.id && <span className="ml-2 text-xs font-normal text-gray-500">(vous)</span>}
                          </span>
                          <span className="block truncate text-gray-500">{u.email ?? "—"}</span>
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{roleLabels[u.role] ?? u.role}</td>
                    <td className="px-4 py-3"><StatusBadge active={u.isActive} /></td>
                    <td className="hidden px-4 py-3 tabular-nums text-gray-600 lg:table-cell">{u.phone || "—"}</td>
                    <td className="hidden px-4 py-3 text-gray-600 xl:table-cell">{formatDate(u.createdAt) ?? "—"}</td>
                    <td className="px-2 py-2 text-right">{rowActions(u)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Liste (téléphone) */}
            <ul className="divide-y divide-gray-100 md:hidden">
              {users.map((u) => (
                <li key={u.id} className="flex items-start gap-3 py-3 pl-4 pr-2">
                  <button type="button" onClick={() => open("view", u)} className="flex min-w-0 flex-1 items-start gap-3 text-left">
                    <UserAvatarImage user={u} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-gray-900">
                        {fullName(u)}
                        {u.id === currentUser?.id && <span className="ml-1.5 text-xs font-normal text-gray-500">(vous)</span>}
                      </span>
                      <span className="block truncate text-sm text-gray-500">{u.email ?? "—"}</span>
                      <span className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-gray-700">{roleLabels[u.role] ?? u.role}</span>
                        <StatusBadge active={u.isActive} />
                      </span>
                    </span>
                  </button>
                  {rowActions(u)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Pagination */}
        {!error && !isPending && totalPages > 1 && (
          <div className="flex items-center justify-between gap-3 border-t border-gray-200 px-3 py-3 sm:px-4">
            <p className="text-sm text-gray-600">
              Page <span className="font-semibold text-gray-900">{page}</span> sur {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="h-10 rounded-none"
                disabled={page <= 1 || isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4 sm:mr-1" aria-hidden />
                <span className="hidden sm:inline">Précédent</span>
                <span className="sr-only sm:hidden">Page précédente</span>
              </Button>
              <Button
                variant="outline"
                className="h-10 rounded-none"
                disabled={page >= totalPages || isFetching}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <span className="hidden sm:inline">Suivant</span>
                <span className="sr-only sm:hidden">Page suivante</span>
                <ChevronRight className="h-4 w-4 sm:ml-1" aria-hidden />
              </Button>
            </div>
          </div>
        )}
      </div>

      <CreateUserDialog open={creating} roleOptions={roleOptions} onClose={() => setCreating(false)} />
      <ViewUserDialog
        {...dialogProps("view")}
        canManage={!!dialog && canManageUser(currentRole, dialog.user.role)}
        onEdit={(u) => open("edit", u)}
      />
      <EditUserDialog {...dialogProps("edit")} roleOptions={roleOptions} />
      <PasswordDialog {...dialogProps("password")} />
      <ResetPasswordDialog {...dialogProps("reset")} />
      <ToggleActiveDialog {...dialogProps("toggle")} />
      <DeleteUserDialog {...dialogProps("delete")} />
    </div>
  );
}
