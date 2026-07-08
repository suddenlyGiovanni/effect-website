import type { DeepMutable } from "effect/Types"
import { NodePath } from "@effect/platform-node"
import Mixedbread from "@mixedbread/sdk"
import { getSecret } from "astro:env/server"
import * as Config from "effect/Config"
import * as ConfigProvider from "effect/ConfigProvider"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Path from "effect/Path"
import * as Redacted from "effect/Redacted"
import * as Schema from "effect/Schema"
import type { Metadata, SearchResult } from "./domain"
import { SearchError, StoreSearchResponse } from "./domain"

export class Search extends Context.Service<Search>()("app/Search", {
  make: Effect.gen(function* () {
    const apiKey = yield* Config.redacted("MXBAI_API_KEY")
    const storeId = yield* Config.redacted("MXBAI_VECTOR_STORE_ID")

    const path = yield* Path.Path
    const mxbai = new Mixedbread({ apiKey: Redacted.value(apiKey) })

    const decodeSearchResponse = Schema.decodeUnknownEffect(StoreSearchResponse)

    function extractSnippet(text: string, maxLength: number = 150): string {
      let cleaned = text
        .replace(/^import\s+.*$/gm, "")
        .replace(/<[A-Z][^>]*\/>/g, "")
        .replace(/<[A-Z][^>]*>[\s\S]*?<\/[A-Z][^>]*>/g, "")
        .replace(/<[^>]*>/g, "")
        .replace(/^\|.*\|$/gm, "")
        .replace(/^\|?[-:\s|]+\|?$/gm, "")
        .replace(/^#{1,6}\s+.*$/gm, "")
        .replace(/```[\s\S]*?```/g, "")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/[*_]/g, "")
        .replace(/^---\n[\s\S]*?\n---\n?/m, "")
        .replace(/---\n[\s\S]*?\n---/g, "")
        .replace(/^\w+:\s*.*$/gm, "")
        .replace(/\n+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
      if (cleaned.length <= maxLength) {
        return cleaned
      }
      return cleaned.substring(0, maxLength).trim() + "..."
    }

    function generateAnchorId(text: string) {
      return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
    }

    const CONTENT_PATH = "src/content/docs"
    function generateHref(metadata: typeof Metadata.Type): string | undefined {
      const index = metadata.file_path.indexOf(CONTENT_PATH)
      if (index === -1) {
        return undefined
      }
      const subpath = metadata.file_path.substring(index + CONTENT_PATH.length)
      const parsed = path.parse(subpath)
      return path.join(parsed.dir, parsed.name, "/")
    }

    function groupSearchResults(response: StoreSearchResponse): ReadonlyArray<SearchResult> {
      const grouped = new Map<string, DeepMutable<SearchResult>>()

      response.data.forEach((chunk) => {
        const title = chunk.generated_metadata.title
        const description = chunk.generated_metadata.description ?? ""
        const chunkHeadings = chunk.generated_metadata.chunk_headings
        const headingContext = chunk.generated_metadata.heading_context

        const href = generateHref(chunk.metadata)

        if (href === undefined) {
          return
        }

        if (!grouped.has(href)) {
          grouped.set(href, {
            id: chunk.file_id,
            description,
            title,
            href,
            chunks: [],
          })
        }

        const page = grouped.get(href)!

        let chunkTitle = title
        if (chunkHeadings.length > 0) {
          chunkTitle = chunkHeadings[0]?.text ?? ""
        } else if (headingContext.length > 0) {
          chunkTitle = headingContext[headingContext.length - 1]?.text ?? ""
        }

        const snippet = extractSnippet(chunk.text)

        page.chunks.push({
          id: `${chunk.file_id}-${chunk.chunk_index}`,
          title: chunkTitle,
          snippet,
          score: chunk.score,
          anchorId: generateAnchorId(chunkTitle),
        })
      })

      return Array.from(grouped.values())
    }

    const search = Effect.fn("Search.search")(function* (query: string) {
      const searchParams: Mixedbread.Stores.StoreSearchParams = {
        query,
        top_k: 10,
        search_options: { rerank: true, return_metadata: true },
        store_identifiers: [Redacted.value(storeId)],
      }

      const rawResponse = yield* Effect.tryPromise({
        try: (signal) => mxbai.stores.search(searchParams, { signal }),
        catch: (cause) => new SearchError({ cause }),
      })

      const decoded = yield* decodeSearchResponse(rawResponse).pipe(
        Effect.catchTag("SchemaError", (cause) => new SearchError({ cause })),
      )

      return groupSearchResults(decoded)
    })

    return {
      search,
    } as const
  }),
}) {
  static layer = Layer.effect(this, this.make).pipe(
    Layer.provide(NodePath.layer),
    Layer.provide(
      ConfigProvider.layer(
        ConfigProvider.fromUnknown({
          MXBAI_API_KEY: getSecret("MXBAI_API_KEY"),
          MXBAI_VECTOR_STORE_ID: getSecret("MXBAI_VECTOR_STORE_ID"),
        }),
      ),
    ),
  )
}
