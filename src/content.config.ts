import { docsLoader } from "@astrojs/starlight/loaders"
import { docsSchema } from "@astrojs/starlight/schema"
import { file, glob } from "astro/loaders"
import { defineCollection, z } from "astro:content"
import { PodcastEpisodeEntry } from "./features/podcast/collection"

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
  podcasts,
  merch,
}
