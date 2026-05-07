import type { Sql, TransactionSql } from "postgres";

type MigrationSql = Sql | TransactionSql;

interface Migration {
  id: string;
  run: (instance: MigrationSql) => Promise<void>;
}

const migrations: Migration[] = [
  {
    id: "001_create_product_catalog",
    run: async (instance) => {
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

      await instance`
        CREATE TABLE IF NOT EXISTS products (
          id BIGSERIAL PRIMARY KEY,
          slug TEXT NOT NULL UNIQUE,
          title TEXT NOT NULL,
          category TEXT NOT NULL,
          excerpt TEXT NOT NULL,
          description TEXT NOT NULL,
          featured BOOLEAN NOT NULL DEFAULT FALSE,
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
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await instance`
        CREATE TABLE IF NOT EXISTS product_measurements (
          id BIGSERIAL PRIMARY KEY,
          product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          width TEXT,
          height TEXT,
          depth TEXT,
          length TEXT,
          capacity TEXT,
          unit TEXT,
          sort_order INTEGER NOT NULL DEFAULT 0
        )
      `;

    },
  },
  {
    id: "002_add_product_price",
    run: async (instance) => {
      await instance`
        ALTER TABLE products
        ADD COLUMN IF NOT EXISTS price DECIMAL(12,2),
        ADD COLUMN IF NOT EXISTS show_price BOOLEAN NOT NULL DEFAULT FALSE
      `;
    },
  },
];

export async function runMigrations(instance: Sql) {
  await instance`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await instance.begin(async (tx) => {
    for (const migration of migrations) {
      const rows = await tx<{ id: string }[]>`
        SELECT id FROM schema_migrations WHERE id = ${migration.id}
      `;

      if (rows.length > 0) continue;

      await migration.run(tx);
      await tx`INSERT INTO schema_migrations (id) VALUES (${migration.id})`;
    }
  });
}
