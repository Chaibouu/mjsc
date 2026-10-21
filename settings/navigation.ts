import { ADMIN_ROLES, CONTENT_ROLES, ROLES } from "@/lib/roles";

export interface ChildrenItem {
  title: string;
  path: string;
  allowedRoles: string[];
}
export interface NavigationItem {
  title: string;
  icon: string;
  path: string;
  children?: ChildrenItem[];
  allowedRoles: string[];
}

export interface MenuChildItem {
  title: string;
  href: string;
  description?: string;
  icon?: string; // Nom de l'icône de lucide-react (optionnel)
}

export interface MenuItem {
  href: string;
  label: string;
  children?: MenuChildItem[];
}

export const adminNavigation: NavigationItem[] = [
  {
    title: "Dashboard",
    icon: "material-symbols:dashboard",
    path: "/dashboard",
    allowedRoles: [...CONTENT_ROLES, ROLES.USER],
  },
  {
    title: "Associations",
    icon: "material-symbols:home-work",
    path: "/association",
    allowedRoles: [...ADMIN_ROLES, ROLES.ASSOCIATION],
  },
  {
    title: "Profile",
    icon: "solar:user-bold-duotone",
    path: "/profil",
    allowedRoles: [...CONTENT_ROLES, ROLES.USER],
  },
  {
    title: "Utilisateurs",
    icon: "solar:users-group-two-rounded-bold-duotone",
    path: "/users",
    allowedRoles: [...ADMIN_ROLES],
  },
  {
    title: "Portail Web",
    // icon: "eos-icons:admin",
    icon: "solar:shield-network-broken",
    path: "/portail",
    children: [
      {
        title: "Articles",
        path: "/portail/articles",
        allowedRoles: [...CONTENT_ROLES],
      },
      {
        title: "Actualités",
        path: "/portail/actualites",
        allowedRoles: [...CONTENT_ROLES],
      },
      {
        title: "Projets",
        path: "/portail/projets",
        allowedRoles: [...CONTENT_ROLES],
      },
      {
        title: "Médias",
        path: "/portail/medias",
        allowedRoles: [...CONTENT_ROLES],
      },
    ],
    allowedRoles: [...CONTENT_ROLES],
  },
  {
    title: "Paramètres",
    icon: "material-symbols:settings",
    path: "/dashboard/settings",
    allowedRoles: [...ADMIN_ROLES],
  },
];



export const menuItems: MenuItem[] = [
  { href: "/", label: "Accueil" },
  { 
    href: "/ministere", 
    label: "Ministère",
    children: [
      {
        title: "Message du Ministre",
        href: "/ministere/message",
        description: "Discours et messages du ministre",
        icon: "MessageSquare"
      },
      {
        title: "Mission et Attributions",
        href: "/ministere/mission",
        description: "Les missions et attributions du ministère",
        icon: "Target"
      },
      {
        title: "Organisation du Ministère",
        href: "/ministere/organisation",
        description: "Structure organisationnelle",
        icon: "Building2"
      },
      {
        title: "Services Rattachés",
        href: "/ministere/services",
        description: "Les services rattachés au ministère",
        icon: "Briefcase"
      },
      {
        title: "Projets et Programmes",
        href: "/ministere/projets",
        description: "Projets et programmes en cours",
        icon: "FolderKanban"
      }
    ]
  },
  {
    href: "/secteurs",
    label: "Secteurs",
    children: [
      {
        title: "Jeunesse",
        href: "/jeunesse",
        description: "Programmes, opportunités et engagement des jeunes",
        icon: "Users"
      },
      {
        title: "Sports",
        href: "/sports",
        description: "Fédérations, compétitions et infrastructures sportives",
        icon: "Trophy"
      },
      {
        title: "Culture",
        href: "/culture",
        description: "Arts, patrimoine et événements culturels",
        icon: "Palette"
      }
    ]
  },
  { href: "/partenaire", label: "Partenaires" },
  { href: "/galerie", label: "Galerie" },
  { href: "/contact", label: "Contact" },
];
