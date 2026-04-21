import type { SeoData } from "@/types/seo";

export interface Service {
  title: string;
  slug: string;
  excerpt: string;
  description: string;
  featured: boolean;
  status: "draft" | "published";
  coverImage: string;
  coverAlt: string;
  gallery: string[];
  benefits: string[];
  process: string[];
  seo: SeoData;
}
