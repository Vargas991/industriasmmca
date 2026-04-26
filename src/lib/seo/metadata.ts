import { defaultSeoImage } from "@/config/seo";
import { siteConfig } from "@/config/site";
import { toAbsoluteUrl } from "@/lib/utils/urls";
import type { SeoData } from "@/types/seo";

export function buildDefaultSeo(): SeoData {
  return {
    title: `${siteConfig.name} | Soluciones metalmecánicas`,
    description: siteConfig.description,
    canonical: "/",
    image: defaultSeoImage,
    type: "website",
  };
}

export function buildPageSeo(input: Partial<SeoData> = {}): SeoData {
  const defaults = buildDefaultSeo();
  return {
    ...defaults,
    ...input,
    image: toAbsoluteUrl(input.image ?? defaults.image ?? defaultSeoImage),
  };
}

export function buildProductSeo(title: string, description: string, canonical: string, image?: string) {
  return buildPageSeo({
    title,
    description,
    canonical,
    image,
    type: "article",
  });
}

export const buildServiceSeo = buildProductSeo;
