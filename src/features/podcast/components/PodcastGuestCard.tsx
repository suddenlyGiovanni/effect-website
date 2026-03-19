import ApplePodcastsLogo from "@/assets/logos/apple-podcasts/ApplePodcasts.webp"
import SpotifyLogo from "@/assets/logos/spotify/Spotify.svg?react"
import YouTubeLogo from "@/assets/logos/youtube/YouTube.svg?react"
import type { PodcastEpisode } from "../collection"
import { formatPodcastDate, formatPodcastDuration } from "../utils"

export function PodcastGuestCard({ podcast }: { readonly podcast: PodcastEpisode }) {
  const publicationDate = formatPodcastDate(podcast.date)
  const duration = formatPodcastDuration(podcast.duration)

  return (
    <div className="rounded-lg border border-zinc-700 bg-card p-4">
      <p className="mb-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">
        Featured Guest
      </p>

      <p className="text-lg font-semibold text-white">{podcast.guest}</p>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span>Warp</span>
        <span>·</span>
        <span>{publicationDate}</span>
        <span>·</span>
        <span>{duration}</span>
      </div>

      <hr className="my-4 h-px bg-secondary" />

      <div>
        <p className="mb-3 text-xs font-medium tracking-wider text-muted-foreground uppercase">
          Listen on
        </p>

        <div className="flex items-center justify-between">
          <a
            className="group flex items-center text-white no-underline transition-colors"
            href="https://open.spotify.com/show/4QTFiem4o0G9V2vXtv8vMU"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Listen to the Cause & Effect Podcast on Spotify"
          >
            <SpotifyLogo className="mr-1 size-6 fill-green-500" />
            <span className="text-sm group-hover:underline group-hover:underline-offset-2">
              Spotify
            </span>
          </a>
          <a
            className="group flex items-center text-white no-underline transition-colors"
            href="https://www.youtube.com/@EffectTS"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Subscribe to Effect on YouTube"
          >
            <YouTubeLogo className="mr-1 size-6 [&_.youtube-body]:fill-red-500 [&_.youtube-play]:fill-white" />
            <span className="text-sm group-hover:underline group-hover:underline-offset-2">
              YouTube
            </span>
          </a>
          <a
            className="group flex items-center text-white no-underline transition-colors"
            href="https://podcasts.apple.com/us/podcast/cause-effect/id1781879869"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Listen to the Cause & Effect Podcast on Apple Podcasts"
          >
            <img
              className="mr-1.5 h-5 w-auto"
              src={ApplePodcastsLogo.src}
              alt="Listen to the Cause & Effect Podcast on Apple Podcasts"
              loading="lazy"
            />
            <span className="text-sm group-hover:underline group-hover:underline-offset-2">
              Apple Podcasts
            </span>
          </a>
        </div>
      </div>
    </div>
  )
}
