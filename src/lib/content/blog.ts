import { getCollection } from "astro:content";

export async function getPublishedPosts() {
  return getCollection("blog");
}

export async function getPostBySlug(slug: string) {
  const posts = await getCollection("blog");
  return posts.find((item) => item.slug === slug);
}
