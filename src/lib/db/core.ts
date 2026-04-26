import postgres, { type Sql } from "postgres";
import { ensureCategoryTables } from "@/lib/db/categories";
import { ensureProductTables } from "@/lib/db/products";

function buildDatabaseUrl() {
  const host = import.meta.env.PGHOST ?? "localhost";
  const port = import.meta.env.PGPORT ?? "5432";
  const user = import.meta.env.PGUSER ?? "postgres";
  const password = import.meta.env.PGPASSWORD ?? "";
  const database = import.meta.env.PGDATABASE ?? "industriasmm";

  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

const databaseUrl = import.meta.env.DATABASE_URL ?? buildDatabaseUrl();

let database: Sql | undefined;
let databasePromise: Promise<Sql> | undefined;

function openDatabase() {
  return postgres(databaseUrl, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 15,
  });
}

async function initializeDatabase(instance: Sql) {
  await ensureCategoryTables(instance);
  await ensureProductTables(instance);
}

export async function getDb() {
  if (database) return database;
  if (!databasePromise) {
    databasePromise = (async () => {
      const instance = openDatabase();
      await initializeDatabase(instance);
      database = instance;
      return instance;
    })();
  }
  return databasePromise;
}
