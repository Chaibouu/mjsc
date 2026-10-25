"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LayoutDashboard, LogIn, LogOut, Menu, UserPlus, UserRound } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { UserAvatar, displayName, userSpaceLinks, useLogout } from "@/components/user-menu";
import { navIconMap } from "@/components/nav-icons";
import { ButtonLoader } from "@/components/loader";
import { menuItems } from "@/settings/navigation";
import { roleLabels } from "@/settings/labels";
import appConfig from "@/settings";
import { cn } from "@/lib/utils";
import type { User } from "@/types/user";

const linkClass =
  "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium text-slate-700 transition-colors hover:bg-orange-50 hover:text-secondaryColor";
const activeClass = "bg-orange-50 font-semibold text-secondaryColor";

/** Menu du site sur mobile et tablette : panneau latéral (Sheet) ouvert par le bouton burger. */
export function MobileNav({ user }: { user: User | null }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const { onLogout, isPending: isLoggingOut } = useLogout();

  const isActive = (path: string) => pathname === path || (path !== "/" && pathname.startsWith(path));
  const isGroupActive = (item: (typeof menuItems)[number]) =>
    isActive(item.href) || !!item.children?.some((child) => isActive(child.href));

  // Les groupes contenant la page courante sont dépliés à l'ouverture
  const [expanded, setExpanded] = React.useState<string[]>([]);
  const handleOpenChange = (next: boolean) => {
    if (next) setExpanded(menuItems.filter((item) => item.children?.length && isGroupActive(item)).map((i) => i.href));
    setOpen(next);
  };
  const toggleGroup = (href: string) =>
    setExpanded((cur) => (cur.includes(href) ? cur.filter((h) => h !== href) : [...cur, href]));

  const links = user ? userSpaceLinks(user) : null;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger
        className="rounded-md p-2 text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white xl:hidden"
        aria-label="Ouvrir le menu"
      >
        <Menu size={26} />
      </SheetTrigger>

      <SheetContent
        side="right"
        className="flex w-[88vw] flex-col gap-0 p-0 sm:max-w-sm [&>button]:text-white [&>button]:opacity-90 [&>button:hover]:opacity-100"
      >
        {/* En-tête : identité du site + compte (connexion ou profil) */}
        <div className="bg-gradient-to-br from-orange-500 to-green-600 px-5 pb-5 pt-6 text-white">
          <SheetTitle className="flex items-center gap-3 pr-8 text-white">
            <Image src={appConfig.logoUrl} width={44} height={36} alt="" className="h-9 w-auto object-contain" />
            <span className="text-sm font-bold leading-tight">{appConfig.appName}</span>
          </SheetTitle>
          <SheetDescription className="sr-only">Menu de navigation du site</SheetDescription>

          {user && links ? (
            <div className="mt-5 rounded-xl bg-white/15 p-3 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <UserAvatar user={user} className="h-12 w-12 border-2 border-white/70" />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{displayName(user)}</p>
                  <p className="truncate text-xs text-white/80">{roleLabels[user.role] ?? user.role}</p>
                </div>
              </div>
              <div className={cn("mt-3 grid gap-2", links.profile ? "grid-cols-2" : "grid-cols-1")}>
                <SheetClose asChild>
                  <Link
                    href={links.space}
                    className="flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-white px-3 text-sm font-semibold text-primaryColor transition-opacity hover:opacity-90"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Mon espace
                  </Link>
                </SheetClose>
                {links.profile && (
                  <SheetClose asChild>
                    <Link
                      href={links.profile}
                      className="flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-white/70 px-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                    >
                      <UserRound className="h-4 w-4" />
                      Mon profil
                    </Link>
                  </SheetClose>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-2">
              <SheetClose asChild>
                <Link
                  href="/auth/login"
                  className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-secondaryColor px-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                >
                  <LogIn className="h-4 w-4" />
                  Connexion
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link
                  href="/auth/signup"
                  className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-white px-3 text-sm font-semibold text-primaryColor shadow-sm transition-opacity hover:opacity-90"
                >
                  <UserPlus className="h-4 w-4" />
                  S&apos;inscrire
                </Link>
              </SheetClose>
            </div>
          )}
        </div>

        {/* Liens du site */}
        <nav aria-label="Navigation principale" className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              if (!item.children?.length) {
                return (
                  <li key={item.href}>
                    <SheetClose asChild>
                      <Link
                        href={item.href}
                        aria-current={isActive(item.href) ? "page" : undefined}
                        className={cn(linkClass, isActive(item.href) && activeClass)}
                      >
                        {item.label}
                      </Link>
                    </SheetClose>
                  </li>
                );
              }

              const isOpen = expanded.includes(item.href);
              const panelId = `mobile-nav-${item.href.replace(/\W+/g, "")}`;
              return (
                <li key={item.href}>
                  <button
                    type="button"
                    onClick={() => toggleGroup(item.href)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className={cn(linkClass, "w-full justify-between", isGroupActive(item) && "text-secondaryColor")}
                  >
                    {item.label}
                    <ChevronDown
                      className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-180")}
                      aria-hidden
                    />
                  </button>
                  {isOpen && (
                    <ul id={panelId} className="ml-3 mt-1 space-y-0.5 border-l-2 border-orange-100 pl-2">
                      {item.children.map((child) => {
                        const Icon = child.icon ? navIconMap[child.icon] : null;
                        const active = isActive(child.href);
                        return (
                          <li key={child.href}>
                            <SheetClose asChild>
                              <Link
                                href={child.href}
                                aria-current={active ? "page" : undefined}
                                className={cn(linkClass, "text-sm font-normal", active && activeClass)}
                              >
                                {Icon && <Icon className="h-4 w-4 flex-shrink-0 opacity-70" aria-hidden />}
                                {child.title}
                              </Link>
                            </SheetClose>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Pied : déconnexion, ou mention officielle */}
        <div className="border-t px-4 py-3">
          {user ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              disabled={isLoggingOut}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
            >
              {isLoggingOut ? <ButtonLoader /> : <LogOut className="h-4 w-4" />}
              {isLoggingOut ? "Déconnexion…" : "Se déconnecter"}
            </button>
          ) : (
            <p className="py-1 text-center text-xs text-slate-500">République du Niger</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
