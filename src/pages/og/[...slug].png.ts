import { readFile } from "node:fs/promises"
import type { APIRoute } from "astro"
import { getCollection } from "astro:content"
import { loadAssets, renderDocsOg, type OgTemplateProps } from "@/services/OpenGraph"

// On-demand server endpoint: slugs derive from arbitrary page pathnames
// (see BaseLayout.getOgImagePath), so the route cannot be enumerated at build
// time. Run it as a Vercel serverless function instead of a static asset.
export const prerender = false

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
  const cleanEntryId = entryId.replace(/\.mdx?$/, "")
  const parts = cleanEntryId.split("/")
  const category =
    parts.length >= 3 ? parts[1].replace(/-/g, " ").toUpperCase() : undefined
  return {
    title: entry.data.title,
    subtitle: category,
  }
}

const pngResponse = (png: Uint8Array): Response =>
  new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })

async function readStaticPng(slug: string): Promise<Uint8Array | null> {
  if (slug.includes("..")) {
    return null
  }
  const base = "src/pages/og/_assets"
  for (const candidate of [`${base}/${slug}.png`, `${base}/${slug}/index.png`]) {
    try {
      return await readFile(candidate)
    } catch {
      // file not present, try next candidate
    }
  }
  return null
}

export const GET: APIRoute = async (ctx) => {
  const slug = ctx.params.slug
  if (slug === undefined) {
    return new Response("Not Found", { status: 404 })
  }

  // Static PNGs — read from disk, no rendering needed.
  const staticPng = await readStaticPng(slug)
  if (staticPng !== null) {
    return pngResponse(staticPng)
  }

  // Docs pages render on the fly via satori.
  if (slug.startsWith("docs/")) {
    const doc = await findDoc(slug)
    if (doc !== null) {
      const assets = await loadAssets()
      const png = await renderDocsOg(doc, assets)
      return pngResponse(png)
    }
  }

  return new Response("Not Found", { status: 404 })
}
