import type { APIRoute } from "astro";
import { ZodError } from "zod";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { parseAdminCategoryPayload } from "@/lib/admin/categories";
import { createProductCategory, listProductCategories } from "@/lib/db/categories";

export const prerender = false;

function unauthorized() {
  return new Response(JSON.stringify({ ok: false, message: "No autorizado." }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

export const GET: APIRoute = async ({ cookies }) => {
  if (!isAdminAuthenticated(cookies)) return unauthorized();

  const categories = await listProductCategories({ includeDrafts: true });
  return new Response(JSON.stringify({ ok: true, categories }), {
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!isAdminAuthenticated(cookies)) return unauthorized();

  try {
    const payload = parseAdminCategoryPayload(await request.json());
    const category = await createProductCategory(payload);
    return new Response(JSON.stringify({ ok: true, category }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof ZodError ? error.issues[0]?.message ?? "Payload inválido." : "No fue posible crear la categoría.";
    return new Response(JSON.stringify({ ok: false, message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
};
