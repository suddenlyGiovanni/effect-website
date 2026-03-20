import { useAtomSet, useAtomSuspense, useAtomValue } from "@effect/atom-react"
import * as DateTime from "effect/DateTime"
import * as Duration from "effect/Duration"
import * as React from "react"
import {
  embedManagerAtom,
  YOUTUBE_NOCOOKIE_URL,
  type PodcastEmbedManager,
} from "@/features/podcast/services/PodcastEmbedManager"
import { cn, cssVars } from "@/lib/utils"
import type { PodcastEpisodeEntry } from "../collection"
import { PodcastEpisode, PodcastEpisodeId, type SrtCue } from "../domain"
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
        <div className="p-8">
          <div className="grid grid-cols-2 gap-8">
            <div className="relative h-108">
              <PodcastEpisodeEmbed />
            </div>
            <PodcastEmbedDebugger />
          </div>
        </div>
      </EmbedManagerContext.Provider>
    </PodcastEpisodeContext.Provider>
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

function PodcastEmbedDebugger() {
  const { play, pause, seekTo } = useEmbedControls()
  const debugInfo = useDebugInfo()
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
    (event: React.FormEvent<HTMLFormElement>) => {
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
        <section className="space-y-3 rounded-xl border border-emerald-900/60 bg-linear-to-br from-emerald-950/30 via-emerald-950/10 to-zinc-900/90 p-4 shadow-[inset_0_1px_0_rgba(16,185,129,0.08)]">
          <div className="flex items-center justify-between gap-3 border-b border-emerald-950/60 pb-3">
            <div>
              <p className="text-xs font-medium tracking-[0.18em] text-emerald-300/80 uppercase">
                Events
              </p>
              <p className="mt-1 text-sm text-zinc-400">
                Inspect raw embed messages and narrow by event type.
              </p>
            </div>
            <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
              {filteredEvents.length} shown
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_14rem]">
            <div className="no-scrollbar max-h-96 space-y-3 overflow-y-auto pr-1">
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
                          <p className="truncate font-mono text-xs text-zinc-200">{event.label}</p>
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

            <aside className="space-y-3 rounded-lg border border-emerald-900/50 bg-black/15 p-3 lg:sticky lg:top-0 lg:self-start">
              <div className="flex items-center justify-between gap-3 lg:flex-col lg:items-start">
                <div>
                  <p className="text-xs font-medium tracking-[0.18em] text-emerald-300/80 uppercase">
                    Event types
                  </p>
                  <p className="text-xs text-zinc-400">Click chips to filter the feed.</p>
                </div>
                <button
                  type="button"
                  onClick={clearFilters}
                  disabled={selectedLabels.size === 0}
                  className="rounded-md border border-zinc-700 px-2.5 py-1 text-[11px] font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100 disabled:cursor-default disabled:opacity-40"
                >
                  Clear
                </button>
              </div>

              <div className="flex flex-wrap gap-2 lg:flex-col lg:items-stretch">
                {eventCounts.map(([label, count]) => {
                  const isActive = selectedLabels.size === 0 || selectedLabels.has(label)

                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => toggleLabel(label)}
                      className={cn(
                        "inline-flex items-center justify-between gap-2 rounded-full border px-3 py-1.5 text-xs transition lg:w-full",
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
            </aside>
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-sky-900/60 bg-linear-to-br from-sky-950/40 via-sky-950/15 to-zinc-900/90 p-4 shadow-[inset_0_1px_0_rgba(56,189,248,0.08)]">
          <div className="border-b border-sky-950/60 pb-3">
            <p className="text-xs font-medium tracking-[0.18em] text-sky-300/80 uppercase">
              Controls
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              Send commands to the active YouTube iframe.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3 rounded-lg border border-sky-900/50 bg-black/15 p-3">
            <button
              type="button"
              onClick={() => play()}
              className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-200 transition hover:border-emerald-400/60 hover:bg-emerald-500/15"
            >
              Play
            </button>
            <button
              type="button"
              onClick={() => pause()}
              className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-100 transition hover:border-amber-400/60 hover:bg-amber-500/15"
            >
              Pause
            </button>
            <form onSubmit={submitSeekTo} className="flex flex-wrap items-end gap-2">
              <label className="flex min-w-40 flex-col gap-1">
                <span className="text-[11px] font-medium tracking-[0.18em] text-zinc-500 uppercase">
                  Seek to seconds
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  inputMode="decimal"
                  value={seekSeconds}
                  onChange={(event) => setSeekSeconds(event.target.value)}
                  className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-sm text-zinc-100 transition outline-none placeholder:text-zinc-500 focus:border-sky-500/60"
                />
              </label>
              <button
                type="submit"
                className="rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-sm font-medium text-sky-100 transition hover:border-sky-400/60 hover:bg-sky-500/15"
              >
                Seek
              </button>
            </form>
          </div>
        </section>
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
