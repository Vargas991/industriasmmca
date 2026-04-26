import type { MiddlewareHandler } from "astro";
import { getDb } from "@/lib/db/core";

let initialized = false;
let initializationPromise: Promise<void> | undefined;

async function ensureDatabaseReady() {
  if (initialized) return;

  if (!initializationPromise) {
    initializationPromise = (async () => {
      await getDb();
      initialized = true;
    })();
  }

  await initializationPromise;
}

export const onRequest: MiddlewareHandler = async (_context, next) => {
  await ensureDatabaseReady();
  return next();
};
