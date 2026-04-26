import { z } from "zod";
import type { ProductCategoryInput, ProductCategoryStatus } from "@/types/productCategory";
import { slugify } from "@/lib/utils/strings";

const statusSchema = z.enum(["draft", "published"]);

const seoSchema = z.object({
  title: z.string().trim().min(1, "El title SEO es obligatorio."),
  description: z.string().trim().min(1, "La descripción SEO es obligatoria."),
  canonical: z.string().trim().optional(),
  image: z.string().trim().optional(),
});

const categorySchema = z.object({
  slug: z.string().trim().optional(),
  title: z.string().trim().min(1, "El título es obligatorio."),
  excerpt: z.string().trim().min(1, "El extracto es obligatorio."),
  description: z.string().trim().min(1, "La descripción es obligatoria."),
  featured: z.boolean().default(false),
  status: statusSchema.default("draft"),
  order: z.number().int().default(0),
  coverImage: z.string().trim().min(1, "La imagen de portada es obligatoria."),
  coverAlt: z.string().trim().min(1, "El alt de portada es obligatorio."),
  seo: seoSchema,
  body: z.string().default(""),
});

function cleanOptional(value?: string) {
  return value && value.length > 0 ? value : undefined;
}

export function parseAdminCategoryPayload(payload: unknown): ProductCategoryInput {
  const parsed = categorySchema.parse(payload);
  const slug = slugify(parsed.slug && parsed.slug.length > 0 ? parsed.slug : parsed.title);

  return {
    slug,
    title: parsed.title,
    excerpt: parsed.excerpt,
    description: parsed.description,
    featured: parsed.featured,
    status: parsed.status as ProductCategoryStatus,
    order: parsed.order,
    coverImage: parsed.coverImage,
    coverAlt: parsed.coverAlt,
    seo: {
      title: parsed.seo.title,
      description: parsed.seo.description,
      canonical: cleanOptional(parsed.seo.canonical),
      image: cleanOptional(parsed.seo.image),
    },
    body: parsed.body,
  };
}
