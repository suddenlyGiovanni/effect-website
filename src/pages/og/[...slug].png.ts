import type { APIContext, APIRoute, GetStaticPaths } from "astro"
import * as NodeServices from "@effect/platform-node/NodeServices"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as ManagedRuntime from "effect/ManagedRuntime"
import { OpenGraph } from "@/services/OpenGraph"

interface OgPageDefinition {
  readonly slug: string
  readonly title: string
  readonly description?: string
  readonly subtitle?: string
}

const staticPages: ReadonlyArray<OgPageDefinition> = [
  {
    slug: "index",
    title: "Effect - Build production-grade software in TypeScript",
    description:
      "The TypeScript library for building production-grade software. One package, everything you need.",
  },
  {
    slug: "podcast",
    title: "Cause & Effect Podcast",
    description:
      "A podcast exploring how engineers are using Effect to build reliable, production-grade software in TypeScript",
  },
  // {
  // 	slug: "brand-assets",
  // 	title: "Logo Guidelines - Effect",
  // 	description: "Official Effect brand assets and logo usage guidelines",
  // },
  // {
  // 	slug: "merch",
  // 	title: "Merch - Effect",
  // 	description: "Effect-branded merchandise for the community",
  // },
  // {
  // 	slug: "events",
  // 	title: "Events - Effect",
  // 	description: "Effect community events and conferences",
  // },
  // {
  // 	slug: "events/effect-days",
  // 	title: "Effect Days - Conference for TypeScript Engineers",
  // 	description: "The conference for TypeScript engineers building with Effect",
  // },
  // {
  // 	slug: "events/code-of-conduct",
  // 	title: "Code of Conduct - Effect Days",
  // 	description: "Effect Days code of conduct",
  // },
  // {
  // 	slug: "llms",
  // 	title: "Effect for LLMs",
  // 	description: "The missing standard library for TypeScript applications",
  // },
  // // Podcast episodes
  // ...EPISODES.map((episode) => ({
  // 	slug: `podcast/episodes/episode-${episode.number}`,
  // 	title: episode.title,
  // 	description: episode.description,
  // 	subtitle: `Cause & Effect — with ${episode.guest} (${episode.company})`,
  // })),
]

const OpenGraphLayer = OpenGraph.layer.pipe(Layer.provide(NodeServices.layer))

const runtime = ManagedRuntime.make(OpenGraphLayer)

const handler = Effect.fnUntraced(function* ({
  params: { slug },
  props,
}: APIContext<OgPageDefinition, Pick<OgPageDefinition, "slug">>) {
  const opengraph = yield* OpenGraph

  const png = slug === "index" ? yield* opengraph.forHomepage : yield* opengraph.forContent(props)

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
})

export const prerender = true

export const getStaticPaths: GetStaticPaths = async () => {
  // TODO content collection pages
  const pages = [...staticPages]

  return pages.map((page) => {
    const { slug, ...props } = page
    return {
      params: { slug },
      props,
    }
  })
}

export const GET: APIRoute<OgPageDefinition, Pick<OgPageDefinition, "slug">> = (ctx) =>
  runtime.runPromise(handler(ctx))
