import { getCollection, type CollectionEntry } from "astro:content";
import { isPublished } from "@/lib/utils/guards";
import { getPublishedProducts } from "@/lib/content/products";

export async function getPublishedProductCategories() {
  const categories = await getCollection("product-categories");
  return categories
    .filter((item) => isPublished(item.data.status))
    .sort((left, right) => left.data.order - right.data.order || left.data.title.localeCompare(right.data.title));
}

export async function getFeaturedProductCategories() {
  const categories = await getPublishedProductCategories();
  return categories.filter((item) => item.data.featured);
}

export async function getProductCategoryBySlug(slug: string) {
  const categories = await getPublishedProductCategories();
  return categories.find((item) => item.slug === slug);
}

export async function getProductCategoryMap() {
  const categories = await getPublishedProductCategories();
  return Object.fromEntries(categories.map((category) => [category.slug, category]));
}

export interface ProductCategorySection {
  category: CollectionEntry<"product-categories">;
  products: CollectionEntry<"products">[];
}

export async function getProductCategorySections(): Promise<ProductCategorySection[]> {
  const [categories, products] = await Promise.all([
    getPublishedProductCategories(),
    getPublishedProducts(),
  ]);

  return categories.map((category) => ({
    category,
    products: products.filter((product) => product.data.category === category.slug),
  }));
}
