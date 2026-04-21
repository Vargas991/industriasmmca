import type { SeoData } from "@/types/seo";

export interface Product {
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  description: string;
  featured: boolean;
  status: "draft" | "published";
  coverImage: string;
  coverAlt: string;
  gallery: string[];
  specSheet?: string;
  benefits: string[];
  specs?: Array<{
    label: string;
    value: string;
  }>;
  seo: SeoData;
}
