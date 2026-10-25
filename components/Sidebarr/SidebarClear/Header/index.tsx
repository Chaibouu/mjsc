"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronDown, ExternalLink, LayoutDashboard, LogOut, Menu, UserRound } from "lucide-react";
import DarkModeSwitcher from "./DarkModeSwitcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar, displayName, userSpaceLinks, useLogout } from "@/components/user-menu";
import { ButtonLoader } from "@/components/loader";
import { useSession } from "@/context/SessionContext";
import { roleLabels } from "@/settings/labels";
import appConfig from "@/settings";

/** Menu du compte dans l'en-tête du back-office (rendu en portail : toujours au-dessus du contenu). */
function AdminUserMenu() {
  const { user } = useSession();
  const { onLogout, isPending } = useLogout();
  if (!user) return null;
  const { space, profile } = userSpaceLinks(user);
  const role = roleLabels[user.role] ?? user.role;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex min-h-11 items-center gap-3 rounded-lg px-1.5 py-1 outline-none transition-colors hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-primaryColor dark:hover:bg-meta-4"
        aria-label="Ouvrir le menu du compte"
      >
        <span className="hidden max-w-[180px] text-right lg:block">
          <span className="block truncate text-sm font-semibold text-gray-900 dark:text-white">{displayName(user)}</span>
          <span className="block truncate text-xs text-gray-500 dark:text-bodydark">{role}</span>
        </span>
        <UserAvatar user={user} className="h-9 w-9 sm:h-10 sm:w-10" />
        <ChevronDown className="hidden h-4 w-4 text-gray-500 sm:block" aria-hidden />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-64">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-semibold">{displayName(user)}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          <p className="mt-1 text-xs font-medium text-primaryColor">{role}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {profile && (
          <DropdownMenuItem asChild>
            <Link href={profile} className="cursor-pointer">
              <UserRound className="mr-2 h-4 w-4" />
              Mon profil
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href={space} className="cursor-pointer">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Tableau de bord
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="sm:hidden">
          <Link href="/" className="cursor-pointer">
            <ExternalLink className="mr-2 h-4 w-4" />
            Voir le site
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            onLogout();
          }}
          disabled={isPending}
          className="cursor-pointer text-red-600 focus:text-red-600"
        >
          {isPending ? <ButtonLoader className="mr-2" /> : <LogOut className="mr-2 h-4 w-4" />}
          {isPending ? "Déconnexion…" : "Se déconnecter"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * En-tête du back-office : collé en haut, au-dessus du contenu des pages (z-40), sous les
 * fenêtres et menus en portail (z-50). Sur mobile et tablette, le bouton burger ouvre le menu latéral.
 */
const HeaderClear = (props: {
  sidebarOpen: string | boolean | undefined;
  setSidebarOpen: (arg0: boolean) => void;
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white shadow-sm dark:border-strokedark dark:bg-boxdark">
      <div className="flex h-16 items-center justify-between gap-3 px-3 sm:px-4 md:px-6 2xl:px-11">
        <div className="flex min-w-0 items-center gap-2 lg:hidden">
          <button
            type="button"
            aria-controls="sidebar"
            aria-expanded={!!props.sidebarOpen}
            aria-label={props.sidebarOpen ? "Fermer le menu" : "Ouvrir le menu"}
            onClick={(e) => {
              e.stopPropagation();
              props.setSidebarOpen(!props.sidebarOpen);
            }}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-gray-700 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaryColor dark:text-white dark:hover:bg-meta-4"
          >
            <Menu className="h-6 w-6" aria-hidden />
          </button>
          <Link href="/dashboard" className="flex min-w-0 items-center gap-2">
            <Image src={appConfig.logoUrl} width={36} height={30} alt="" className="h-8 w-auto shrink-0" />
            <span className="truncate text-sm font-bold text-primaryColor dark:text-white">MJSC</span>
          </Link>
        </div>

        {/* Grand écran : le menu latéral est toujours visible, rien à gauche */}
        <div className="hidden lg:block" />

        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          <Link
            href="/"
            className="hidden min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-primaryColor focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaryColor sm:inline-flex dark:text-bodydark dark:hover:bg-meta-4"
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            Voir le site
          </Link>
          <ul className="flex items-center px-1">
            <DarkModeSwitcher />
          </ul>
          <AdminUserMenu />
        </div>
      </div>
    </header>
  );
};

export default HeaderClear;
