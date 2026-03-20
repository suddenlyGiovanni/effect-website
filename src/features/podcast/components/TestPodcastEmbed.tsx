import { useAtomSet, useAtomSuspense, useAtomValue } from "@effect/atom-react"
import * as DateTime from "effect/DateTime"
import * as Duration from "effect/Duration"
import { ArrowLeftIcon, ChevronDownIcon, PlayIcon } from "lucide-react"
import * as React from "react"
import ApplePodcastsLogo from "@/assets/logos/apple-podcasts/ApplePodcasts.webp"
import SpotifyLogo from "@/assets/logos/spotify/Spotify.svg?react"
import YouTubeLogo from "@/assets/logos/youtube/YouTube.svg?react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  embedManagerAtom,
  YOUTUBE_NOCOOKIE_URL,
  type EmbedState,
  type PodcastEmbedManager,
} from "@/features/podcast/services/PodcastEmbedManager"
import { cn, cssVars } from "@/lib/utils"
import type { PodcastEpisodeEntry } from "../collection"
import { PodcastChapter, PodcastEpisode, PodcastEpisodeId, type SrtCue } from "../domain"
import { normalizePodcastChapters, normalizePodcastTranscript } from "../utils"

// =============================================================================
// Podcast Episode Context
// =============================================================================

const PodcastEpisodeContext = React.createContext<PodcastEpisode>(null as any)

const usePodcastEpisode = () => React.useContext(PodcastEpisodeContext)

// =============================================================================
// Embed Manager Context
// =============================================================================

const EmbedManagerContext = React.createContext<PodcastEmbedManager["Service"]>(null as any)

const useEmbedManager = () => React.useContext(EmbedManagerContext)

const useDebugInfo = () => useAtomValue(useEmbedManager().debugAtom)

const useEmbedState = () => useAtomValue(useEmbedManager().stateAtom)

const useConnectEmbed = () => useAtomSet(useEmbedManager().connect)

const useEmbedControls = () => {
  const manager = useEmbedManager()
  const play = useAtomSet(manager.play)
  const pause = useAtomSet(manager.pause)
  const seekTo = useAtomSet(manager.seekTo)
  return { play, pause, seekTo } as const
}

// =============================================================================
// UI
// =============================================================================

export function TestPodcastEmbed({
  podcast,
  transcript,
}: {
  readonly podcast: PodcastEpisodeEntry
  readonly transcript: ReadonlyArray<SrtCue>
}) {
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

  const manager = useAtomSuspense(embedManagerAtom(podcastEpisode)).value

  return (
    <PodcastEpisodeContext.Provider value={podcastEpisode}>
      <EmbedManagerContext.Provider value={manager}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-4 lg:mb-0">
              <PodcastEpisodeEmbed />
              <a
                href="/podcast/"
                className="mt-2 inline-flex items-center gap-1 text-sm text-muted-foreground no-underline transition-colors hover:text-white hover:underline hover:underline-offset-2 lg:mb-6"
              >
                <ArrowLeftIcon className="h-4" />
                <span>All episodes</span>
              </a>
            </div>

            {/* Mobile */}
            <div className="mb-4 lg:hidden">
              <PodcastGuestCard />
            </div>

            <div className="mb-4 lg:hidden">
              <PodcastChapters />
            </div>

            {/*
            <div className="mb-6 lg:hidden">
              <PodcastTranscript playerId={episode.id} transcript={episode.transcript} />
            </div>

            {children}
            */}
          </div>

          {/* Desktop */}
          <aside className="top-20 col-span-1 hidden lg:sticky lg:flex lg:h-[calc(100svh-10rem)] lg:max-h-[calc(100svh-10rem)] lg:min-h-0 lg:flex-col lg:self-start">
            <div className="space-y-4 lg:flex-1">
              <PodcastGuestCard />
              <PodcastChapters />
              {/*<PodcastTranscript playerId={episode.id} transcript={episode.transcript} />*/}
            </div>
          </aside>
        </div>

        <EmbedDebugger />
      </EmbedManagerContext.Provider>
    </PodcastEpisodeContext.Provider>
  )
}

export function PodcastGuestCard() {
  const episode = usePodcastEpisode()

  return (
    <div className="rounded-lg border border-zinc-700 bg-card p-4">
      <p className="mb-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">
        Featured Guest
      </p>

      <p className="text-lg font-semibold text-white">{episode.guest}</p>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span>Warp</span>
        <span>·</span>
        <span>{episode.formattedPublicationDate}</span>
        <span>·</span>
        <span>{episode.formattedDuration}</span>
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

export function PodcastChapters() {
  const episode = usePodcastEpisode()
  const state = useEmbedState()
  const { seekTo } = useEmbedControls()

  const handleSeek = React.useCallback(
    (chapter: PodcastChapter) => {
      seekTo(chapter.startSeconds)
    },
    [seekTo],
  )

  const activeChapter = episode.chapters.findLast((chapter) => {
    if (state._tag === "Active" && "currentTimeSeconds" in state.playback) {
      return chapter.startSeconds <= state.playback.currentTimeSeconds
    }
    return false
  })

  return (
    <Collapsible defaultOpen={false} className="rounded-lg border border-zinc-700 bg-card">
      <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between rounded-lg bg-card px-4 py-3 transition-colors hover:bg-accent/50 data-panel-open:rounded-b-none">
        <h2 className="text-sm font-semibold">Chapters</h2>
        <ChevronDownIcon className="size-4 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t bg-card">
          <ScrollArea className="h-64 p-2 lg:max-h-[min(16rem,35vh)]">
            <ul className="pr-2">
              {episode.chapters.map((chapter, index) => {
                const isActive = activeChapter ? activeChapter === chapter : index === 0

                return (
                  <li key={chapter.id} className="group m-0 list-none p-0">
                    <button
                      type="button"
                      onClick={() => handleSeek(chapter)}
                      aria-label={`Jump to ${chapter.startLabel}: ${chapter.title}`}
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-3 bg-inherit px-3 py-2.5 text-left transition-colors hover:bg-accent/50",
                        isActive && "bg-accent",
                        index === 0 && "rounded-t-md",
                        index === episode.chapters.length - 1 && "rounded-b-md",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground group-hover:text-foreground",
                        )}
                      >
                        {isActive ? (
                          <PlayIcon className="size-3 transition-none" fill="currentColor" />
                        ) : (
                          index + 1
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "truncate text-sm font-medium transition-colors",
                            isActive
                              ? "text-foreground"
                              : "text-muted-foreground group-hover:text-foreground",
                          )}
                        >
                          {chapter.title}
                        </p>
                      </div>
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">
                        {chapter.startLabel}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </ScrollArea>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export type YouTubePosterQuality =
  | "default"
  | "hqdefault"
  | "mqdefault"
  | "sddefault"
  | "maxresdefault"

/**
 * SEO metadata for a YouTube video that follows the schema.org `VideoObject`
 * structure.
 *
 * See: https://developers.google.com/search/docs/appearance/structured-data/video
 *
 * All fields are optional but providing them improves search engine
 * discoverability and enables rich results (video carousels, thumbnails in
 * search results).
 */
export interface YouTubeVideoSEO {
  /**
   * The title of the video. If not provided, falls back to the component's
   * `title` prop.
   */
  readonly name?: string | undefined
  /**
   * A description of the video content.
   *
   * Recommended: 50-160 characters for optimal search result display.
   */
  readonly description?: string | undefined
  /**
   * ISO 8601 date when the video was uploaded to YouTube.
   */
  readonly uploadDate?: string | undefined
  /**
   * ISO 8601 duration format. Required for video rich results.
   * Format: PT#H#M#S where # is the number of hours, minutes, seconds
   */
  readonly duration?: string | undefined
  /**
   * Custom thumbnail URL. If not provided, auto-generated from video ID.
   * Recommended: At least 1200px wide for best quality in search results.
   */
  readonly thumbnailUrl?: string | undefined
  /**
   * Direct URL to watch the video. Auto-generated if not provided.
   * @example "https://www.youtube.com/watch?v=L2vS_050c-M"
   */
  readonly contentUrl?: string | undefined
  /**
   * The embed URL. Auto-generated from video ID if not provided.
   */
  readonly embedUrl?: string | undefined
}

const YOUTUBE_PLAY_BUTTON_SVG =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 68 48"><path d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55c-2.93.78-4.63 3.26-5.42 6.19C.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z" fill="%23f00"/><path d="M45 24 27 14v20" fill="%23fff"/></svg>'

const FALLBACK_POSTER_BACKGROUND_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAADGCAYAAAAT+OqFAAAAdklEQVQoz42QQQ7AIAgEF/T/D+kbq/RWAlnQyyazA4aoAB4FsBSA/bFjuF1EOL7VbrIrBuusmrt4ZZORfb6ehbWdnRHEIiITaEUKa5EJqUakRSaEYBJSCY2dEstQY7AuxahwXFrvZmWl2rh4JZ07z9dLtesfNj5q0FU3A5ObbwAAAABJRU5ErkJggg=="

/**
 * Generates JSON-LD structured data for the VideoObject schema.
 *
 * @see https://schema.org/VideoObject
 * @see https://developers.google.com/search/docs/appearance/structured-data/video
 */
function generateVideoStructuredData(
  videoId: string,
  title: string,
  posterUrl: string,
  youtubeUrl: string,
  seo?: YouTubeVideoSEO,
): string {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: seo?.name || title,
    thumbnailUrl: [seo?.thumbnailUrl || posterUrl],
    embedUrl: seo?.embedUrl || `${youtubeUrl}/embed/${videoId}`,
    contentUrl: seo?.contentUrl || `https://www.youtube.com/watch?v=${videoId}`,
    ...(seo?.description && { description: seo.description }),
    ...(seo?.uploadDate && { uploadDate: seo.uploadDate }),
    ...(seo?.duration && { duration: seo.duration }),
  }
  return JSON.stringify(structuredData)
}

function PodcastEpisodeEmbed({
  aspectHeight = 9,
  aspectWidth = 16,
  posterQuality = "hqdefault",
  seo,
  webp = true,
}: {
  readonly aspectHeight?: number | undefined
  readonly aspectWidth?: number | undefined
  readonly posterQuality?: YouTubePosterQuality | undefined
  readonly seo?: YouTubeVideoSEO | undefined
  readonly webp?: boolean | undefined
}) {
  const connect = useConnectEmbed()
  const episode = usePodcastEpisode()
  const [isPreviewing, setPreviewing] = React.useState(true)
  const [isPreconnected, setPreconnected] = React.useState(false)

  const posterUrl = React.useMemo(() => {
    const id = globalThis.encodeURIComponent(episode.youtube.id)
    const format = webp ? "webp" : "jpg"
    const vi = webp ? "vi_webp" : "vi"
    return `https://i.ytimg.com/${vi}/${id}/${posterQuality}.${format}`
  }, [episode.youtube.id, posterQuality, webp])

  const handleClick = React.useCallback(() => {
    if (!isPreviewing) return
    setPreviewing(false)
  }, [isPreviewing, setPreviewing])

  const handlePreconnect = React.useCallback(() => {
    if (isPreconnected) return
    setPreconnected(true)
  }, [isPreconnected, setPreconnected])

  const targetRef = React.useCallback(
    (element: HTMLDivElement | null) => {
      if (!isPreviewing && element !== null) {
        connect(element)
      }
    },
    [isPreviewing],
  )

  return (
    <React.Fragment>
      {/* YouTube Poster Preload */}
      <link rel="preload" href={posterUrl} as="image" />

      {/* YouTube Preconnect */}
      {isPreconnected && (
        <React.Fragment>
          <link rel="preconnect" href={YOUTUBE_NOCOOKIE_URL} />
          <link rel="preconnect" href="https://www.google.com" />
        </React.Fragment>
      )}

      {/* SEO: Metadata for the YouTube video following the VideoObject schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: generateVideoStructuredData(
            episode.youtube.id,
            episode.title,
            posterUrl,
            YOUTUBE_NOCOOKIE_URL,
            seo,
          ),
        }}
      />

      {/* SEO: Include a noscript fallback for accessibility / web crawlers */}
      <noscript>
        <a
          href={`https://www.youtube.com/watch?v=${episode.youtube.id}`}
          aria-label={`Watch ${episode.title} on YouTube`}
        >
          Watch &quot;{episode.title}&quot; on YouTube
        </a>
      </noscript>

      <article
        style={cssVars({
          "--aspect-ratio": `${(aspectHeight / aspectWidth) * 100}%`,
          "--container-url": `url('${FALLBACK_POSTER_BACKGROUND_IMAGE}')`,
          backgroundImage: `url('${posterUrl}')`,
        })}
        className={cn(
          "group relative aspect-video overflow-hidden rounded-lg bg-cover bg-position-[50%] contain-layout contain-size",
          "after:block after:pb-(--aspect-ratio) after:content-['']",
          isPreviewing &&
            "before:pointer-events-none before:absolute before:top-0 before:box-content before:block before:h-[60px] before:w-full before:bg-(image:--container-url) before:bg-top before:bg-repeat-x before:pb-[50px] before:opacity-0 before:transition-all before:duration-200 before:content-['']",
        )}
        data-title={episode.title}
      >
        {isPreviewing && (
          <button
            type="button"
            onClick={handleClick}
            onPointerOver={handlePreconnect}
            onFocus={handlePreconnect}
            aria-label={`Watch ${episode.title}`}
            style={cssVars({
              "--button-url": `url('${YOUTUBE_PLAY_BUTTON_SVG}')`,
            })}
            className="absolute inset-0 z-1 cursor-pointer rounded-lg border border-zinc-700 bg-transparent p-0"
          >
            <span className="sr-only">Watch {episode.title}</span>
            <span
              aria-hidden="true"
              className={cn(
                "absolute top-1/2 left-1/2 h-12 w-17 -translate-1/2",
                "bg-transparent bg-(image:--button-url) bg-size-[100%_100%] bg-no-repeat",
                "opacity-80 grayscale transition-[filter,opacity] duration-100 ease-out",
                "group-hover:opacity-100 group-hover:filter-none",
              )}
            />
          </button>
        )}

        {!isPreviewing && (
          <div
            ref={targetRef}
            className={cn(
              "[&>iframe]:absolute [&>iframe]:top-0 [&>iframe]:right-0 [&>iframe]:left-0",
              "[&>iframe]:block [&>iframe]:h-full [&>iframe]:w-full",
              "[&>iframe]:border-0 [&>iframe]:bg-black [&>iframe]:p-0 [&>iframe]:outline-0",
            )}
          />
        )}
      </article>
    </React.Fragment>
  )
}

export function EmbedDebugger() {
  const { play, pause, seekTo } = useEmbedControls()
  const debugInfo = useDebugInfo()
  const state = useEmbedState()
  const [selectedLabels, setSelectedLabels] = React.useState<ReadonlySet<string>>(() => new Set())
  const [seekSeconds, setSeekSeconds] = React.useState("0")

  const events = React.useMemo(
    () =>
      debugInfo.map((raw) => {
        const parsed = parseDebugEvent(raw)
        const label = getDebugEventLabel(parsed)
        return { raw, parsed, label }
      }),
    [debugInfo],
  )

  const eventCounts = React.useMemo(() => {
    const counts = new Map<string, number>()

    for (const event of events) {
      counts.set(event.label, (counts.get(event.label) ?? 0) + 1)
    }

    return Array.from(counts.entries()).sort(([left], [right]) => left.localeCompare(right))
  }, [events])

  const availableLabels = React.useMemo(
    () => new Set(eventCounts.map(([label]) => label)),
    [eventCounts],
  )

  const filteredEvents = React.useMemo(() => {
    if (selectedLabels.size === 0) return events
    return events.filter((event) => selectedLabels.has(event.label))
  }, [events, selectedLabels])

  React.useEffect(() => {
    setSelectedLabels((current) => {
      const next = new Set(Array.from(current).filter((label) => availableLabels.has(label)))
      return next.size === current.size ? current : next
    })
  }, [availableLabels])

  const toggleLabel = React.useCallback((label: string) => {
    setSelectedLabels((current) => {
      const next = new Set(current)
      if (next.has(label)) {
        next.delete(label)
      } else {
        next.add(label)
      }
      return next
    })
  }, [])

  const clearFilters = React.useCallback(() => {
    setSelectedLabels(new Set())
  }, [])

  const submitSeekTo = React.useCallback(
    (event: React.SubmitEvent<HTMLFormElement>) => {
      event.preventDefault()

      const seconds = Number(seekSeconds)
      if (!Number.isFinite(seconds) || seconds < 0) return

      seekTo(seconds)
    },
    [seekSeconds, seekTo],
  )

  return (
    <section className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 text-zinc-100 shadow-lg shadow-black/20 backdrop-blur-sm">
      <header className="flex items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <p className="text-xs font-medium tracking-[0.24em] text-zinc-500 uppercase">
          Embed debugger
        </p>
        <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
          {debugInfo.length} events
        </div>
      </header>

      <div className="space-y-4">
        <section className="space-y-2 rounded-xl border border-sky-900/60 bg-linear-to-br from-sky-950/40 via-sky-950/15 to-zinc-900/90 p-3 shadow-[inset_0_1px_0_rgba(56,189,248,0.08)]">
          <p className="text-xs font-medium tracking-[0.18em] text-sky-300/80 uppercase">
            Controls
          </p>

          <div className="flex flex-wrap items-end gap-2 rounded-lg border border-sky-900/50 bg-black/15 p-2.5">
            <button
              type="button"
              onClick={() => play()}
              className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1.5 text-sm font-medium text-emerald-200 transition hover:border-emerald-400/60 hover:bg-emerald-500/15"
            >
              Play
            </button>
            <button
              type="button"
              onClick={() => pause()}
              className="rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 text-sm font-medium text-amber-100 transition hover:border-amber-400/60 hover:bg-amber-500/15"
            >
              Pause
            </button>
            <form onSubmit={submitSeekTo} className="flex flex-wrap items-end gap-2">
              <label className="flex min-w-34 flex-col gap-1">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  inputMode="decimal"
                  value={seekSeconds}
                  onChange={(event) => setSeekSeconds(event.target.value)}
                  placeholder="seconds"
                  className="rounded-md border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 font-mono text-sm text-zinc-100 transition outline-none placeholder:text-zinc-500 focus:border-sky-500/60"
                />
              </label>
              <button
                type="submit"
                className="rounded-md border border-sky-500/40 bg-sky-500/10 px-2.5 py-1.5 text-sm font-medium text-sky-100 transition hover:border-sky-400/60 hover:bg-sky-500/15"
              >
                Seek
              </button>
            </form>
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-2 xl:items-stretch">
          <section className="space-y-3 rounded-xl border border-amber-900/60 bg-linear-to-br from-amber-950/25 via-amber-950/10 to-zinc-900/90 p-4 shadow-[inset_0_1px_0_rgba(245,158,11,0.08)]">
            <div className="flex items-center justify-between gap-3 border-b border-amber-950/60 pb-3">
              <div>
                <p className="text-xs font-medium tracking-[0.18em] text-amber-300/80 uppercase">
                  State
                </p>
              </div>
              <div className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 font-mono text-xs font-medium text-amber-200">
                {state._tag}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <StatePill label="state" value={state._tag} />
              <StatePill label="playback" value={getEmbedPlaybackLabel(state)} />
              <StatePill label="pending" value={getEmbedPendingLabel(state)} />
            </div>

            <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80">
              <pre className="overflow-x-auto px-3 py-3 font-mono text-xs leading-5 text-zinc-300">
                <code>{JSON.stringify(state, null, 2)}</code>
              </pre>
            </div>
          </section>

          <section className="flex min-h-0 flex-col space-y-3 rounded-xl border border-emerald-900/60 bg-linear-to-br from-emerald-950/30 via-emerald-950/10 to-zinc-900/90 p-4 shadow-[inset_0_1px_0_rgba(16,185,129,0.08)] xl:h-full">
            <div className="flex items-center justify-between gap-3 border-b border-emerald-950/60 pb-3">
              <div>
                <p className="text-xs font-medium tracking-[0.18em] text-emerald-300/80 uppercase">
                  Events
                </p>
              </div>
              <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
                {filteredEvents.length} shown
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="flex min-w-0 flex-1 flex-wrap gap-2">
                {eventCounts.map(([label, count]) => {
                  const isActive = selectedLabels.size === 0 || selectedLabels.has(label)

                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => toggleLabel(label)}
                      className={cn(
                        "inline-flex items-center justify-between gap-2 rounded-full border px-3 py-1.5 text-xs transition",
                        isActive
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                          : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200",
                      )}
                    >
                      <span className="font-mono">{label}</span>
                      <span className="rounded-full bg-black/20 px-1.5 py-0.5 font-mono text-[10px]">
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>

              <button
                type="button"
                onClick={clearFilters}
                disabled={selectedLabels.size === 0}
                className="shrink-0 rounded-md border border-zinc-700 px-2.5 py-1 text-[11px] font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100 disabled:cursor-default disabled:opacity-40"
              >
                Clear
              </button>
            </div>

            <div className="min-h-0 flex-1">
              <div className="no-scrollbar min-h-0 space-y-3 overflow-y-auto pr-1 xl:h-full">
                {debugInfo.length === 0 && (
                  <div className="rounded-xl border border-dashed border-zinc-700/70 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-400">
                    Waiting for YouTube embed events...
                  </div>
                )}

                {filteredEvents
                  .slice()
                  .reverse()
                  .map((event, index) => {
                    return (
                      <article
                        key={`${event.label}-${index}`}
                        className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80"
                      >
                        <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-3 py-2">
                          <div className="min-w-0">
                            <p className="truncate font-mono text-xs text-zinc-200">
                              {event.label}
                            </p>
                            <p className="text-[11px] tracking-[0.22em] text-zinc-500 uppercase">
                              Event #{filteredEvents.length - index}
                            </p>
                          </div>
                          <div className="rounded-full bg-zinc-800 px-2 py-1 font-mono text-[11px] text-zinc-400">
                            {event.parsed === null ? "raw" : "json"}
                          </div>
                        </div>

                        <pre className="overflow-x-auto px-3 py-3 font-mono text-xs leading-5 text-zinc-300">
                          <code>{formatDebugEvent(event.parsed, event.raw)}</code>
                        </pre>
                      </article>
                    )
                  })}

                {filteredEvents.length === 0 && (
                  <div className="rounded-xl border border-dashed border-zinc-700/70 bg-zinc-950/40 px-4 py-6 text-center text-sm text-zinc-400">
                    No events match current filters.
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>
  )
}

const parseDebugEvent = (event: string): unknown | null => {
  try {
    return JSON.parse(event)
  } catch {
    return null
  }
}

const getDebugEventLabel = (event: unknown): string => {
  if (event !== null && typeof event === "object") {
    const maybeEvent = Reflect.get(event, "event")
    if (typeof maybeEvent === "string") {
      return maybeEvent
    }
  }

  return "unknown"
}

const formatDebugEvent = (parsed: unknown | null, raw: string): string => {
  if (parsed === null) return raw
  return JSON.stringify(parsed, null, 2)
}

function StatePill({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="rounded-full border border-amber-500/20 bg-amber-500/8 px-3 py-1.5 text-xs text-amber-100/90">
      <span className="text-zinc-400">{label}: </span>
      <span className="font-mono">{value}</span>
    </div>
  )
}

const getEmbedPlaybackLabel = (state: EmbedState): string => {
  if (state._tag !== "Active") return "-"
  return state.playback._tag
}

const getEmbedPendingLabel = (state: EmbedState): string => {
  if (state._tag !== "Active") return "-"
  return state.pending._tag
}
