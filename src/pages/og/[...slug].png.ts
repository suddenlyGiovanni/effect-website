import type { APIRoute } from "astro"
import * as NodeServices from "@effect/platform-node/NodeServices"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as ManagedRuntime from "effect/ManagedRuntime"
import { getCollection } from "astro:content"
import { OpenGraph, type OgTemplateProps } from "@/services/OpenGraph"

// On-demand server endpoint: slugs derive from arbitrary page pathnames
// (see BaseLayout.getOgImagePath), so the route cannot be enumerated at build
// time. Run it as a Vercel serverless function instead of a static asset.
export const prerender = false

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

  // Static PNGs are served for any slug (including nested paths like
  // "podcast/episodes/<slug>") from src/pages/og/_assets/, either as
  // _assets/<slug>.png or _assets/<slug>/index.png. `forStatic` sanitizes
  // segments and neutralizes ".." traversal.
  if (!slug.includes("..")) {
    const staticPng = yield* opengraph.forStatic(slug)
    if (staticPng !== null) {
      return pngResponse(staticPng)
    }
    // No pre-rendered homepage PNG: synthesize it on the fly.
    if (slug === "index") {
      return pngResponse(yield* opengraph.forHomepage)
    }
  }

  // Docs pages render on the fly via satori (needs _assets/docs/base.png).
  if (slug.startsWith("docs/")) {
    const doc = yield* Effect.promise(() => findDoc(slug))
    if (doc !== null) {
      const png = yield* opengraph.forDocs(doc)
      return pngResponse(png)
    }
  }

  return new Response("Not Found", { status: 404 })
})

export const GET: APIRoute = (ctx) => {
  const slug = ctx.params.slug
  if (slug === undefined) {
    return new Response("Not Found", { status: 404 })
  }
  return runtime.runPromise(handler({ params: { slug } }))
}
