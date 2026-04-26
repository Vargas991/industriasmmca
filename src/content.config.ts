import { defineCollection, z } from "astro:content";

const seoSchema = z.object({
	title: z.string(),
	description: z.string(),
	canonical: z.string().optional(),
	image: z.string().optional(),
});

const productCategories = defineCollection({
	type: "content",
	schema: z.object({
		title: z.string(),
		excerpt: z.string(),
		description: z.string(),
		featured: z.boolean().default(false),
		status: z.enum(["draft", "published"]).default("published"),
		order: z.number().default(0),
		coverImage: z.string(),
		coverAlt: z.string(),
		seo: seoSchema,
	}),
});

const products = defineCollection({
	type: "content",
	schema: z.object({
		title: z.string(),
		category: z.string(),
		excerpt: z.string(),
		description: z.string(),
		featured: z.boolean().default(false),
		status: z.enum(["draft", "published"]).default("published"),
		coverImage: z.string(),
		coverAlt: z.string(),
		gallery: z.array(z.string()).default([]),
		specSheet: z.string().optional(),
		benefits: z.array(z.string()).default([]),
		specs: z
			.array(
				z.object({
					label: z.string(),
					value: z.string(),
				}),
			)
			.default([]),
		measurements: z
			.array(
				z.object({
					name: z.string(),
					width: z.string().optional(),
					height: z.string().optional(),
					depth: z.string().optional(),
					length: z.string().optional(),
					capacity: z.string().optional(),
					unit: z.string().optional(),
					order: z.number().default(0),
				}),
			)
			.default([]),
		seo: seoSchema,
	}),
});

const services = defineCollection({
	type: "content",
	schema: z.object({
		title: z.string(),
		excerpt: z.string(),
		description: z.string(),
		featured: z.boolean().default(false),
		status: z.enum(["draft", "published"]).default("published"),
		coverImage: z.string(),
		coverAlt: z.string(),
		gallery: z.array(z.string()).default([]),
		benefits: z.array(z.string()).default([]),
		process: z.array(z.string()).default([]),
		seo: seoSchema,
	}),
});

const projects = defineCollection({
	type: "content",
	schema: z.object({
		title: z.string(),
		client: z.string(),
		sector: z.string(),
		location: z.string(),
		excerpt: z.string(),
		description: z.string(),
		year: z.string(),
		status: z.enum(["draft", "published"]).default("published"),
		featured: z.boolean().default(false),
		coverImage: z.string(),
		coverAlt: z.string(),
		gallery: z.array(z.string()).default([]),
		seo: seoSchema,
	}),
});

const pages = defineCollection({
	type: "content",
	schema: z.object({
		title: z.string(),
		excerpt: z.string(),
		seo: seoSchema,
	}),
});

const blog = defineCollection({
	type: "content",
	schema: z.object({
		title: z.string(),
		excerpt: z.string(),
		publishedAt: z.string(),
		seo: seoSchema,
	}),
});

export const collections = { "product-categories": productCategories, products, services, projects, pages, blog };
