import { useAtomSet, useAtomValue } from "@effect/atom-react"
import * as DateTime from "effect/DateTime"
import * as Duration from "effect/Duration"
import * as React from "react"
import type { PodcastEpisodeEntry } from "../collection"
import { podcastPlayerAtom, type PodcastPlayerAtom } from "../atoms"
import { PodcastEpisode, PodcastEpisodeId, type SrtCue } from "../domain"
import { normalizePodcastChapters, normalizePodcastTranscript } from "../utils"

export const PodcastPlayerContext = React.createContext<PodcastPlayerAtom>(null as any)

export interface PodcastEpisodeProviderProps {
  readonly podcast: PodcastEpisodeEntry
  readonly transcript: ReadonlyArray<SrtCue>
}

export function PodcastEpisodeProvider({
  children,
  podcast,
  transcript,
}: React.PropsWithChildren<PodcastEpisodeProviderProps>) {
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

  const podcastPlayer = podcastPlayerAtom(podcastEpisode)

  return (
    <PodcastPlayerContext.Provider value={podcastPlayer}>{children}</PodcastPlayerContext.Provider>
  )
}

export const usePodcastPlayer = () => React.useContext(PodcastPlayerContext)

export const usePodcastEpisode = () => usePodcastPlayer().episode

export const usePreconnectedValue = () => useAtomValue(usePodcastPlayer().preconnectAtom)

export const useSetPreconnected = () => useAtomSet(usePodcastPlayer().preconnectAtom)

export const useSetIframeElement = () => useAtomSet(usePodcastPlayer().iframeElementAtom)

export const useActiveChapter = () => useAtomValue(usePodcastPlayer().activeChapterAtom)

export const useActiveTranscriptCue = () => useAtomValue(usePodcastPlayer().activeTranscriptCueAtom)

export const useDebugSnapshot = () => useAtomValue(usePodcastPlayer().debugSnapshotAtom)

export const usePlayerSnapshot = () => useAtomValue(usePodcastPlayer().playerSnapshotAtom)

export const useVideoEmbedConnectionPhase = () =>
  useAtomValue(usePodcastPlayer().embedConnectionPhaseAtom)

export const useVideoEmbedConnectionError = () =>
  useAtomValue(usePodcastPlayer().embedConnectionErrorAtom)

export const useVideoEmbedControls = () => {
  const player = usePodcastPlayer()

  const connect = useAtomSet(player.connectToVideoEmbed)
  const disconnect = useAtomSet(player.disconnectFromVideoEmbed)
  const play = useAtomSet(player.playVideo)
  const pause = useAtomSet(player.pauseVideo)

  return {
    connect,
    disconnect,
    play,
    pause,
  }
}

export const useSeekToChapter = () => useAtomSet(usePodcastPlayer().seekToChapterAtom)

export const useSeekToCue = () => useAtomSet(usePodcastPlayer().seekToCueAtom)

export const usePauseAutoScroll = () => useAtomSet(usePodcastPlayer().pauseAutoScrollAtom)
