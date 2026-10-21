"use client"
import { Button } from "@/components/ui/button";
import appConfig from "@/settings";
import { menuItems } from "@/settings/navigation";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { useState } from "react";
import { Menu, X, MessageSquare, Target, Building2, Briefcase, FolderKanban, Users, Trophy, Palette, LayoutDashboard, UserRound, LogOut, LucideIcon } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { useSession } from "@/context/SessionContext";
import { UserMenu, UserAvatar, displayName, userSpaceLinks, useLogout } from "@/components/user-menu";
import { roleLabels } from "@/settings/labels";

// Liens de la barre : texte toujours blanc ; un trait de la couleur secondaire se trace
// progressivement de gauche à droite au survol, au focus clavier, menu ouvert et sur la page active.
const navLinkClass = cn(
  "relative bg-transparent text-white",
  "hover:bg-transparent hover:text-white focus:bg-transparent focus:text-white",
  "data-[state=open]:bg-transparent data-[state=open]:text-white data-[state=open]:hover:bg-transparent data-[state=open]:focus:bg-transparent",
  "after:pointer-events-none after:absolute after:left-4 after:bottom-0.5 after:h-0.5 after:w-0 after:rounded-full after:bg-secondaryColor",
  "after:transition-[width] after:duration-500 after:ease-in-out motion-reduce:after:transition-none",
  "hover:after:w-[calc(100%-2rem)] focus-visible:after:w-[calc(100%-2rem)] data-[state=open]:after:w-[calc(100%-2rem)]"
);
const navLinkActiveClass = "font-semibold after:w-[calc(100%-2rem)]";

interface ListItemProps extends React.ComponentPropsWithoutRef<"a"> {
  title: string;
  icon?: string;
}

// Mapping des icônes disponibles
const iconMap: Record<string, LucideIcon> = {
  MessageSquare,
  Target,
  Building2,
  Briefcase,
  FolderKanban,
  Users,
  Trophy,
  Palette,
};

const ListItem = React.forwardRef<React.ElementRef<"a">, ListItemProps>(
  ({ className, title, icon, children, ...props }, ref) => {
    const [isHovered, setIsHovered] = React.useState(false);
    const IconComponent = icon ? iconMap[icon] : null;
    
    return (
      <li>
        <NavigationMenuLink asChild>
          <a
            ref={ref}
            className={cn(
              "flex items-start gap-3 select-none rounded-md p-3 leading-none no-underline outline-none transition-colors focus:bg-accent focus:text-accent-foreground",
              className
            )}
            style={{
              backgroundColor: isHovered ? appConfig.secondaryLightTransparentColor : "transparent",
              color: isHovered ? appConfig.secondaryColor : "#1f2937", // Couleur de texte par défaut (gray-800)
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            {...props}
          >
            {IconComponent && (
              <IconComponent 
                className="h-5 w-5 mt-0.5 flex-shrink-0" 
                style={{ 
                  color: isHovered ? appConfig.secondaryColor : "#6b7280" // Couleur par défaut (gray-500)
                }}
              />
            )}
            <div className="flex-1 space-y-1">
              <div className="text-sm font-medium leading-none">{title}</div>
              {children && (
                <p className="line-clamp-2 text-sm leading-snug text-gray-600">
                  {children}
                </p>
              )}
            </div>
          </a>
        </NavigationMenuLink>
      </li>
    );
  }
);
ListItem.displayName = "ListItem";

function Navigation() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useSession();
  const { onLogout, isPending: isLoggingOut } = useLogout();

  const isActive = (path: string) => {
    // Vérifier si le pathname correspond exactement ou commence par le chemin (pour les sous-pages)
    const isActivePath = pathname === path || (path !== "/" && pathname.startsWith(path));
    return isActivePath;
  };

  // Un menu déroulant est actif si sa page ou l'une de ses sous-pages est ouverte
  const isGroupActive = (item: (typeof menuItems)[number]) =>
    isActive(item.href) || !!item.children?.some((child) => isActive(child.href));

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="bg-gradient-to-r from-orange-500 to-green-600 shadow-lg sticky top-0 z-50">
      {/* Menu de navigation avec logo et liens sur une seule ligne */}
      <div className="bg-gradient-to-r from-orange-500 to-green-600">
        <div className="flex items-center justify-between h-20 w-full">
          {/* Contenu principal avec max-width */}
          <div className="flex items-center gap-4 lg:gap-6 flex-1 min-w-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Logo Armoiries */}
            <Link href="/" className="flex-shrink-0">
            <Image
              src={appConfig.logoUrl}
                height={50}
                width={70}
                alt="Armoiries du Niger"
                className="object-contain"
              />
            </Link>
            
            {/* Texte officiel */}
            <div className="flex flex-col border-l-2 border-white/30 pl-3 sm:pl-4">
              <h2 className="text-xs lg:text-[10px] font-bold text-white">République du Niger</h2>
              <Image
                src="/arc.png"
                height={15}
                width={150}
                alt="Arc"
                className="object-contain"
              />
              {/* Nom du ministère */}
              <h2 className="text-xs lg:text-[10px] font-bold text-white mt-1 hidden lg:block">
                Ministère de la Jeunesse, des Sports et de la Culture
              </h2>
            </div>

            {/* Menu desktop */}
            <NavigationMenu className="hidden xl:flex ml-4">
              <NavigationMenuList className="flex items-center space-x-1">
                {menuItems.map((item) => {
                  if (item.children && item.children.length > 0) {
                    const itemIsActive = isGroupActive(item);
                    return (
                      <NavigationMenuItem key={item.href} className="hidden md:flex">
                        <NavigationMenuTrigger
                          className={cn(navLinkClass, itemIsActive && navLinkActiveClass)}
                        >
                          {item.label}
                        </NavigationMenuTrigger>
                        <NavigationMenuContent className="">
                          <ul
                            className={cn(
                              "grid gap-2 p-4",
                              item.children.length > 3
                                ? "w-[400px] md:w-[500px] md:grid-cols-2 lg:w-[600px]"
                                : "w-[340px]"
                            )}
                          >
                            {item.children.map((child) => (
                              <ListItem
                                key={child.href}
                                title={child.title}
                                href={child.href}
                                icon={child.icon}
                              >
                                {child.description}
                              </ListItem>
                            ))}
                          </ul>
                        </NavigationMenuContent>
                      </NavigationMenuItem>
                    );
                  }
                  const itemIsActive = isActive(item.href);
                  return (
                    <NavigationMenuItem key={item.href}>
                      <Link href={item.href} legacyBehavior passHref>
                        <NavigationMenuLink
                          className={cn(
                            navigationMenuTriggerStyle(),
                            navLinkClass,
                            itemIsActive && navLinkActiveClass
                          )}
                        >
                          {item.label}
                        </NavigationMenuLink>
            </Link>
                    </NavigationMenuItem>
                  );
                })}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Boutons Connexion/S'inscrire et menu mobile - à l'extrémité droite */}
          <div className="flex items-center gap-3 flex-shrink-0 px-4 sm:px-6 lg:px-8">
              {user ? (
                <UserMenu user={user} />
              ) : (
                <>
                  {/* Bouton Connexion */}
                  <Link href="/auth/login" className="hidden sm:block">
                    <button
                      className="px-4 py-2 rounded-md text-white text-sm font-medium border-2 border-white transition-colors"
                      style={{
                        backgroundColor: appConfig.secondaryColor,
                        borderColor: appConfig.secondaryColor,
                        color: "white",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "white";
                        e.currentTarget.style.borderColor = "white";
                        e.currentTarget.style.color = appConfig.pprimaryColor;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = appConfig.secondaryColor,
                        e.currentTarget.style.borderColor = appConfig.secondaryColor,
                        e.currentTarget.style.color = "white";
                      }}
                    >
                      Connexion
                    </button>
                </Link>

                  {/* Bouton S'inscrire */}
                  <Link href="/auth/signup" className="hidden sm:block">
                    <button
                      className="px-4 py-2 rounded-md text-white text-sm font-medium border-2 border-white bg-transparent transition-colors"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = appConfig.secondaryColor;
                        e.currentTarget.style.borderColor = appConfig.secondaryColor;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.borderColor = "white";
                      }}
                    >
                      S'inscrire
                    </button>
                </Link>
              
                </>
              )}

              {/* Bouton mobile menu */}
              <button
                onClick={toggleMobileMenu}
                className="xl:hidden text-white p-2"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
          </div>
        </div>
      </div>

      {/* Menu mobile */}
      {isMobileMenuOpen && (
        <div className="xl:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-3 space-y-2">
            {menuItems.map((item) => {
              const hasChildren = !!item.children && item.children.length > 0;
              return (
                <div key={item.href}>
                  {hasChildren ? (
                    // Un groupe (Ministère, Secteurs) n'a pas de page propre : simple titre
                    <p className={`px-4 py-2 font-medium ${isGroupActive(item) ? 'text-primary font-semibold' : 'text-gray-700'}`}>
                      {item.label}
                    </p>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`block px-4 py-2 rounded-md ${pathname === item.href ? 'text-primary font-semibold' : 'text-gray-700 hover:text-primary'} font-medium transition-colors`}
                    >
                      {item.label}
                    </Link>
                  )}
                  {hasChildren && (
                    <div className="pl-6 mt-1 space-y-1">
                      {item.children!.map((child) => {
                        const ChildIcon = child.icon ? iconMap[child.icon] : null;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm ${pathname === child.href ? 'text-primary font-semibold' : 'text-gray-600 hover:text-primary'} transition-colors`}
                          >
                            {ChildIcon && <ChildIcon className="h-4 w-4" />}
                            {child.title}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Compte : avatar et liens si connecté, sinon connexion / inscription */}
            <div className="border-t border-gray-200 pt-3 mt-3">
              {user ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-3 px-4 py-2">
                    <UserAvatar user={user} className="h-10 w-10" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">{displayName(user)}</p>
                      <p className="truncate text-xs text-gray-500">{roleLabels[user.role] ?? user.role}</p>
                    </div>
                  </div>
                  <Link
                    href={userSpaceLinks(user).space}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 rounded-md text-sm text-gray-700 hover:text-primary"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Mon espace
                  </Link>
                  {userSpaceLinks(user).profile && (
                    <Link
                      href={userSpaceLinks(user).profile!}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 rounded-md text-sm text-gray-700 hover:text-primary"
                    >
                      <UserRound className="h-4 w-4" />
                      Mon profil
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onLogout();
                    }}
                    disabled={isLoggingOut}
                    className="flex w-full items-center gap-2 px-4 py-2 rounded-md text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    {isLoggingOut ? "Déconnexion…" : "Se déconnecter"}
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 px-4 sm:hidden">
                  <Link
                    href="/auth/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex-1 rounded-md px-4 py-2 text-center text-sm font-medium text-white"
                    style={{ backgroundColor: appConfig.secondaryColor }}
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/auth/signup"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex-1 rounded-md border-2 px-4 py-2 text-center text-sm font-medium"
                    style={{ borderColor: appConfig.secondaryColor, color: appConfig.secondaryColor }}
                  >
                    S&apos;inscrire
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navigation;
