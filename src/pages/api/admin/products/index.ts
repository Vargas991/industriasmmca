import type { APIRoute } from "astro";
import { ZodError } from "zod";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { parseAdminProductPayload } from "@/lib/admin/products";
import { createProduct, listProducts } from "@/lib/db/products";

export const prerender = false;

function unauthorized() {
  return new Response(JSON.stringify({ ok: false, message: "No autorizado." }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

export const GET: APIRoute = async ({ cookies }) => {
  if (!isAdminAuthenticated(cookies)) return unauthorized();

  const products = await listProducts({ includeDrafts: true });
  return new Response(JSON.stringify({ ok: true, products }), {
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!isAdminAuthenticated(cookies)) return unauthorized();

  try {
    const payload = parseAdminProductPayload(await request.json());
    const product = await createProduct(payload);
    return new Response(JSON.stringify({ ok: true, product }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof ZodError ? error.issues[0]?.message ?? "Payload inválido." : "No fue posible crear el producto.";
    return new Response(JSON.stringify({ ok: false, message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
};
