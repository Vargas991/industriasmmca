import { getCollection } from "astro:content";
import { marked } from "marked";
import type Database from "better-sqlite3";
import type {
  ProductCategoryEntry,
  ProductCategoryInput,
  ProductCategoryStatus,
} from "@/types/productCategory";
import { getDb } from "@/lib/db/core";

interface ProductCategoryRow {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  description: string;
  featured: number;
  status: ProductCategoryStatus;
  sort_order: number;
  cover_image: string;
  cover_alt: string;
  seo_title: string;
  seo_description: string;
  seo_canonical: string | null;
  seo_image: string | null;
  body_markdown: string;
  body_html: string;
}

export interface ProductCategoryListOptions {
  includeDrafts?: boolean;
  featuredOnly?: boolean;
}

function mapCategoryRow(row: ProductCategoryRow): ProductCategoryEntry {
  return {
    id: row.id,
    slug: row.slug,
    body: row.body_markdown,
    bodyHtml: row.body_html,
    data: {
      title: row.title,
      excerpt: row.excerpt,
      description: row.description,
      featured: Boolean(row.featured),
      status: row.status,
      order: row.sort_order,
      coverImage: row.cover_image,
      coverAlt: row.cover_alt,
      seo: {
        title: row.seo_title,
        description: row.seo_description,
        canonical: row.seo_canonical ?? undefined,
        image: row.seo_image ?? undefined,
      },
    },
  };
}

async function importMarkdownCategories(instance: Database.Database) {
  const entries = await getCollection("product-categories");
  const insert = instance.prepare(`
    INSERT INTO product_categories (
      slug, title, excerpt, description, featured, status, sort_order,
      cover_image, cover_alt, seo_title, seo_description, seo_canonical, seo_image,
      body_markdown, body_html
    ) VALUES (
      @slug, @title, @excerpt, @description, @featured, @status, @sortOrder,
      @coverImage, @coverAlt, @seoTitle, @seoDescription, @seoCanonical, @seoImage,
      @bodyMarkdown, @bodyHtml
    )
  `);

  for (const entry of entries) {
    const bodyMarkdown = typeof (entry as { body?: string }).body === "string" ? (entry as { body?: string }).body ?? "" : "";
    const bodyHtml = await marked.parse(bodyMarkdown);

    insert.run({
      slug: entry.slug,
      title: entry.data.title,
      excerpt: entry.data.excerpt,
      description: entry.data.description,
      featured: entry.data.featured ? 1 : 0,
      status: entry.data.status,
      sortOrder: entry.data.order,
      coverImage: entry.data.coverImage,
      coverAlt: entry.data.coverAlt,
      seoTitle: entry.data.seo.title,
      seoDescription: entry.data.seo.description,
      seoCanonical: entry.data.seo.canonical ?? null,
      seoImage: entry.data.seo.image ?? null,
      bodyMarkdown,
      bodyHtml,
    });
  }
}

export async function ensureCategoryTables(instance: Database.Database) {
  instance.exec(`
    CREATE TABLE IF NOT EXISTS product_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      excerpt TEXT NOT NULL,
      description TEXT NOT NULL,
      featured INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
      sort_order INTEGER NOT NULL DEFAULT 0,
      cover_image TEXT NOT NULL,
      cover_alt TEXT NOT NULL,
      seo_title TEXT NOT NULL,
      seo_description TEXT NOT NULL,
      seo_canonical TEXT,
      seo_image TEXT,
      body_markdown TEXT NOT NULL DEFAULT '',
      body_html TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const countRow = instance.prepare("SELECT COUNT(*) AS count FROM product_categories").get() as { count: number };
  if (countRow.count === 0) {
    await importMarkdownCategories(instance);
  }
}

async function getDatabase() {
  return getDb();
}

async function toStoredCategory(input: ProductCategoryInput) {
  const body = input.body ?? "";
  return {
    slug: input.slug,
    title: input.title,
    excerpt: input.excerpt,
    description: input.description,
    featured: input.featured ? 1 : 0,
    status: input.status,
    sortOrder: input.order,
    coverImage: input.coverImage,
    coverAlt: input.coverAlt,
    seoTitle: input.seo.title,
    seoDescription: input.seo.description,
    seoCanonical: input.seo.canonical ?? null,
    seoImage: input.seo.image ?? null,
    bodyMarkdown: body,
    bodyHtml: await marked.parse(body),
  };
}

export async function listProductCategories(options: ProductCategoryListOptions = {}): Promise<ProductCategoryEntry[]> {
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

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = instance.prepare(`
    SELECT * FROM product_categories
    ${whereClause}
    ORDER BY sort_order ASC, title COLLATE NOCASE ASC
  `).all(params) as ProductCategoryRow[];

  return rows.map(mapCategoryRow);
}

export async function getProductCategoryBySlugFromDb(
  slug: string,
  options: ProductCategoryListOptions = {},
): Promise<ProductCategoryEntry | undefined> {
  const instance = await getDatabase();
  const row = instance.prepare("SELECT * FROM product_categories WHERE slug = ? LIMIT 1").get(slug) as ProductCategoryRow | undefined;
  if (!row) return undefined;
  if (!options.includeDrafts && row.status !== "published") return undefined;
  return mapCategoryRow(row);
}

export async function getProductCategoryById(id: number): Promise<ProductCategoryEntry | undefined> {
  const instance = await getDatabase();
  const row = instance.prepare("SELECT * FROM product_categories WHERE id = ? LIMIT 1").get(id) as ProductCategoryRow | undefined;
  return row ? mapCategoryRow(row) : undefined;
}

export async function createProductCategory(input: ProductCategoryInput): Promise<ProductCategoryEntry> {
  const instance = await getDatabase();
  const stored = await toStoredCategory(input);
  const result = instance.prepare(`
    INSERT INTO product_categories (
      slug, title, excerpt, description, featured, status, sort_order,
      cover_image, cover_alt, seo_title, seo_description, seo_canonical, seo_image,
      body_markdown, body_html, updated_at
    ) VALUES (
      @slug, @title, @excerpt, @description, @featured, @status, @sortOrder,
      @coverImage, @coverAlt, @seoTitle, @seoDescription, @seoCanonical, @seoImage,
      @bodyMarkdown, @bodyHtml, CURRENT_TIMESTAMP
    )
  `).run(stored);

  return (await getProductCategoryById(Number(result.lastInsertRowid))) as ProductCategoryEntry;
}

export async function updateProductCategory(id: number, input: ProductCategoryInput): Promise<ProductCategoryEntry | undefined> {
  const instance = await getDatabase();
  const previous = await getProductCategoryById(id);
  if (!previous) return undefined;
  const stored = await toStoredCategory(input);
  const transaction = instance.transaction(() => {
    const result = instance.prepare(`
      UPDATE product_categories
      SET
        slug = @slug,
        title = @title,
        excerpt = @excerpt,
        description = @description,
        featured = @featured,
        status = @status,
        sort_order = @sortOrder,
        cover_image = @coverImage,
        cover_alt = @coverAlt,
        seo_title = @seoTitle,
        seo_description = @seoDescription,
        seo_canonical = @seoCanonical,
        seo_image = @seoImage,
        body_markdown = @bodyMarkdown,
        body_html = @bodyHtml,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `).run({ id, ...stored });

    if (result.changes > 0 && previous.slug !== stored.slug) {
      instance.prepare(`
        UPDATE products
        SET category = ?, updated_at = CURRENT_TIMESTAMP
        WHERE category = ?
      `).run(stored.slug, previous.slug);
    }

    return result;
  });

  const result = transaction();

  if (result.changes === 0) return undefined;
  return getProductCategoryById(id);
}

export async function deleteProductCategory(id: number): Promise<{ ok: boolean; reason?: string }> {
  const instance = await getDatabase();
  const category = await getProductCategoryById(id);
  if (!category) return { ok: false, reason: "Categoría no encontrada." };

  const count = instance.prepare("SELECT COUNT(*) AS count FROM products WHERE category = ?").get(category.slug) as { count: number };
  if (count.count > 0) {
    return { ok: false, reason: "No puedes eliminar una categoría que todavía tiene productos asociados." };
  }

  instance.prepare("DELETE FROM product_categories WHERE id = ?").run(id);
  return { ok: true };
}
