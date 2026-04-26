interface CloudinaryImageOptions {
  width?: number;
  height?: number;
  quality?: string;
  format?: string;
  fit?: "fill" | "fit" | "limit" | "pad" | "scale" | "crop";
}

function isCloudinaryUrl(src: string) {
  return /https?:\/\/res\.cloudinary\.com\//i.test(src) && src.includes("/upload/");
}

function buildTransformation({
  width,
  height,
  quality = "auto",
  format = "auto",
  fit = "limit",
}: CloudinaryImageOptions) {
  const parts = [`f_${format}`, `q_${quality}`];

  if (width) parts.push(`w_${width}`);
  if (height) parts.push(`h_${height}`);
  if (width || height) parts.push(`c_${fit}`);

  return parts.join(",");
}

export function getOptimizedCloudinaryImage(src: string, options: CloudinaryImageOptions = {}) {
  if (!src || !isCloudinaryUrl(src)) return src;

  const transformation = buildTransformation(options);
  return src.replace("/upload/", `/upload/${transformation}/`);
}

export function getCloudinarySrcSet(src: string, widths: number[], options: Omit<CloudinaryImageOptions, "width"> = {}) {
  if (!src || !isCloudinaryUrl(src) || widths.length === 0) return undefined;

  return widths
    .map((width) => `${getOptimizedCloudinaryImage(src, { ...options, width })} ${width}w`)
    .join(", ");
}
