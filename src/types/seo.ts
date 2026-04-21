export interface SeoData {
  title: string;
  description: string;
  canonical?: string;
  image?: string;
  type?: "website" | "article";
  noindex?: boolean;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}
