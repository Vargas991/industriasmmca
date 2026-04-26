import {
  getProductBySlugFromDb,
  listProducts,
} from "@/lib/db/products";

export async function getAllProducts() {
  return listProducts({ includeDrafts: true });
}

export async function getPublishedProducts() {
  return listProducts();
}

export async function getFeaturedProducts() {
  return listProducts({ featuredOnly: true });
}

export async function getProductBySlug(slug: string) {
  return getProductBySlugFromDb(slug);
}

export async function getProductsByCategory(category: string) {
  return listProducts({ category });
}

export async function getRelatedProducts(slug: string, category: string) {
  const products = await getProductsByCategory(category);
  return products.filter((item) => item.slug !== slug).slice(0, 3);
}
