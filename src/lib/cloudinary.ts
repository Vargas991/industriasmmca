import { v2 as cloudinary } from "cloudinary";

const configured =
  !!import.meta.env.CLOUDINARY_CLOUD_NAME &&
  !!import.meta.env.CLOUDINARY_API_KEY &&
  !!import.meta.env.CLOUDINARY_API_SECRET;

if (configured) {
  cloudinary.config({
    cloud_name: import.meta.env.CLOUDINARY_CLOUD_NAME,
    api_key: import.meta.env.CLOUDINARY_API_KEY,
    api_secret: import.meta.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export function isCloudinaryConfigured() {
  return configured;
}

export async function uploadBufferToCloudinary(
  buffer: Buffer,
  filename: string,
  resourceType: "image" | "raw" | "auto" = "auto",
) {
  if (!configured) {
    throw new Error("Cloudinary no está configurado.");
  }

  return new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        folder: "industriasmm",
        use_filename: true,
        unique_filename: true,
        filename_override: filename,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("No se recibió respuesta de Cloudinary."));
          return;
        }

        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      },
    );

    stream.end(buffer);
  });
}
