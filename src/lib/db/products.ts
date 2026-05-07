import { getCollection } from "astro:content";
import { marked } from "marked";
import type { Sql } from "postgres";
import type { ProductEntry, ProductInput, ProductMeasurement, ProductSpec, ProductStatus } from "@/types/product";
import { getDb } from "@/lib/db/core";

interface ProductRow {
  id: number;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  description: string;
  featured: boolean;
  status: ProductStatus;
  cover_image: string;
  cover_alt: string;
  gallery_json: string;
  spec_sheet: string | null;
  benefits_json: string;
  specs_json: string;
  seo_title: string;
  seo_description: string;
  seo_canonical: string | null;
  seo_image: string | null;
  body_markdown: string;
  body_html: string;
  price: number | string | null;
  show_price: boolean | null;
}

interface ProductMeasurementRow {
  id: number;
  product_id: number;
  name: string;
  width: string | null;
  height: string | null;
  depth: string | null;
  length: string | null;
  capacity: string | null;
  unit: string | null;
  sort_order: number;
}

export interface ProductListOptions {
  includeDrafts?: boolean;
  featuredOnly?: boolean;
  category?: string;
}

function parseJsonArray<T>(value: string, fallback: T[]): T[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

function cleanOptional(value: string | null) {
  return value ?? undefined;
}

function parseOptionalNumber(value: number | string | null): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function mapMeasurementRow(row: ProductMeasurementRow): ProductMeasurement {
  return {
    name: row.name,
    width: cleanOptional(row.width),
    height: cleanOptional(row.height),
    depth: cleanOptional(row.depth),
    length: cleanOptional(row.length),
    capacity: cleanOptional(row.capacity),
    unit: cleanOptional(row.unit),
    order: row.sort_order,
  };
}

async function getMeasurementsByProductId(instance: Sql, productId: number): Promise<ProductMeasurement[]> {
  const rows = await instance<ProductMeasurementRow[]>`
    SELECT id, product_id, name, width, height, depth, length, capacity, unit, sort_order
    FROM product_measurements
    WHERE product_id = ${productId}
    ORDER BY sort_order ASC, id ASC
  `;

  return rows.map(mapMeasurementRow);
}

async function mapProductRow(instance: Sql, row: ProductRow): Promise<ProductEntry> {
  return {
    id: row.id,
    slug: row.slug,
    body: row.body_markdown,
    bodyHtml: row.body_html,
    data: {
      title: row.title,
      category: row.category,
      excerpt: row.excerpt,
      description: row.description,
      featured: row.featured,
      status: row.status,
      coverImage: row.cover_image,
      coverAlt: row.cover_alt,
      gallery: parseJsonArray<string>(row.gallery_json, []),
      specSheet: row.spec_sheet ?? undefined,
      benefits: parseJsonArray<string>(row.benefits_json, []),
      specs: parseJsonArray<ProductSpec>(row.specs_json, []),
      measurements: await getMeasurementsByProductId(instance, row.id),
      seo: {
        title: row.seo_title,
        description: row.seo_description,
        canonical: row.seo_canonical ?? undefined,
        image: row.seo_image ?? undefined,
      },
      price: parseOptionalNumber(row.price),
      show_price: typeof row.show_price === 'boolean' ? row.show_price : false,
    },
  };
}

async function importMarkdownProducts(instance: Sql) {
  const entries = await getCollection("products");

  for (const entry of entries) {
    const bodyMarkdown = typeof (entry as { body?: string }).body === "string" ? (entry as { body?: string }).body ?? "" : "";
    const bodyHtml = await marked.parse(bodyMarkdown);

    const rows = await instance<{ id: number }[]>`
      INSERT INTO products (
        slug, title, category, excerpt, description, featured, status,
        cover_image, cover_alt, gallery_json, spec_sheet, benefits_json,
        specs_json, seo_title, seo_description, seo_canonical, seo_image,
        body_markdown, body_html
      ) VALUES (
        ${entry.slug}, ${entry.data.title}, ${entry.data.category}, ${entry.data.excerpt}, ${entry.data.description},
        ${entry.data.featured}, ${entry.data.status}, ${entry.data.coverImage}, ${entry.data.coverAlt},
        ${JSON.stringify(entry.data.gallery ?? [])}, ${entry.data.specSheet ?? null}, ${JSON.stringify(entry.data.benefits ?? [])},
        ${JSON.stringify(entry.data.specs ?? [])}, ${entry.data.seo.title}, ${entry.data.seo.description},
        ${entry.data.seo.canonical ?? null}, ${entry.data.seo.image ?? null}, ${bodyMarkdown}, ${bodyHtml}
      )
      ON CONFLICT (slug) DO NOTHING
      RETURNING id::int AS id
    `;

    const productId = rows[0]?.id;
    if (!productId) continue;

    const measurements = (entry.data as { measurements?: ProductMeasurement[] }).measurements ?? [];
    for (const [index, measurement] of measurements.entries()) {
      await instance`
        INSERT INTO product_measurements (
          product_id, name, width, height, depth, length, capacity, unit, sort_order
        ) VALUES (
          ${productId}, ${measurement.name}, ${measurement.width ?? null}, ${measurement.height ?? null},
          ${measurement.depth ?? null}, ${measurement.length ?? null}, ${measurement.capacity ?? null},
          ${measurement.unit ?? null}, ${measurement.order ?? index}
        )
      `;
    }
  }
}

export async function ensureProductTables(instance: Sql) {
  const countRows = await instance<{ count: number }[]>`SELECT COUNT(*)::int AS count FROM products`;
  if (countRows[0]?.count === 0) {
    await importMarkdownProducts(instance);
  }
}

async function getDatabase() {
  return getDb();
}

async function replaceMeasurements(instance: Sql, productId: number, measurements: ProductMeasurement[]) {
  await instance.begin(async (tx) => {
    await tx`DELETE FROM product_measurements WHERE product_id = ${productId}`;

    for (const [index, measurement] of measurements.entries()) {
      await tx`
        INSERT INTO product_measurements (
          product_id, name, width, height, depth, length, capacity, unit, sort_order
        ) VALUES (
          ${productId}, ${measurement.name}, ${measurement.width ?? null}, ${measurement.height ?? null},
          ${measurement.depth ?? null}, ${measurement.length ?? null}, ${measurement.capacity ?? null},
          ${measurement.unit ?? null}, ${measurement.order ?? index}
        )
      `;
    }
  });
}

export async function listProducts(options: ProductListOptions = {}): Promise<ProductEntry[]> {
  const instance = await getDatabase();
  const conditions: string[] = [];
  const params: Array<string> = [];

  if (!options.includeDrafts) {
    params.push("published");
    conditions.push(`status = $${params.length}`);
  }

  if (options.featuredOnly) {
    conditions.push("featured = TRUE");
  }

  if (options.category) {
    params.push(options.category);
    conditions.push(`category = $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = await instance.unsafe<ProductRow[]>(
    `SELECT * FROM products ${whereClause} ORDER BY featured DESC, LOWER(title) ASC`,
    params,
  );

  return Promise.all(rows.map((row) => mapProductRow(instance, row)));
}

export async function getProductBySlugFromDb(slug: string, options: ProductListOptions = {}): Promise<ProductEntry | undefined> {
  const instance = await getDatabase();
  const rows = await instance<ProductRow[]>`SELECT * FROM products WHERE slug = ${slug} LIMIT 1`;
  const row = rows[0];
  if (!row) return undefined;
  if (!options.includeDrafts && row.status !== "published") return undefined;
  return mapProductRow(instance, row);
}

export async function getProductById(id: number): Promise<ProductEntry | undefined> {
  const instance = await getDatabase();
  const rows = await instance<ProductRow[]>`SELECT * FROM products WHERE id = ${id} LIMIT 1`;
  const row = rows[0];
  return row ? mapProductRow(instance, row) : undefined;
}

async function toStoredProduct(input: ProductInput) {
  const body = input.body ?? "";
  return {
    slug: input.slug,
    title: input.title,
    category: input.category,
    excerpt: input.excerpt,
    description: input.description,
    featured: input.featured,
    status: input.status,
    coverImage: input.coverImage,
    coverAlt: input.coverAlt,
    galleryJson: JSON.stringify(input.gallery ?? []),
    specSheet: input.specSheet ?? null,
    benefitsJson: JSON.stringify(input.benefits ?? []),
    specsJson: JSON.stringify(input.specs ?? []),
    measurements: input.measurements ?? [],
    seoTitle: input.seo.title,
    seoDescription: input.seo.description,
    seoCanonical: input.seo.canonical ?? null,
    seoImage: input.seo.image ?? null,
    bodyMarkdown: body,
    bodyHtml: await marked.parse(body),
    price: typeof input.price === 'number' ? input.price : null,
    show_price: typeof input.show_price === 'boolean' ? input.show_price : false,
  };
}

export async function createProduct(input: ProductInput): Promise<ProductEntry> {
  const instance = await getDatabase();
  const stored = await toStoredProduct(input);
  const rows = await instance<{ id: number }[]>`
    INSERT INTO products (
      slug, title, category, excerpt, description, featured, status,
      cover_image, cover_alt, gallery_json, spec_sheet, benefits_json,
      specs_json, seo_title, seo_description, seo_canonical, seo_image,
      body_markdown, body_html, price, show_price, updated_at
    ) VALUES (
      ${stored.slug}, ${stored.title}, ${stored.category}, ${stored.excerpt}, ${stored.description},
      ${stored.featured}, ${stored.status}, ${stored.coverImage}, ${stored.coverAlt}, ${stored.galleryJson},
      ${stored.specSheet}, ${stored.benefitsJson}, ${stored.specsJson}, ${stored.seoTitle},
      ${stored.seoDescription}, ${stored.seoCanonical}, ${stored.seoImage}, ${stored.bodyMarkdown},
      ${stored.bodyHtml}, ${stored.price}, ${stored.show_price}, NOW()
    )
    RETURNING id::int AS id
  `;

  await replaceMeasurements(instance, rows[0].id, stored.measurements);
  return (await getProductById(rows[0].id)) as ProductEntry;
}

export async function updateProduct(id: number, input: ProductInput): Promise<ProductEntry | undefined> {
  const instance = await getDatabase();
  const stored = await toStoredProduct(input);
  const rows = await instance<{ id: number }[]>`
    UPDATE products
    SET
      slug = ${stored.slug},
      title = ${stored.title},
      category = ${stored.category},
      excerpt = ${stored.excerpt},
      description = ${stored.description},
      featured = ${stored.featured},
      status = ${stored.status},
      cover_image = ${stored.coverImage},
      cover_alt = ${stored.coverAlt},
      gallery_json = ${stored.galleryJson},
      spec_sheet = ${stored.specSheet},
      benefits_json = ${stored.benefitsJson},
      specs_json = ${stored.specsJson},
      seo_title = ${stored.seoTitle},
      seo_description = ${stored.seoDescription},
      seo_canonical = ${stored.seoCanonical},
      seo_image = ${stored.seoImage},
      body_markdown = ${stored.bodyMarkdown},
      body_html = ${stored.bodyHtml},
      price = ${stored.price},
      show_price = ${stored.show_price},
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING id::int AS id
  `;

  if (rows.length === 0) return undefined;
  await replaceMeasurements(instance, id, stored.measurements);
  return getProductById(id);
}

export async function deleteProduct(id: number): Promise<boolean> {
  const instance = await getDatabase();
  const rows = await instance<{ id: number }[]>`DELETE FROM products WHERE id = ${id} RETURNING id::int AS id`;
  return rows.length > 0;
}
