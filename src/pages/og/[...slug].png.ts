import type { APIRoute } from "astro"
import * as NodeServices from "@effect/platform-node/NodeServices"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as ManagedRuntime from "effect/ManagedRuntime"
import { getCollection } from "astro:content"
import { OpenGraph, type OgTemplateProps } from "@/services/OpenGraph"
import { slugifyPodcast } from "@/features/podcast/utils"

const OpenGraphLayer = OpenGraph.layer.pipe(
  Layer.provide(NodeServices.layer),
)

const runtime = ManagedRuntime.make(OpenGraphLayer)

async function findDoc(slug: string): Promise<OgTemplateProps | null> {
  const entryId = slug.slice("docs/".length)
  const entries = await getCollection("docs")
  const entry = entries.find(
    (e) =>
      e.id === entryId ||
      e.id === `${entryId}.mdx` ||
      e.id === `${entryId}/index.mdx`,
  )
  if (entry === undefined) {
    return null
  }
  return {
    title: entry.data.title,
    description: entry.data.description,
  }
}

async function findPodcast(slug: string): Promise<OgTemplateProps | null> {
  const episodeSlug = slug.slice("podcast/episodes/".length)
  const entries = await getCollection("podcasts")
  const entry = entries.find(
    (e) => slugifyPodcast(e.data) === episodeSlug,
  )
  if (entry === undefined) {
    return null
  }
  return {
    title: entry.data.title,
    description: entry.data.description,
    subtitle: `Episode ${String(entry.data.episodeNumber).padStart(2, "0")} — with ${entry.data.guest}`,
  }
}

const pngResponse = (png: Uint8Array): Response =>
  new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })

const handler = Effect.fnUntraced(function* ({
  params: { slug },
}: {
  params: { slug: string }
}) {
  const opengraph = yield* OpenGraph

  if (!slug.includes("/") && !slug.includes("..")) {
    const staticPng = yield* opengraph.forStatic(slug)
    if (staticPng !== null) {
      return pngResponse(staticPng)
    }
  }

  if (slug.startsWith("docs/")) {
    const doc = yield* Effect.promise(() => findDoc(slug))
    if (doc !== null) {
      const png = yield* opengraph.forDocs(doc)
      return pngResponse(png)
    }
  }

  if (slug.startsWith("podcast/episodes/")) {
    const ep = yield* Effect.promise(() => findPodcast(slug))
    if (ep !== null) {
      const png = yield* opengraph.forPodcast(ep)
      return pngResponse(png)
    }
  }

  return new Response("Not Found", { status: 404 })
})

export const GET: APIRoute = (ctx) => runtime.runPromise(handler(ctx))
