import type { BreadcrumbItem } from "@/types/seo";

export function buildBreadcrumbs(items: BreadcrumbItem[]): BreadcrumbItem[] {
  return [{ name: "Inicio", url: "/" }, ...items];
}
