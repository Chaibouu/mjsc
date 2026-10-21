"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { FaUser, FaAngleDown } from "react-icons/fa";
import { LayoutDashboard, LogOut, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/actions/logout";
import { roleLabels } from "@/settings/labels";
import { ROLES } from "@/lib/roles";
import type { User } from "@/types/user";

/** Liens de l'espace personnel selon le rôle (mêmes règles que la navigation du back-office). */
export function userSpaceLinks(user: User) {
  const isAssociation = user.role === ROLES.ASSOCIATION;
  return {
    space: isAssociation ? "/association" : "/dashboard",
    profile: isAssociation ? null : "/profil",
  };
}

export function displayName(user: User) {
  const full = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return full || user.name || user.email;
}

export function UserAvatar({ user, className }: { user: User; className?: string }) {
  return (
    <Avatar className={className}>
      <AvatarImage src={user.profilePicture || user.image || ""} alt={displayName(user)} />
      <AvatarFallback className="bg-slate-600">
        <FaUser className="text-white" />
      </AvatarFallback>
    </Avatar>
  );
}

export function useLogout() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onLogout = () =>
    startTransition(async () => {
      await logout();
      router.push("/");
      router.refresh();
    });

  return { onLogout, isPending };
}

/** Avatar + menu de l'utilisateur connecté, pour la barre de navigation du site public. */
export function UserMenu({ user }: { user: User }) {
  const { space, profile } = userSpaceLinks(user);
  const { onLogout, isPending } = useLogout();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-3 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white">
        <span className="hidden text-right lg:block">
          <span className="block max-w-[160px] truncate text-sm font-medium text-white">
            {displayName(user)}
          </span>
          <span className="block text-xs text-white/80">
            {roleLabels[user.role] ?? user.role}
          </span>
        </span>
        <UserAvatar user={user} className="h-10 w-10 border-2 border-white/70" />
        <FaAngleDown className="text-white" aria-hidden />
        <span className="sr-only">Ouvrir le menu du compte</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-medium">{displayName(user)}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={space} className="cursor-pointer">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Mon espace
          </Link>
        </DropdownMenuItem>
        {profile && (
          <DropdownMenuItem asChild>
            <Link href={profile} className="cursor-pointer">
              <UserRound className="mr-2 h-4 w-4" />
              Mon profil
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            onLogout();
          }}
          disabled={isPending}
          className="cursor-pointer text-red-600 focus:text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {isPending ? "Déconnexion…" : "Se déconnecter"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
