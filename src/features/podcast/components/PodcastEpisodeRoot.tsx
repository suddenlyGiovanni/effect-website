import { useAtomSuspense } from "@effect/atom-react"
import * as DateTime from "effect/DateTime"
import * as Duration from "effect/Duration"
import * as Effect from "effect/Effect"
import * as Schedule from "effect/Schedule"
import * as Atom from "effect/unstable/reactivity/Atom"
import * as React from "react"
import { PodcastEpisodeEntry } from "../collection"
import { EmbedManagerContext } from "../context/EmbedManagerContext"
import { PodcastContext } from "../context/PodcastContext"
import {
  PodcastChapter,
  PodcastEpisode,
  PodcastEpisodeId,
  type PodcastTranscriptCue,
  type SrtCue,
  type TranscriptFollowMode,
} from "../domain"
import {
  embedManagerAtom,
  type EmbedState,
  type PlaybackState,
} from "../services/PodcastEmbedManager"
import { normalizePodcastChapters, normalizePodcastTranscript } from "../utils"
import { PodcastEpisodeLayout } from "./PodcastEpisodeLayout"

const transcriptAutoFollowResumeDelay = "10 seconds"

export function PodcastEpisodeRoot({
  children,
  podcast,
  transcript,
}: React.PropsWithChildren<{
  readonly podcast: PodcastEpisodeEntry
  readonly transcript: ReadonlyArray<SrtCue>
}>) {
  const reactId = React.useId()

  const podcastEpisodeId = React.useMemo(
    () =>
      PodcastEpisodeId.makeUnsafe(`${podcast.youtubeId}-${reactId.replace(/:/g, "")}`, {
        disableValidation: true,
      }),
    [podcast.youtubeId, reactId],
  )

  const podcastChapters = React.useMemo(
    () => normalizePodcastChapters(podcast.chapters),
    [podcast.chapters],
  )

  const podcastTranscript = React.useMemo(
    () => normalizePodcastTranscript(transcript),
    [transcript],
  )

  const podcastEpisode = PodcastEpisode.makeUnsafe(
    {
      id: podcastEpisodeId,
      number: podcast.episodeNumber,
      title: podcast.title,
      guest: podcast.guest,
      chapters: podcastChapters,
      transcript: podcastTranscript,
      youtube: { id: podcast.youtubeId },
      duration: Duration.seconds(podcast.duration),
      publishedOn: DateTime.makeUnsafe(podcast.date),
    },
    { disableValidation: true },
  )

  return (
    <PodcastEpisodeProviders episode={podcastEpisode}>
      <PodcastEpisodeLayout>{children}</PodcastEpisodeLayout>
    </PodcastEpisodeProviders>
  )
}

export function PodcastEpisodeProviders({
  children,
  episode,
}: React.PropsWithChildren<{
  readonly episode: PodcastEpisode
}>) {
  const embedManager = useAtomSuspense(embedManagerAtom(episode)).value
  const [isEmbedPreviewing, setEmbedPreviewing] = React.useState(true)

  const activateEmbed = React.useCallback(() => {
    setEmbedPreviewing(false)
  }, [])

  const transcriptFollowModeAtom = React.useMemo(() => Atom.make<TranscriptFollowMode>("auto"), [])
  const lastTranscriptUserScrollAtAtom = React.useMemo(
    () => Atom.make<number | undefined>(undefined),
    [],
  )
  const transcriptAutoFollowPauseTokenAtom = React.useMemo(() => Atom.make(0), [])

  const activateEmbedPlayback = React.useMemo(
    () =>
      Effect.fnUntraced(function* (get: Atom.FnContext) {
        activateEmbed()

        const state = get(embedManager.stateAtom)

        if (state._tag === "Active") {
          return state
        }

        return yield* Effect.sync(() => get(embedManager.stateAtom)).pipe(
          Effect.filterOrFail(
            (state): state is Extract<EmbedState, { _tag: "Active" }> => state._tag === "Active",
            () => "embed_not_active",
          ),
          Effect.retry(Schedule.spaced("100 millis")),
          Effect.orDie,
        )
      }),
    [activateEmbed, embedManager.stateAtom],
  )

  const trueChapterAtom = React.useMemo(
    () =>
      Atom.readable((get) => {
        const state = get(embedManager.stateAtom)
        return getActiveChapterForState(episode.chapters, state)
      }),
    [embedManager.stateAtom, episode.chapters],
  )

  const activeChapterAtom = React.useMemo(() => Atom.optimistic(trueChapterAtom), [trueChapterAtom])

  const setActiveChapterAtom = React.useMemo(
    () =>
      Atom.optimisticFn(activeChapterAtom, {
        reducer: (_, chapter) => chapter,
        fn: Atom.fn<PodcastChapter>()(
          Effect.fnUntraced(function* (chapter, get) {
            yield* activateEmbedPlayback(get)
            yield* get.setResult(embedManager.seekTo, chapter.startSeconds)
            yield* get.setResult(embedManager.play, undefined)

            const trueChapter = get(trueChapterAtom)

            if (trueChapter?.id !== chapter.id) {
              yield* Effect.sync(() => get(trueChapterAtom)).pipe(
                Effect.filterOrFail(
                  (trueChapter) => trueChapter?.id === chapter.id,
                  () => "unconfirmed_seek",
                ),
                Effect.retry(Schedule.spaced("100 millis")),
                Effect.orDie,
              )
            }
          }),
        ),
      }),
    [
      activeChapterAtom,
      activateEmbedPlayback,
      embedManager.play,
      embedManager.seekTo,
      trueChapterAtom,
    ],
  )

  const trueTranscriptCueAtom = React.useMemo(
    () =>
      Atom.readable((get) => {
        const state = get(embedManager.stateAtom)
        return getActiveTranscriptCueForState(episode.transcript, state)
      }),
    [embedManager.stateAtom, episode.transcript],
  )

  const activeTranscriptCueAtom = React.useMemo(
    () => Atom.optimistic(trueTranscriptCueAtom),
    [trueTranscriptCueAtom],
  )

  const resumeTranscriptAutoFollowAtom = React.useMemo(
    () =>
      Atom.fn<void>()((_, get) => {
        const token = get(transcriptAutoFollowPauseTokenAtom) + 1
        get.set(transcriptAutoFollowPauseTokenAtom, token)
        get.set(transcriptFollowModeAtom, "auto")
        return Effect.void
      }),
    [transcriptAutoFollowPauseTokenAtom, transcriptFollowModeAtom],
  )

  const pauseTranscriptAutoFollowAtom = React.useMemo(
    () =>
      Atom.fn<void>()(
        Effect.fnUntraced(function* (_: void, get: Atom.FnContext) {
          const token = get(transcriptAutoFollowPauseTokenAtom) + 1
          get.set(transcriptAutoFollowPauseTokenAtom, token)
          get.set(lastTranscriptUserScrollAtAtom, Date.now())
          get.set(transcriptFollowModeAtom, "paused-by-user")

          yield* Effect.sleep(transcriptAutoFollowResumeDelay)

          if (get(transcriptAutoFollowPauseTokenAtom) !== token) {
            return
          }

          get.set(transcriptFollowModeAtom, "auto")
        }),
        { concurrent: true },
      ),
    [lastTranscriptUserScrollAtAtom, transcriptAutoFollowPauseTokenAtom, transcriptFollowModeAtom],
  )

  const isDesktopViewportAtom = React.useMemo(
    () =>
      Atom.make((get) => {
        if (typeof window === "undefined") {
          return false
        }

        const mediaQuery = window.matchMedia("(min-width: 1024px)")
        const syncDesktop = () => {
          get.setSelf(mediaQuery.matches)
        }

        mediaQuery.addEventListener("change", syncDesktop)
        get.addFinalizer(() => mediaQuery.removeEventListener("change", syncDesktop))

        return mediaQuery.matches
      }),
    [],
  )

  const shouldAutoFollowTranscriptAtom = React.useMemo(
    () =>
      Atom.readable(
        (get) => get(isDesktopViewportAtom) && get(transcriptFollowModeAtom) === "auto",
      ),
    [isDesktopViewportAtom, transcriptFollowModeAtom],
  )

  const setActiveTranscriptCueAtom = React.useMemo(
    () =>
      Atom.optimisticFn(activeTranscriptCueAtom, {
        reducer: (_, cue) => cue,
        fn: Atom.fn<PodcastTranscriptCue>()(
          Effect.fnUntraced(function* (cue, get) {
            const token = get(transcriptAutoFollowPauseTokenAtom) + 1
            get.set(transcriptAutoFollowPauseTokenAtom, token)
            get.set(transcriptFollowModeAtom, "auto")

            yield* activateEmbedPlayback(get)

            yield* get.setResult(embedManager.seekTo, cue.startSeconds)
            yield* get.setResult(embedManager.play, undefined)

            const trueCue = get(trueTranscriptCueAtom)

            if (trueCue?.id !== cue.id) {
              yield* Effect.sync(() => get(trueTranscriptCueAtom)).pipe(
                Effect.filterOrFail(
                  (trueCue) => trueCue?.id === cue.id,
                  () => "unconfirmed_seek",
                ),
                Effect.retry(Schedule.spaced("100 millis")),
                Effect.orDie,
              )
            }
          }),
        ),
      }),
    [
      activeTranscriptCueAtom,
      activateEmbedPlayback,
      embedManager.play,
      embedManager.seekTo,
      transcriptAutoFollowPauseTokenAtom,
      transcriptFollowModeAtom,
      trueTranscriptCueAtom,
    ],
  )

  return (
    <PodcastContext.Provider
      value={{
        episode,
        chapters: episode.chapters,
        activeChapterAtom,
        setActiveChapterAtom,
        activeTranscriptCueAtom,
        setActiveTranscriptCueAtom,
        shouldAutoFollowTranscriptAtom,
        pauseTranscriptAutoFollowAtom,
        resumeTranscriptAutoFollowAtom,
        activateEmbed,
        isPreviewing: isEmbedPreviewing,
      }}
    >
      <EmbedManagerContext.Provider value={embedManager}>{children}</EmbedManagerContext.Provider>
    </PodcastContext.Provider>
  )
}

function getActiveChapterForState(
  chapters: ReadonlyArray<PodcastChapter>,
  state: EmbedState,
): PodcastChapter | undefined {
  if (chapters.length === 0) {
    return undefined
  }

  if (state._tag !== "Active") {
    return chapters[0]
  }

  const currentTimeSeconds = getPlaybackCurrentTimeSeconds(state.playback)

  if (currentTimeSeconds === undefined) {
    return chapters[0]
  }

  return chapters.findLast((chapter) => chapter.startSeconds <= currentTimeSeconds)
}

function getPlaybackCurrentTimeSeconds(playback: PlaybackState): number | undefined {
  switch (playback._tag) {
    case "Unstarted":
      return undefined
    default:
      return playback.currentTimeSeconds
  }
}

function getActiveTranscriptCueForState(
  transcript: ReadonlyArray<PodcastTranscriptCue>,
  state: EmbedState,
): PodcastTranscriptCue | undefined {
  if (transcript.length === 0) {
    return undefined
  }

  if (state._tag !== "Active") {
    return transcript[0]
  }

  const currentTimeSeconds = getPlaybackCurrentTimeSeconds(state.playback)

  if (currentTimeSeconds === undefined) {
    return transcript[0]
  }

  const activeCue = transcript.find(
    (cue) => cue.startSeconds <= currentTimeSeconds && currentTimeSeconds < cue.endSeconds,
  )

  if (activeCue !== undefined) {
    return activeCue
  }

  return transcript.findLast((cue) => cue.startSeconds <= currentTimeSeconds) ?? transcript[0]
}
