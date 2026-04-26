import type { SeoData } from "@/types/seo";

export type ProductCategoryStatus = "draft" | "published";

export interface ProductCategoryData {
  title: string;
  excerpt: string;
  description: string;
  featured: boolean;
  status: ProductCategoryStatus;
  order: number;
  coverImage: string;
  coverAlt: string;
  seo: SeoData;
}

export interface ProductCategoryEntry {
  id: number;
  slug: string;
  body: string;
  bodyHtml: string;
  data: ProductCategoryData;
}

export interface ProductCategoryInput extends ProductCategoryData {
  slug: string;
  body: string;
}
