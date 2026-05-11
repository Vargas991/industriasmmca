import type { APIRoute } from "astro";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { getCloudinaryFolders, getCloudinaryResources, isCloudinaryConfigured } from "@/lib/cloudinary";

export const GET: APIRoute = async ({ request, cookies }) => {
  if (!isAdminAuthenticated(cookies)) {
    return new Response(JSON.stringify({ message: "No autorizado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!isCloudinaryConfigured()) {
    return new Response(JSON.stringify({ message: "Cloudinary no está configurado" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const folderParam = new URL(request.url).searchParams.get("folder") || "industriasmm";

  try {
    const [resources, folderResult] = await Promise.all([
      getCloudinaryResources({
        resource_type: "image",
        folder: folderParam,
        max_results: 500,
      }),
      getCloudinaryFolders({ folder: folderParam }),
    ]);

    const folders = (folderResult.folders || []).map((folder: any) => ({
      name: folder.name,
      path: folder.path,
      created_at: folder.created_at,
    }));

    const images = (resources.resources || []).map((resource: any) => ({
      public_id: resource.public_id,
      secure_url: resource.secure_url,
      width: resource.width,
      height: resource.height,
      format: resource.format,
      bytes: resource.bytes,
      created_at: resource.created_at,
    }));

    return new Response(JSON.stringify({ folder: folderParam, folders, images }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error obteniendo imágenes de Cloudinary:", error);
    return new Response(JSON.stringify({ message: "Error interno del servidor" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};