import type { APIRoute } from "astro";
import { ZodError } from "zod";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { parseAdminProductPayload } from "@/lib/admin/products";
import { deleteProduct, getProductById, updateProduct } from "@/lib/db/products";

export const prerender = false;

function unauthorized() {
  return new Response(JSON.stringify({ ok: false, message: "No autorizado." }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

function invalidId() {
  return new Response(JSON.stringify({ ok: false, message: "ID inválido." }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
}

function getNumericId(value?: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export const GET: APIRoute = async ({ params, cookies }) => {
  if (!isAdminAuthenticated(cookies)) return unauthorized();

  const id = getNumericId(params.id);
  if (!id) return invalidId();

  const product = await getProductById(id);
  if (!product) {
    return new Response(JSON.stringify({ ok: false, message: "Producto no encontrado." }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, product }), {
    headers: { "Content-Type": "application/json" },
  });
};

export const PUT: APIRoute = async ({ params, request, cookies }) => {
  if (!isAdminAuthenticated(cookies)) return unauthorized();

  const id = getNumericId(params.id);
  if (!id) return invalidId();

  try {
    const payload = parseAdminProductPayload(await request.json());
    const product = await updateProduct(id, payload);

    if (!product) {
      return new Response(JSON.stringify({ ok: false, message: "Producto no encontrado." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, product }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof ZodError ? error.issues[0]?.message ?? "Payload inválido." : "No fue posible actualizar el producto.";
    return new Response(JSON.stringify({ ok: false, message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const DELETE: APIRoute = async ({ params, cookies }) => {
  if (!isAdminAuthenticated(cookies)) return unauthorized();

  const id = getNumericId(params.id);
  if (!id) return invalidId();

  const removed = await deleteProduct(id);
  if (!removed) {
    return new Response(JSON.stringify({ ok: false, message: "Producto no encontrado." }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
