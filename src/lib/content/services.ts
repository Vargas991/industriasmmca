import { getCollection } from "astro:content";
import { isPublished } from "@/lib/utils/guards";

export async function getPublishedServices() {
  const services = await getCollection("services");
  return services.filter((item) => isPublished(item.data.status));
}

export async function getFeaturedServices() {
  const services = await getPublishedServices();
  return services.filter((item) => item.data.featured);
}

export async function getServiceBySlug(slug: string) {
  const services = await getPublishedServices();
  return services.find((item) => item.slug === slug);
}

export async function getRelatedServices(slug: string) {
  const services = await getPublishedServices();
  return services.filter((item) => item.slug !== slug).slice(0, 3);
}
