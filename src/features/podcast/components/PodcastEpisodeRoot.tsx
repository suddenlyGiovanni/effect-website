import * as DateTime from "effect/DateTime"
import * as Duration from "effect/Duration"
import * as React from "react"
import { YouTubeEmbedProvider } from "@/features/youtube-embed"
import { PodcastEpisodeEntry } from "../collection"
import { PodcastContextProvider } from "../context"
import { PodcastEpisode, PodcastEpisodeId, type SrtCue } from "../domain"
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
      company: podcast.company,
      chapters: podcastChapters,
      transcript: podcastTranscript,
      links: podcast.links,
      youtube: { id: podcast.youtubeId },
      duration: Duration.seconds(podcast.duration),
      publishedOn: DateTime.makeUnsafe(podcast.date),
    },
    { disableValidation: true },
  )

  return (
    <YouTubeEmbedProvider
      video={{
        id: podcastEpisode.youtube.id,
        title: podcastEpisode.title,
      }}
    >
      <PodcastContextProvider episode={podcastEpisode}>
        <PodcastEpisodeLayout>{children}</PodcastEpisodeLayout>
      </PodcastContextProvider>
    </YouTubeEmbedProvider>
  )
}
