import type { NavItem } from "@/types/common";

export const mainNavigation: NavItem[] = [
  { label: "INICIO", href: "/" },
  { label: "PRODUCTOS", href: "/productos" },
  { label: "SERVICIOS", href: "/servicios" },
  { label: "PROYECTOS", href: "/proyectos" },
  { label: "NOSOTROS", href: "/nosotros" },
  { label: "CONTACTO", href: "/contacto" },
];

export const footerNavigation: NavItem[] = [
  { label: "Catalogo de productos", href: "/productos" },
  { label: "Servicios industriales", href: "/servicios" },
  { label: "Proyectos", href: "/proyectos" },
  { label: "Blog", href: "/blog" },
];
