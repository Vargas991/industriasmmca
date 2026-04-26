import type { APIRoute } from "astro";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { isCloudinaryConfigured, uploadBufferToCloudinary } from "@/lib/cloudinary";

export const prerender = false;

function unauthorized() {
  return new Response(JSON.stringify({ ok: false, message: "No autorizado." }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!isAdminAuthenticated(cookies)) return unauthorized();

  if (!isCloudinaryConfigured()) {
    return new Response(JSON.stringify({ ok: false, message: "Cloudinary no está configurado en el servidor." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return new Response(JSON.stringify({ ok: false, message: "Debes enviar un archivo." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const kind = String(formData.get("kind") ?? "auto");
  const resourceType = kind === "image" || kind === "raw" ? kind : "auto";
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const uploaded = await uploadBufferToCloudinary(buffer, file.name, resourceType);
    return new Response(JSON.stringify({ ok: true, url: uploaded.secure_url, publicId: uploaded.public_id }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No fue posible subir el archivo a Cloudinary.";
    return new Response(JSON.stringify({ ok: false, message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
