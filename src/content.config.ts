import { docsLoader } from "@astrojs/starlight/loaders"
import { docsSchema } from "@astrojs/starlight/schema"
import { file, glob } from "astro/loaders"
import { z } from "astro/zod"
import { defineCollection, reference } from "astro:content"
import { PodcastEpisodeEntry } from "./features/podcast/collection"

const blog = defineCollection({
  loader: glob({
    base: "./src/content/blog",
    pattern: [
      "cause-and-effect/*.mdx",
      "this-week-in-effect/*/index.mdx",
      "releases/effect/*.mdx",
      "releases/*.mdx",
      "*.mdx",
    ],
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(1),
      excerpt: z.string().min(1),
      date: z.date(),
      readingTime: z.string().min(1).optional(),
      tags: z.array(reference("blogTags")),
      authors: z.array(reference("blogAuthors")).min(1),
      featured: z.boolean().optional().default(false),
      featuredImage: image().optional(),
    }),
})

const blogAuthors = defineCollection({
  loader: file("./src/content/blog/authors.json"),
  schema: z.object({
    name: z.string().min(1),
    title: z.string().min(1),
    url: z.string().url(),
  }),
})

const blogTags = defineCollection({
  loader: file("./src/content/blog/tags.json"),
  schema: z.object({
    name: z.string().min(1),
    color: z.string().min(1),
  }),
})

const podcasts = defineCollection({
  loader: glob({ base: "./src/content/podcasts", pattern: "**/*.{md,mdx}" }),
  schema: PodcastEpisodeEntry,
})

const merch = defineCollection({
  loader: file("./src/content/merch.json"),
  schema: z.object({
    name: z.string(),
    price: z.string(),
    images: z.array(z.string()),
    buyUrl: z.string().url(),
    infoUrl: z.string().url(),
  }),
})

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
  blog,
  blogAuthors,
  blogTags,
  podcasts,
  merch,
}
