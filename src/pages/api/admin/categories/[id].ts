import type { APIRoute } from "astro";
import { ZodError } from "zod";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { parseAdminCategoryPayload } from "@/lib/admin/categories";
import {
  deleteProductCategory,
  getProductCategoryById,
  updateProductCategory,
} from "@/lib/db/categories";

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

  const category = await getProductCategoryById(id);
  if (!category) {
    return new Response(JSON.stringify({ ok: false, message: "Categoría no encontrada." }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, category }), {
    headers: { "Content-Type": "application/json" },
  });
};

export const PUT: APIRoute = async ({ params, request, cookies }) => {
  if (!isAdminAuthenticated(cookies)) return unauthorized();

  const id = getNumericId(params.id);
  if (!id) return invalidId();

  try {
    const payload = parseAdminCategoryPayload(await request.json());
    const category = await updateProductCategory(id, payload);

    if (!category) {
      return new Response(JSON.stringify({ ok: false, message: "Categoría no encontrada." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, category }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof ZodError ? error.issues[0]?.message ?? "Payload inválido." : "No fue posible actualizar la categoría.";
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

  const result = await deleteProductCategory(id);
  if (!result.ok) {
    return new Response(JSON.stringify({ ok: false, message: result.reason ?? "No fue posible eliminar la categoría." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
