import type { ThemedToken } from "shiki/types"
import { createHighlighter, type Highlighter } from "shiki"
import type { SnippetLanguage } from "@/features/visual-effect/model/snippet-highlights"
import { effectShikiTheme } from "./shiki-theme"

let highlighterPromise: Promise<Highlighter> | undefined = undefined

const tokensBySnippetKey = new Map<string, Promise<ReadonlyArray<ReadonlyArray<ThemedToken>>>>()

export const getHighlighter = (): Promise<Highlighter> => {
  if (highlighterPromise !== undefined) {
    return highlighterPromise
  }

  highlighterPromise = createHighlighter({
    themes: [effectShikiTheme],
    langs: ["typescript", "javascript"],
  })

  return highlighterPromise
}

export const getSnippetTokens = (
  language: SnippetLanguage,
  source: string,
): Promise<ReadonlyArray<ReadonlyArray<ThemedToken>>> => {
  const key = `${language}::${source}`
  const cached = tokensBySnippetKey.get(key)
  if (cached !== undefined) {
    return cached
  }

  const tokenPromise = getHighlighter()
    .then((highlighter) =>
      highlighter.codeToTokensBase(source, { lang: language, theme: effectShikiTheme }),
    )
    .catch((error) => {
      tokensBySnippetKey.delete(key)
      throw error
    })

  tokensBySnippetKey.set(key, tokenPromise)
  return tokenPromise
}
