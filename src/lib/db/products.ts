import Database from "better-sqlite3";
import { getCollection } from "astro:content";
import { marked } from "marked";
import type { ProductEntry, ProductInput, ProductMeasurement, ProductSpec, ProductStatus } from "@/types/product";
import { getDb } from "@/lib/db/core";

interface ProductRow {
  id: number;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  description: string;
  featured: number;
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

function getMeasurementsByProductId(instance: Database.Database, productId: number): ProductMeasurement[] {
  const rows = instance.prepare(`
    SELECT id, product_id, name, width, height, depth, length, capacity, unit, sort_order
    FROM product_measurements
    WHERE product_id = ?
    ORDER BY sort_order ASC, id ASC
  `).all(productId) as ProductMeasurementRow[];

  return rows.map(mapMeasurementRow);
}

function mapProductRow(instance: Database.Database, row: ProductRow): ProductEntry {
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
      featured: Boolean(row.featured),
      status: row.status,
      coverImage: row.cover_image,
      coverAlt: row.cover_alt,
      gallery: parseJsonArray<string>(row.gallery_json, []),
      specSheet: row.spec_sheet ?? undefined,
      benefits: parseJsonArray<string>(row.benefits_json, []),
      specs: parseJsonArray<ProductSpec>(row.specs_json, []),
      measurements: getMeasurementsByProductId(instance, row.id),
      seo: {
        title: row.seo_title,
        description: row.seo_description,
        canonical: row.seo_canonical ?? undefined,
        image: row.seo_image ?? undefined,
      },
    },
  };
}

async function importMarkdownProducts(instance: Database.Database) {
  const entries = await getCollection("products");
  const insert = instance.prepare(`
    INSERT INTO products (
      slug, title, category, excerpt, description, featured, status,
      cover_image, cover_alt, gallery_json, spec_sheet, benefits_json,
      specs_json, seo_title, seo_description, seo_canonical, seo_image,
      body_markdown, body_html
    ) VALUES (
      @slug, @title, @category, @excerpt, @description, @featured, @status,
      @coverImage, @coverAlt, @galleryJson, @specSheet, @benefitsJson,
      @specsJson, @seoTitle, @seoDescription, @seoCanonical, @seoImage,
      @bodyMarkdown, @bodyHtml
    )
  `);
  const insertMeasurement = instance.prepare(`
    INSERT INTO product_measurements (
      product_id, name, width, height, depth, length, capacity, unit, sort_order
    ) VALUES (
      @productId, @name, @width, @height, @depth, @length, @capacity, @unit, @sortOrder
    )
  `);

  for (const entry of entries) {
    const bodyMarkdown = typeof (entry as { body?: string }).body === "string" ? (entry as { body?: string }).body ?? "" : "";
    const bodyHtml = await marked.parse(bodyMarkdown);

    const result = insert.run({
      slug: entry.slug,
      title: entry.data.title,
      category: entry.data.category,
      excerpt: entry.data.excerpt,
      description: entry.data.description,
      featured: entry.data.featured ? 1 : 0,
      status: entry.data.status,
      coverImage: entry.data.coverImage,
      coverAlt: entry.data.coverAlt,
      galleryJson: JSON.stringify(entry.data.gallery ?? []),
      specSheet: entry.data.specSheet ?? null,
      benefitsJson: JSON.stringify(entry.data.benefits ?? []),
      specsJson: JSON.stringify(entry.data.specs ?? []),
      seoTitle: entry.data.seo.title,
      seoDescription: entry.data.seo.description,
      seoCanonical: entry.data.seo.canonical ?? null,
      seoImage: entry.data.seo.image ?? null,
      bodyMarkdown,
      bodyHtml,
    });

    const productId = Number(result.lastInsertRowid);
    const measurements = (entry.data as { measurements?: ProductMeasurement[] }).measurements ?? [];
    measurements.forEach((measurement, index) => {
      insertMeasurement.run({
        productId,
        name: measurement.name,
        width: measurement.width ?? null,
        height: measurement.height ?? null,
        depth: measurement.depth ?? null,
        length: measurement.length ?? null,
        capacity: measurement.capacity ?? null,
        unit: measurement.unit ?? null,
        sortOrder: measurement.order ?? index,
      });
    });
  }
}

export async function ensureProductTables(instance: Database.Database) {
  instance.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      excerpt TEXT NOT NULL,
      description TEXT NOT NULL,
      featured INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
      cover_image TEXT NOT NULL,
      cover_alt TEXT NOT NULL,
      gallery_json TEXT NOT NULL DEFAULT '[]',
      spec_sheet TEXT,
      benefits_json TEXT NOT NULL DEFAULT '[]',
      specs_json TEXT NOT NULL DEFAULT '[]',
      seo_title TEXT NOT NULL,
      seo_description TEXT NOT NULL,
      seo_canonical TEXT,
      seo_image TEXT,
      body_markdown TEXT NOT NULL DEFAULT '',
      body_html TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS product_measurements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      width TEXT,
      height TEXT,
      depth TEXT,
      length TEXT,
      capacity TEXT,
      unit TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `);

  const countRow = instance.prepare("SELECT COUNT(*) AS count FROM products").get() as { count: number };
  if (countRow.count === 0) {
    await importMarkdownProducts(instance);
  }
}

async function getDatabase() {
  return getDb();
}

function replaceMeasurements(instance: Database.Database, productId: number, measurements: ProductMeasurement[]) {
  const remove = instance.prepare("DELETE FROM product_measurements WHERE product_id = ?");
  const insert = instance.prepare(`
    INSERT INTO product_measurements (
      product_id, name, width, height, depth, length, capacity, unit, sort_order
    ) VALUES (
      @productId, @name, @width, @height, @depth, @length, @capacity, @unit, @sortOrder
    )
  `);

  const transaction = instance.transaction((items: ProductMeasurement[]) => {
    remove.run(productId);
    items.forEach((measurement, index) => {
      insert.run({
        productId,
        name: measurement.name,
        width: measurement.width ?? null,
        height: measurement.height ?? null,
        depth: measurement.depth ?? null,
        length: measurement.length ?? null,
        capacity: measurement.capacity ?? null,
        unit: measurement.unit ?? null,
        sortOrder: measurement.order ?? index,
      });
    });
  });

  transaction(measurements);
}

export async function listProducts(options: ProductListOptions = {}): Promise<ProductEntry[]> {
  const instance = await getDatabase();
  const conditions: string[] = [];
  const params: Record<string, string | number> = {};

  if (!options.includeDrafts) {
    conditions.push("status = @status");
    params.status = "published";
  }

  if (options.featuredOnly) {
    conditions.push("featured = 1");
  }

  if (options.category) {
    conditions.push("category = @category");
    params.category = options.category;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = instance
    .prepare(`SELECT * FROM products ${whereClause} ORDER BY featured DESC, title COLLATE NOCASE ASC`)
    .all(params) as ProductRow[];

  return rows.map((row) => mapProductRow(instance, row));
}

export async function getProductBySlugFromDb(slug: string, options: ProductListOptions = {}): Promise<ProductEntry | undefined> {
  const instance = await getDatabase();
  const row = instance.prepare("SELECT * FROM products WHERE slug = ? LIMIT 1").get(slug) as ProductRow | undefined;
  if (!row) return undefined;
  if (!options.includeDrafts && row.status !== "published") return undefined;
  return mapProductRow(instance, row);
}

export async function getProductById(id: number): Promise<ProductEntry | undefined> {
  const instance = await getDatabase();
  const row = instance.prepare("SELECT * FROM products WHERE id = ? LIMIT 1").get(id) as ProductRow | undefined;
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
    featured: input.featured ? 1 : 0,
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
  };
}

export async function createProduct(input: ProductInput): Promise<ProductEntry> {
  const instance = await getDatabase();
  const stored = await toStoredProduct(input);
  const result = instance.prepare(`
    INSERT INTO products (
      slug, title, category, excerpt, description, featured, status,
      cover_image, cover_alt, gallery_json, spec_sheet, benefits_json,
      specs_json, seo_title, seo_description, seo_canonical, seo_image,
      body_markdown, body_html, updated_at
    ) VALUES (
      @slug, @title, @category, @excerpt, @description, @featured, @status,
      @coverImage, @coverAlt, @galleryJson, @specSheet, @benefitsJson,
      @specsJson, @seoTitle, @seoDescription, @seoCanonical, @seoImage,
      @bodyMarkdown, @bodyHtml, CURRENT_TIMESTAMP
    )
  `).run(stored);

  replaceMeasurements(instance, Number(result.lastInsertRowid), stored.measurements);

  return (await getProductById(Number(result.lastInsertRowid))) as ProductEntry;
}

export async function updateProduct(id: number, input: ProductInput): Promise<ProductEntry | undefined> {
  const instance = await getDatabase();
  const stored = await toStoredProduct(input);
  const result = instance.prepare(`
    UPDATE products
    SET
      slug = @slug,
      title = @title,
      category = @category,
      excerpt = @excerpt,
      description = @description,
      featured = @featured,
      status = @status,
      cover_image = @coverImage,
      cover_alt = @coverAlt,
      gallery_json = @galleryJson,
      spec_sheet = @specSheet,
      benefits_json = @benefitsJson,
      specs_json = @specsJson,
      seo_title = @seoTitle,
      seo_description = @seoDescription,
      seo_canonical = @seoCanonical,
      seo_image = @seoImage,
      body_markdown = @bodyMarkdown,
      body_html = @bodyHtml,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `).run({ id, ...stored });

  if (result.changes === 0) return undefined;
  replaceMeasurements(instance, id, stored.measurements);
  return getProductById(id);
}

export async function deleteProduct(id: number): Promise<boolean> {
  const instance = await getDatabase();
  const result = instance.prepare("DELETE FROM products WHERE id = ?").run(id);
  return result.changes > 0;
}
