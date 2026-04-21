import { getCollection } from "astro:content";
import { isPublished } from "@/lib/utils/guards";

export async function getAllProducts() {
  return getCollection("products");
}

export async function getPublishedProducts() {
  const products = await getCollection("products");
  return products.filter((item) => isPublished(item.data.status));
}

export async function getFeaturedProducts() {
  const products = await getPublishedProducts();
  return products.filter((item) => item.data.featured);
}

export async function getProductBySlug(slug: string) {
  const products = await getPublishedProducts();
  return products.find((item) => item.slug === slug);
}

export async function getProductsByCategory(category: string) {
  const products = await getPublishedProducts();
  return products.filter((item) => item.data.category === category);
}

export async function getRelatedProducts(slug: string, category: string) {
  const products = await getProductsByCategory(category);
  return products.filter((item) => item.slug !== slug).slice(0, 3);
}
