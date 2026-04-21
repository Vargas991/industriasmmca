import type { SeoData } from "@/types/seo";

export interface Project {
  title: string;
  slug: string;
  client: string;
  sector: string;
  location: string;
  excerpt: string;
  description: string;
  year: string;
  status: "draft" | "published";
  featured: boolean;
  coverImage: string;
  coverAlt: string;
  gallery: string[];
  seo: SeoData;
}
