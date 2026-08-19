import type { APIRoute } from "astro";
import { getPublishedProducts } from "@/lib/content/products";

export const GET: APIRoute = async ({ site }) => {
  const products = await getPublishedProducts();

  const baseUrl =
    site?.toString().replace(/\/$/, "") ??
    "https://industriasmmca.com";

  const urls = products
    .map((product) => {
      return `
        <url>
          <loc>${baseUrl}/productos/${product.slug}/</loc>
        </url>
      `;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
};