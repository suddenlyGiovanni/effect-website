import { useAtomSuspense } from "@effect/atom-react"
import * as DateTime from "effect/DateTime"
import * as Duration from "effect/Duration"
import * as Effect from "effect/Effect"
import * as Schedule from "effect/Schedule"
import * as Atom from "effect/unstable/reactivity/Atom"
import * as React from "react"
import { PodcastEpisodeEntry } from "../collection"
import { EmbedManagerContext } from "../context/EmbedManagerContext"
import { PodcastChapterContext } from "../context/PodcastChapterContext"
import { PodcastEpisodeContext } from "../context/PodcastEpisodeContext"
import { PodcastChapter, PodcastEpisode, PodcastEpisodeId, type SrtCue } from "../domain"
import {
  embedManagerAtom,
  type EmbedState,
  type PlaybackState,
} from "../services/PodcastEmbedManager"
import { normalizePodcastChapters, normalizePodcastTranscript } from "../utils"
import { PodcastEpisodeLayout } from "./PodcastEpisodeLayout"

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

  const trueChapterAtom = Atom.readable((get) => {
    const state = get(embedManager.stateAtom)
    return getActiveChapterForState(episode.chapters, state)
  })

  const activeChapterAtom = Atom.optimistic(trueChapterAtom)

  const setActiveChapterAtom = Atom.optimisticFn(activeChapterAtom, {
    reducer: (_, chapter) => chapter,
    fn: Atom.fn<PodcastChapter>()(
      Effect.fnUntraced(function* (chapter, get) {
        yield* get.setResult(embedManager.seekTo, chapter.startSeconds)

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
  })

  return (
    <PodcastEpisodeContext.Provider value={episode}>
      <PodcastChapterContext.Provider
        value={{
          chapters: episode.chapters,
          activeChapterAtom,
          setActiveChapterAtom,
        }}
      >
        <EmbedManagerContext.Provider value={embedManager}>{children}</EmbedManagerContext.Provider>
      </PodcastChapterContext.Provider>
    </PodcastEpisodeContext.Provider>
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
