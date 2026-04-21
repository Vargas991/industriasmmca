import { getCollection } from "astro:content";
import { isPublished } from "@/lib/utils/guards";

export async function getPublishedProjects() {
  const projects = await getCollection("projects");
  return projects.filter((item) => isPublished(item.data.status));
}

export async function getFeaturedProjects() {
  const projects = await getPublishedProjects();
  return projects.filter((item) => item.data.featured);
}

export async function getProjectBySlug(slug: string) {
  const projects = await getPublishedProjects();
  return projects.find((item) => item.slug === slug);
}
