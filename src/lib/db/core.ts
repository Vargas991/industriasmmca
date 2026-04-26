import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import Database from "better-sqlite3";
import { ensureCategoryTables } from "@/lib/db/categories";
import { ensureProductTables } from "@/lib/db/products";

const dbPath = resolve(process.cwd(), import.meta.env.CONTENT_DB_PATH ?? "data/industriasmm.sqlite");

let database: Database.Database | undefined;
let databasePromise: Promise<Database.Database> | undefined;

function openDatabase() {
  mkdirSync(dirname(dbPath), { recursive: true });
  const instance = new Database(dbPath);
  instance.pragma("journal_mode = WAL");
  instance.pragma("foreign_keys = ON");
  return instance;
}

async function initializeDatabase(instance: Database.Database) {
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
