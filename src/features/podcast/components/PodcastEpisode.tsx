import * as React from "react"
import { YouTubeEmbed } from "@/features/youtube/components/YouTubeEmbed"
import type { PodcastEpisode as Podcast } from "../collection"
import type { SrtCue } from "../lib/transcript"
import { PodcastChapters } from "./PodcastChapters"
import { PodcastGuestCard } from "./PodcastGuestCard"
import { PodcastTranscript } from "./PodcastTranscript"

export interface PodcastEpisodeProps {
  readonly podcast: Podcast
  readonly transcript: ReadonlyArray<SrtCue>
}

export function PodcastEpisode({
  children,
  podcast,
  transcript,
}: React.PropsWithChildren<PodcastEpisodeProps>) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <YouTubeEmbed
          id={podcast.youtube.id}
          title={podcast.youtube.title}
          className="rounded-lg"
          autoplay
          enableJSApi
          debug
        />
        {children}
      </div>
      <aside className="col-span-1 hidden lg:sticky lg:top-20 lg:block lg:self-start">
        <div className="space-y-4">
          <PodcastGuestCard podcast={podcast} />
          <PodcastChapters chapters={podcast.chapters} />
          <PodcastTranscript transcript={transcript} />
        </div>
      </aside>
    </div>
  )
}
