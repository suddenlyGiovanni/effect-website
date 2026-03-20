import { useAtomSet, useAtomValue } from "@effect/atom-react"
import * as Atom from "effect/unstable/reactivity/Atom"
import * as React from "react"
import type { PodcastTranscriptCue } from "../domain"

export interface PodcastTranscriptContext {
  readonly activeTranscriptCueAtom: Atom.Atom<PodcastTranscriptCue | undefined>
  readonly setActiveTranscriptCueAtom: Atom.AtomResultFn<PodcastTranscriptCue, void, never>
  readonly shouldAutoFollowTranscriptAtom: Atom.Atom<boolean>
  readonly pauseTranscriptAutoFollowAtom: Atom.AtomResultFn<void, void, never>
  readonly resumeTranscriptAutoFollowAtom: Atom.AtomResultFn<void, void, never>
}

export const PodcastTranscriptContext = React.createContext<PodcastTranscriptContext>(null as any)

export const useTranscriptContext = () => React.useContext(PodcastTranscriptContext)

export const useActiveTranscriptCue = () =>
  useAtomValue(useTranscriptContext().activeTranscriptCueAtom)

export const useSeekToCue = () => useAtomSet(useTranscriptContext().setActiveTranscriptCueAtom)

export const useShouldAutoFollowTranscript = () =>
  useAtomValue(useTranscriptContext().shouldAutoFollowTranscriptAtom)

export const usePauseAutoScroll = () =>
  useAtomSet(useTranscriptContext().pauseTranscriptAutoFollowAtom)

export const useResumeAutoScroll = () =>
  useAtomSet(useTranscriptContext().resumeTranscriptAutoFollowAtom)
