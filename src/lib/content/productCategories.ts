import {
  getProductCategoryBySlugFromDb,
  listProductCategories,
} from "@/lib/db/categories";
import { getPublishedProducts } from "@/lib/content/products";
import type { ProductCategoryEntry } from "@/types/productCategory";
import type { ProductEntry } from "@/types/product";

export async function getAllProductCategories() {
  return listProductCategories({ includeDrafts: true });
}

export async function getPublishedProductCategories() {
  return listProductCategories();
}

export async function getFeaturedProductCategories() {
  return listProductCategories({ featuredOnly: true });
}

export async function getProductCategoryBySlug(slug: string) {
  return getProductCategoryBySlugFromDb(slug);
}

export async function getProductCategoryMap() {
  const categories = await getPublishedProductCategories();
  return Object.fromEntries(categories.map((category) => [category.slug, category]));
}

export interface ProductCategorySection {
  category: ProductCategoryEntry;
  products: ProductEntry[];
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
