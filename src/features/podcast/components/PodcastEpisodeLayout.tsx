import { ArrowLeftIcon } from "lucide-react"
import * as React from "react"
import { YouTubeEmbed } from "@/features/youtube-embed"
import { PodcastChapters } from "./PodcastChapters"
import { PodcastGuestCard } from "./PodcastGuestCard"
import { PodcastTranscript } from "./PodcastTranscript"
// import { PodcastVideoEmbed } from "./PodcastVideoEmbed"

// TODO: debugger UI

export function PodcastEpisodeLayout({ children }: React.PropsWithChildren) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="mb-4 lg:mb-0">
          <YouTubeEmbed />
          <BackToAllEpisodes />
        </div>
        <div className="mb-4 lg:hidden">{/* <PodcastGuestCard /> */}</div>
        <div className="mb-4 lg:hidden">{/* <PodcastChapters /> */}</div>
        <div className="mb-6 lg:hidden">{/* <PodcastTranscript /> */}</div>
        {children}
      </div>
      <aside className="top-20 col-span-1 hidden lg:sticky lg:flex lg:h-[calc(100svh-10rem)] lg:max-h-[calc(100svh-10rem)] lg:min-h-0 lg:flex-col lg:self-start">
        <div className="space-y-4 lg:flex-1">
          {/* <PodcastGuestCard /> */}
          {/* <PodcastChapters /> */}
          {/* <PodcastTranscript /> */}
        </div>
      </aside>
    </div>
  )
}

function BackToAllEpisodes() {
  return (
    <a
      href="/podcast/"
      className="mt-2 inline-flex items-center gap-1 text-sm text-muted-foreground no-underline transition-colors hover:text-white hover:underline hover:underline-offset-2 lg:mb-6"
    >
      <ArrowLeftIcon className="h-4" />
      <span>All episodes</span>
    </a>
  )
}
