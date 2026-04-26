import type { SeoData } from "@/types/seo";

export type ProductStatus = "draft" | "published";

export interface ProductSpec {
  label: string;
  value: string;
}

export interface ProductMeasurement {
  name: string;
  width?: string;
  height?: string;
  depth?: string;
  length?: string;
  capacity?: string;
  unit?: string;
  order: number;
}

export interface ProductData {
  title: string;
  category: string;
  excerpt: string;
  description: string;
  featured: boolean;
  status: ProductStatus;
  coverImage: string;
  coverAlt: string;
  gallery: string[];
  specSheet?: string;
  benefits: string[];
  specs: ProductSpec[];
  measurements: ProductMeasurement[];
  seo: SeoData;
}

export interface ProductEntry {
  id: number;
  slug: string;
  body: string;
  bodyHtml: string;
  data: ProductData;
}

export interface ProductInput extends ProductData {
  slug: string;
  body: string;
}
