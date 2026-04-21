import type { NavItem } from "@/types/common";

export const mainNavigation: NavItem[] = [
  { label: "Inicio", href: "/" },
  { label: "Productos", href: "/productos" },
  { label: "Servicios", href: "/servicios" },
  { label: "Proyectos", href: "/proyectos" },
  { label: "Nosotros", href: "/nosotros" },
  { label: "Contacto", href: "/contacto" },
];

export const footerNavigation: NavItem[] = [
  { label: "Catalogo de productos", href: "/productos" },
  { label: "Servicios industriales", href: "/servicios" },
  { label: "Proyectos", href: "/proyectos" },
  { label: "Blog", href: "/blog" },
];
