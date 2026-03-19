import { ArrowLeftIcon } from "lucide-react"
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
        <div className="mb-4 lg:mb-0">
          <YouTubeEmbed
            id={podcast.youtubeId}
            title={`${podcast.title} | Cause & Effect #${podcast.episode}`}
            className="rounded-lg"
            autoplay
            enableJSApi
            debug
          />
          <a
            href="/podcast/"
            className="mt-2 inline-flex items-center gap-1 text-sm text-muted-foreground no-underline transition-colors hover:text-white hover:underline hover:underline-offset-2 lg:mb-6"
          >
            <ArrowLeftIcon className="h-4" />
            <span>All episodes</span>
          </a>
        </div>

        <div className="mb-4 lg:hidden">
          <PodcastGuestCard podcast={podcast} />
        </div>

        <div className="mb-4 lg:hidden">
          <PodcastChapters chapters={podcast.chapters} />
        </div>

        <div className="mb-6 lg:hidden">
          <PodcastTranscript transcript={transcript} />
        </div>

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
