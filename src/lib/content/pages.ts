import { getCollection } from "astro:content";

export async function getPageBySlug(slug: string) {
  const pages = await getCollection("pages");
  return pages.find((item) => item.slug === slug);
}
