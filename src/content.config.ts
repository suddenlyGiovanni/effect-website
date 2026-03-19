import { docsLoader } from "@astrojs/starlight/loaders"
import { docsSchema } from "@astrojs/starlight/schema"
import { glob } from "astro/loaders"
import { defineCollection } from "astro:content"
import { PodcastEpisodeEntry } from "./features/podcast/collection"

const podcasts = defineCollection({
  loader: glob({ base: "./src/content/podcasts", pattern: "**/*.{md,mdx}" }),
  schema: PodcastEpisodeEntry,
})

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
  podcasts,
}
