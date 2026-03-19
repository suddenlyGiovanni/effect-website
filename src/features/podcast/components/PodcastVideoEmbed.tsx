import * as Option from "effect/Option"
import * as React from "react"
import { cn, cssVars } from "@/lib/utils"
import {
  usePodcastEpisode,
  usePreconnectedValue,
  useSetIframeElement,
  useVideoEmbedConnectionError,
  useVideoEmbedControls,
} from "./PodcastEpisodeProvider"
import { PodcastVideoEmbedDebugger } from "./PodcastVideoEmbedDebugger"
import { PodcastVideoEmbedPlayButton } from "./PodcastVideoEmbedPlayButton"

export type YouTubePosterQuality =
  | "default"
  | "hqdefault"
  | "mqdefault"
  | "sddefault"
  | "maxresdefault"

export interface PodcastVideoEmbedProps {
  readonly autoplay?: boolean | undefined
  readonly cookie?: boolean | undefined
  readonly debug?: boolean | undefined
  readonly enableJSApi?: boolean | undefined
  readonly lazyLoad?: boolean | undefined
  readonly muted?: boolean | undefined
  readonly poster?: YouTubePosterQuality | undefined
  readonly webp?: boolean | undefined
}

const YOUTUBE_URL = "https://www.youtube.com"
const YOUTUBE_NOCOOKIE_URL = "https://www.youtube-nocookie.com"
const POSTER_BACKGROUND_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAADGCAYAAAAT+OqFAAAAdklEQVQoz42QQQ7AIAgEF/T/D+kbq/RWAlnQyyazA4aoAB4FsBSA/bFjuF1EOL7VbrIrBuusmrt4ZZORfb6ehbWdnRHEIiITaEUKa5EJqUakRSaEYBJSCY2dEstQY7AuxahwXFrvZmWl2rh4JZ07z9dLtesfNj5q0FU3A5ObbwAAAABJRU5ErkJggg=="

export function PodcastVideoEmbed(props: PodcastVideoEmbedProps) {
  const episode = usePodcastEpisode()
  const setIframeElement = useSetIframeElement()
  const preconnected = usePreconnectedValue()
  const { connect, disconnect } = useVideoEmbedControls()
  const connectionError = useVideoEmbedConnectionError()
  const [previewing, setPreviewing] = React.useState(true)

  const aspectRatio = `${(9 / 16) * 100}%`

  const posterUrl = React.useMemo(() => {
    const id = globalThis.encodeURIComponent(episode.youtube.id)
    const format = props.webp ? "webp" : "jpg"
    const vi = props.webp ? "vi_webp" : "vi"
    const poster = props.poster ?? "hqdefault"
    return `https://i.ytimg.com/${vi}/${id}/${poster}.${format}`
  }, [episode.youtube.id, props.poster, props.webp])

  const youtubeUrl = React.useMemo(
    () => (props.cookie ? YOUTUBE_URL : YOUTUBE_NOCOOKIE_URL),
    [props.cookie],
  )

  const iframeSrc = React.useMemo(() => {
    const url = new URL(getYouTubeEmbedUrl(episode.youtube.id))
    if (typeof window !== "undefined") {
      url.searchParams.set("origin", window.location.origin)
    }
    if (props.cookie !== true) {
      url.hostname = new URL(YOUTUBE_NOCOOKIE_URL).hostname
    }
    if (props.autoplay) {
      url.searchParams.set("autoplay", "1")
    }
    if (props.muted) {
      url.searchParams.set("mute", "1")
      url.searchParams.set("muted", "1")
    }
    return url.toString()
  }, [props.autoplay, props.cookie, episode.youtube.id, props.muted])

  const iframeRef = React.useCallback(
    (iframe: HTMLIFrameElement | null) => {
      if (iframe) {
        setIframeElement(Option.some(iframe))
      } else {
        setIframeElement(Option.none())
      }
    },
    [setIframeElement],
  )

  React.useEffect(() => {
    if (previewing || !props.enableJSApi || typeof window === "undefined") {
      return
    }
    connect(youtubeUrl)
    return () => disconnect()
  }, [connect, disconnect, previewing, props.enableJSApi, youtubeUrl])

  return (
    <React.Fragment>
      {!props.lazyLoad && <link rel="preload" href={posterUrl} as="image" />}

      {preconnected && (
        <React.Fragment>
          <link rel="preconnect" href={youtubeUrl} />
          <link rel="preconnect" href="https://www.google.com" />
        </React.Fragment>
      )}

      <article
        style={cssVars({
          "--aspect-ratio": aspectRatio,
          "--container-url": `url('${POSTER_BACKGROUND_IMAGE}')`,
          ...(props.lazyLoad ? {} : { backgroundImage: `url('${posterUrl}')` }),
        })}
        className={cn(
          "group relative aspect-video overflow-hidden rounded-lg bg-cover bg-position-[50%] contain-layout contain-size",
          "after:block after:pb-(--aspect-ratio) after:content-['']",
          previewing &&
            "before:pointer-events-none before:absolute before:top-0 before:box-content before:block before:h-[60px] before:w-full before:bg-(image:--container-url) before:bg-top before:bg-repeat-x before:pb-[50px] before:opacity-0 before:transition-all before:duration-200 before:content-['']",
        )}
        data-title={episode.title}
      >
        {props.lazyLoad && !previewing && (
          <img
            className="absolute top-0 left-0 size-full object-cover object-center"
            src={posterUrl}
            alt={`${episode.title} - YouTube thumbnail`}
            loading="lazy"
          />
        )}

        {previewing && (
          <PodcastVideoEmbedPlayButton title={episode.title} onClick={() => setPreviewing(false)} />
        )}

        {!previewing && (
          <iframe
            ref={iframeRef}
            src={iframeSrc}
            title={episode.title}
            width="560"
            height="315"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute top-0 right-0 left-0 m-0 block h-full w-full border-0 bg-black p-0 outline-0"
          />
        )}

        {!previewing && props.enableJSApi && props.debug && (
          <PodcastVideoEmbedDebugger youtubeUrl={youtubeUrl} />
        )}

        {Option.isSome(connectionError) && !previewing && (
          <div className="absolute top-3 right-3 left-3 z-4 rounded-lg border border-red-400/25 bg-red-950/80 px-3 py-2 text-xs text-red-100 shadow-lg backdrop-blur-sm">
            <p className="font-medium tracking-[0.16em] uppercase">youtube error</p>
            <p className="mt-1 text-red-50/90">{connectionError.value}</p>
          </div>
        )}

        {previewing && (
          <div
            className="pointer-events-none absolute inset-0 z-2 animate-pulse bg-black/10"
            aria-hidden="true"
          />
        )}
      </article>
    </React.Fragment>
  )
}

const getYouTubeEmbedUrl = (videoId: string): string => {
  const id = globalThis.encodeURIComponent(videoId)
  const url = new URL(`https://www.youtube.com/embed/${id}`)
  url.searchParams.set("enablejsapi", "1")
  url.searchParams.set("playsinline", "1")
  url.searchParams.set("rel", "0")
  return url.toString()
}
