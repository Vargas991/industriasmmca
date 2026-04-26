import { getCollection } from "astro:content";
import { marked } from "marked";
import type { Sql } from "postgres";
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
  featured: boolean;
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
      featured: row.featured,
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

async function importMarkdownCategories(instance: Sql) {
  const entries = await getCollection("product-categories");

  for (const entry of entries) {
    const bodyMarkdown = typeof (entry as { body?: string }).body === "string" ? (entry as { body?: string }).body ?? "" : "";
    const bodyHtml = await marked.parse(bodyMarkdown);

    await instance`
      INSERT INTO product_categories (
        slug, title, excerpt, description, featured, status, sort_order,
        cover_image, cover_alt, seo_title, seo_description, seo_canonical, seo_image,
        body_markdown, body_html
      ) VALUES (
        ${entry.slug}, ${entry.data.title}, ${entry.data.excerpt}, ${entry.data.description},
        ${entry.data.featured}, ${entry.data.status}, ${entry.data.order},
        ${entry.data.coverImage}, ${entry.data.coverAlt}, ${entry.data.seo.title},
        ${entry.data.seo.description}, ${entry.data.seo.canonical ?? null},
        ${entry.data.seo.image ?? null}, ${bodyMarkdown}, ${bodyHtml}
      )
      ON CONFLICT (slug) DO NOTHING
    `;
  }
}

export async function ensureCategoryTables(instance: Sql) {
  await instance`
    CREATE TABLE IF NOT EXISTS product_categories (
      id BIGSERIAL PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      excerpt TEXT NOT NULL,
      description TEXT NOT NULL,
      featured BOOLEAN NOT NULL DEFAULT FALSE,
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
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  const countRows = await instance<{ count: number }[]>`SELECT COUNT(*)::int AS count FROM product_categories`;
  if (countRows[0]?.count === 0) {
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
    featured: input.featured,
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
  const params: Array<string> = [];

  if (!options.includeDrafts) {
    params.push("published");
    conditions.push(`status = $${params.length}`);
  }

  if (options.featuredOnly) {
    conditions.push("featured = TRUE");
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = await instance.unsafe<ProductCategoryRow[]>(
    `
      SELECT * FROM product_categories
      ${whereClause}
      ORDER BY sort_order ASC, LOWER(title) ASC
    `,
    params,
  );

  return rows.map(mapCategoryRow);
}

export async function getProductCategoryBySlugFromDb(
  slug: string,
  options: ProductCategoryListOptions = {},
): Promise<ProductCategoryEntry | undefined> {
  const instance = await getDatabase();
  const rows = await instance<ProductCategoryRow[]>`SELECT * FROM product_categories WHERE slug = ${slug} LIMIT 1`;
  const row = rows[0];
  if (!row) return undefined;
  if (!options.includeDrafts && row.status !== "published") return undefined;
  return mapCategoryRow(row);
}

export async function getProductCategoryById(id: number): Promise<ProductCategoryEntry | undefined> {
  const instance = await getDatabase();
  const rows = await instance<ProductCategoryRow[]>`SELECT * FROM product_categories WHERE id = ${id} LIMIT 1`;
  const row = rows[0];
  return row ? mapCategoryRow(row) : undefined;
}

export async function createProductCategory(input: ProductCategoryInput): Promise<ProductCategoryEntry> {
  const instance = await getDatabase();
  const stored = await toStoredCategory(input);
  const rows = await instance<{ id: number }[]>`
    INSERT INTO product_categories (
      slug, title, excerpt, description, featured, status, sort_order,
      cover_image, cover_alt, seo_title, seo_description, seo_canonical, seo_image,
      body_markdown, body_html, updated_at
    ) VALUES (
      ${stored.slug}, ${stored.title}, ${stored.excerpt}, ${stored.description}, ${stored.featured},
      ${stored.status}, ${stored.sortOrder}, ${stored.coverImage}, ${stored.coverAlt}, ${stored.seoTitle},
      ${stored.seoDescription}, ${stored.seoCanonical}, ${stored.seoImage}, ${stored.bodyMarkdown},
      ${stored.bodyHtml}, NOW()
    )
    RETURNING id::int AS id
  `;

  return (await getProductCategoryById(rows[0].id)) as ProductCategoryEntry;
}

export async function updateProductCategory(id: number, input: ProductCategoryInput): Promise<ProductCategoryEntry | undefined> {
  const instance = await getDatabase();
  const previous = await getProductCategoryById(id);
  if (!previous) return undefined;

  const stored = await toStoredCategory(input);
  const updated = await instance.begin(async (tx) => {
    const rows = await tx<{ id: number }[]>`
      UPDATE product_categories
      SET
        slug = ${stored.slug},
        title = ${stored.title},
        excerpt = ${stored.excerpt},
        description = ${stored.description},
        featured = ${stored.featured},
        status = ${stored.status},
        sort_order = ${stored.sortOrder},
        cover_image = ${stored.coverImage},
        cover_alt = ${stored.coverAlt},
        seo_title = ${stored.seoTitle},
        seo_description = ${stored.seoDescription},
        seo_canonical = ${stored.seoCanonical},
        seo_image = ${stored.seoImage},
        body_markdown = ${stored.bodyMarkdown},
        body_html = ${stored.bodyHtml},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING id::int AS id
    `;

    if (rows.length === 0) return false;

    if (previous.slug !== stored.slug) {
      await tx`
        UPDATE products
        SET category = ${stored.slug}, updated_at = NOW()
        WHERE category = ${previous.slug}
      `;
    }

    return true;
  });

  if (!updated) return undefined;
  return getProductCategoryById(id);
}

export async function deleteProductCategory(id: number): Promise<{ ok: boolean; reason?: string }> {
  const instance = await getDatabase();
  const category = await getProductCategoryById(id);
  if (!category) return { ok: false, reason: "Categoria no encontrada." };

  const countRows = await instance<{ count: number }[]>`SELECT COUNT(*)::int AS count FROM products WHERE category = ${category.slug}`;
  if ((countRows[0]?.count ?? 0) > 0) {
    return { ok: false, reason: "No puedes eliminar una categoria que todavia tiene productos asociados." };
  }

  await instance`DELETE FROM product_categories WHERE id = ${id}`;
  return { ok: true };
}
