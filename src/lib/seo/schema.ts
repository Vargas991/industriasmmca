import { siteConfig } from "@/config/site";
import { toAbsoluteUrl } from "@/lib/utils/urls";
import type { BreadcrumbItem, SeoData } from "@/types/seo";

export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.legalName,
    url: siteConfig.url,
    email: siteConfig.email,
    telephone: siteConfig.phone,
    address: siteConfig.address,
  };
}

export function buildWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
  };
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: toAbsoluteUrl(item.url),
    })),
  };
}

export function buildThingSchema(
  kind: "Product" | "Service",
  seo: SeoData,
  description: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": kind,
    name: seo.title,
    description,
    url: toAbsoluteUrl(seo.canonical ?? "/"),
  };
}
