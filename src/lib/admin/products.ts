import { z } from "zod";
import type { ProductInput, ProductMeasurement, ProductSpec, ProductStatus } from "@/types/product";
import { slugify } from "@/lib/utils/strings";

const statusSchema = z.enum(["draft", "published"]);

const specSchema = z.object({
  label: z.string().trim().min(1),
  value: z.string().trim().min(1),
});

const measurementSchema = z.object({
  name: z.string().trim().min(1, "El nombre de la medida es obligatorio."),
  width: z.string().trim().optional(),
  height: z.string().trim().optional(),
  depth: z.string().trim().optional(),
  length: z.string().trim().optional(),
  capacity: z.string().trim().optional(),
  unit: z.string().trim().optional(),
  order: z.number().int().nonnegative().default(0),
});

const seoSchema = z.object({
  title: z.string().trim().min(1, "El title SEO es obligatorio."),
  description: z.string().trim().min(1, "La descripción SEO es obligatoria."),
  canonical: z.string().trim().optional(),
  image: z.string().trim().optional(),
});

const productSchema = z.object({
  slug: z.string().trim().optional(),
  title: z.string().trim().min(1, "El título es obligatorio."),
  category: z.string().trim().min(1, "La categoría es obligatoria."),
  excerpt: z.string().trim().min(1, "El extracto es obligatorio."),
  description: z.string().trim().min(1, "La descripción corta es obligatoria."),
  featured: z.boolean().default(false),
  status: statusSchema.default("draft"),
  coverImage: z.string().trim().min(1, "La imagen de portada es obligatoria."),
  coverAlt: z.string().trim().min(1, "El alt de portada es obligatorio."),
  gallery: z.array(z.string().trim().min(1)).default([]),
  specSheet: z.string().trim().optional(),
  benefits: z.array(z.string().trim().min(1)).default([]),
  specs: z.array(specSchema).default([]),
  measurements: z.array(measurementSchema).default([]),
  seo: seoSchema,
  body: z.string().default(""),
  price: z.preprocess((v) => v === '' ? undefined : v, z.number().nonnegative().optional()),
  show_price: z.boolean().optional(),
});

export type AdminProductPayload = ProductInput;

function cleanOptional(value?: string) {
  return value && value.length > 0 ? value : undefined;
}

function normalizeSpecs(specs: ProductSpec[]) {
  return specs
    .map((spec) => ({
      label: spec.label.trim(),
      value: spec.value.trim(),
    }))
    .filter((spec) => spec.label.length > 0 && spec.value.length > 0);
}

function normalizeMeasurements(measurements: ProductMeasurement[]) {
  return measurements
    .map((measurement, index) => ({
      name: measurement.name.trim(),
      width: cleanOptional(measurement.width?.trim()),
      height: cleanOptional(measurement.height?.trim()),
      depth: cleanOptional(measurement.depth?.trim()),
      length: cleanOptional(measurement.length?.trim()),
      capacity: cleanOptional(measurement.capacity?.trim()),
      unit: cleanOptional(measurement.unit?.trim()),
      order: Number.isFinite(measurement.order) ? measurement.order : index,
    }))
    .filter((measurement) => measurement.name.length > 0);
}

export function parseAdminProductPayload(payload: unknown): AdminProductPayload {
  const parsed = productSchema.parse(payload);
  const slug = slugify(parsed.slug && parsed.slug.length > 0 ? parsed.slug : parsed.title);

  return {
    slug,
    title: parsed.title,
    category: parsed.category,
    excerpt: parsed.excerpt,
    description: parsed.description,
    featured: parsed.featured,
    status: parsed.status as ProductStatus,
    coverImage: parsed.coverImage,
    coverAlt: parsed.coverAlt,
    gallery: parsed.gallery.map((item) => item.trim()).filter(Boolean),
    specSheet: cleanOptional(parsed.specSheet),
    benefits: parsed.benefits.map((item) => item.trim()).filter(Boolean),
    specs: normalizeSpecs(parsed.specs),
    measurements: normalizeMeasurements(parsed.measurements),
    seo: {
      title: parsed.seo.title,
      description: parsed.seo.description,
      canonical: cleanOptional(parsed.seo.canonical),
      image: cleanOptional(parsed.seo.image),
    },
    body: parsed.body,
    price: parsed.price,
    show_price: parsed.show_price ?? false,
  };
}
