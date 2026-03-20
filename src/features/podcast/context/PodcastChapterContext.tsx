import { useAtomSet, useAtomValue } from "@effect/atom-react"
import * as Atom from "effect/unstable/reactivity/Atom"
import * as React from "react"
import type { PodcastChapter } from "../domain"

export interface PodcastChapterContext {
  readonly chapters: ReadonlyArray<PodcastChapter>
  readonly activeChapterAtom: Atom.Atom<PodcastChapter | undefined>
  readonly setActiveChapterAtom: Atom.AtomResultFn<PodcastChapter, void, never>
}

export const PodcastChapterContext = React.createContext<PodcastChapterContext>(null as any)

export const useChapterContext = () => React.useContext(PodcastChapterContext)

export const useChapters = () => useChapterContext().chapters

export const useActiveChapter = () => useAtomValue(useChapterContext().activeChapterAtom)

export const useSetActiveChapter = () => useAtomSet(useChapterContext().setActiveChapterAtom)
