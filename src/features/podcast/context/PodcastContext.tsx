import { useAtomSet, useAtomValue } from "@effect/atom-react"
import * as Atom from "effect/unstable/reactivity/Atom"
import * as React from "react"
import { PodcastEpisodeEntry } from "../collection"
import {
  PodcastEpisode,
  type PodcastChapter,
  type PodcastTranscriptCue,
  type SrtCue,
} from "../domain"

export interface PodcastContext {
  readonly episode: PodcastEpisode
  readonly chapters: ReadonlyArray<PodcastChapter>
  readonly activeChapterAtom: Atom.Atom<PodcastChapter | undefined>
  readonly setActiveChapterAtom: Atom.AtomResultFn<PodcastChapter, void, never>
  readonly activeTranscriptCueAtom: Atom.Atom<PodcastTranscriptCue | undefined>
  readonly setActiveTranscriptCueAtom: Atom.AtomResultFn<PodcastTranscriptCue, void, never>
  readonly shouldAutoFollowTranscriptAtom: Atom.Atom<boolean>
  readonly pauseTranscriptAutoFollowAtom: Atom.AtomResultFn<void, void, never>
  readonly resumeTranscriptAutoFollowAtom: Atom.AtomResultFn<void, void, never>
  readonly isPreviewing: boolean
  readonly activateEmbed: () => void
}

export const PodcastContext = React.createContext<PodcastContext>(null as any)

export const usePodcastContext = () => React.useContext(PodcastContext)

export const usePodcastEpisode = () => usePodcastContext().episode

export const useChapters = () => usePodcastContext().chapters

export const useActiveChapter = () => useAtomValue(usePodcastContext().activeChapterAtom)

export const useSetActiveChapter = () => useAtomSet(usePodcastContext().setActiveChapterAtom)

export const useActiveTranscriptCue = () =>
  useAtomValue(usePodcastContext().activeTranscriptCueAtom)

export const useSeekToCue = () => useAtomSet(usePodcastContext().setActiveTranscriptCueAtom)

export const useShouldAutoFollowTranscript = () =>
  useAtomValue(usePodcastContext().shouldAutoFollowTranscriptAtom)

export const usePauseAutoScroll = () =>
  useAtomSet(usePodcastContext().pauseTranscriptAutoFollowAtom)

export const useResumeAutoScroll = () =>
  useAtomSet(usePodcastContext().resumeTranscriptAutoFollowAtom)

export const usePodcastVideoEmbed = () => {
  const context = usePodcastContext()
  return {
    activateEmbed: context.activateEmbed,
    isPreviewing: context.isPreviewing,
  } as const
}

export interface PodcastEpisodeProps {
  readonly podcast: PodcastEpisodeEntry
  readonly transcript: ReadonlyArray<SrtCue>
}
