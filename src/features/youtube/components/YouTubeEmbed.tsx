import { useAtom, useAtomSet, useAtomValue } from "@effect/atom-react"
import * as Option from "effect/Option"
import * as React from "react"
import { connectEmbedAtom, disconnectEmbedAtom } from "../atoms/controls"
import {
  connectionErrorAtom,
  iframeElementAtom,
  loadStateAtom,
  preconnectedAtom,
} from "../atoms/state"
import { YouTubeEmbedDebugPanel } from "./YouTubeEmbedDebugPanel"
import { YouTubeEmbedError } from "./YouTubeEmbedError"
import { YouTubeEmbedLoader } from "./YouTubeEmbedLoader"
import { YouTubeEmbedPosterContainer } from "./YouTubeEmbedPosterContainer"
import { YouTubePlayButton } from "./YouTubePlayButton"
import { YouTubePreconnectLinks } from "./YouTubePreconnectLinks"
import { YouTubeThumbnail } from "./YouTubeThumbnail"

export type YouTubePosterQuality =
  | "default"
  | "hqdefault"
  | "mqdefault"
  | "sddefault"
  | "maxresdefault"

export interface YouTubeEmbedProps {
  readonly id: string
  readonly title: string
  readonly className?: string | undefined
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

export function YouTubeEmbed(props: YouTubeEmbedProps) {
  const reactId = React.useId()
  const connectionId = React.useMemo(
    () => `${props.id}-${reactId.replace(/:/g, "")}`,
    [props.id, reactId],
  )
  const setIframeElement = useAtomSet(iframeElementAtom(connectionId))
  const connectEmbed = useAtomSet(connectEmbedAtom)
  const disconnectEmbed = useAtomSet(disconnectEmbedAtom)
  const connectionError = useAtomValue(connectionErrorAtom(connectionId))
  const [loadState, setLoadState] = useAtom(loadStateAtom(connectionId))
  const preconnected = useAtomValue(preconnectedAtom(connectionId))

  const isPreviewing = loadState === "previewing"
  const isLoading = loadState === "loading"

  const posterUrl = React.useMemo(() => {
    const id = globalThis.encodeURIComponent(props.id)
    const format = props.webp ? "webp" : "jpg"
    const vi = props.webp ? "vi_webp" : "vi"
    const poster = props.poster ?? "hqdefault"
    return `https://i.ytimg.com/${vi}/${id}/${poster}.${format}`
  }, [props.id, props.poster, props.webp])

  const youtubeUrl = React.useMemo(
    () => (props.cookie ? YOUTUBE_URL : YOUTUBE_NOCOOKIE_URL),
    [props.cookie],
  )

  const iframeSrc = React.useMemo(() => {
    const url = new URL(getYouTubeEmbedUrl(props.id))
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
  }, [props.autoplay, props.cookie, props.id, props.muted])

  const iframeRef = React.useCallback(
    (iframe: HTMLIFrameElement | null) => {
      if (iframe) {
        setIframeElement(Option.some(iframe))
        setLoadState("ready")
      } else {
        setIframeElement(Option.none())
      }
    },
    [setIframeElement],
  )

  React.useEffect(() => {
    if (isPreviewing || !props.enableJSApi || typeof window === "undefined") {
      return
    }

    connectEmbed({
      connectionId,
      targetOrigin: youtubeUrl,
      title: props.title,
      videoId: props.id,
    })

    return () => {
      disconnectEmbed(connectionId)
    }
  }, [connectEmbed, connectionId, disconnectEmbed, isPreviewing, props.enableJSApi, youtubeUrl])

  return (
    <React.Fragment>
      {!props.lazyLoad && <link rel="preload" href={posterUrl} as="image" />}

      {preconnected && <YouTubePreconnectLinks youtubeUrl={youtubeUrl} />}

      <YouTubeEmbedPosterContainer
        className={props.className}
        title={props.title}
        isPreviewing={isPreviewing}
        lazyLoad={props.lazyLoad}
        posterUrl={posterUrl}
      >
        {props.lazyLoad && isPreviewing && (
          <YouTubeThumbnail posterUrl={posterUrl} title={props.title} />
        )}

        {isPreviewing && <YouTubePlayButton id={connectionId} title={props.title} />}

        {!isPreviewing && (
          <iframe
            ref={iframeRef}
            src={iframeSrc}
            title={props.title}
            width="560"
            height="315"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute top-0 right-0 left-0 m-0 block h-full w-full border-0 bg-black p-0 outline-0"
          />
        )}

        {!isPreviewing && props.enableJSApi && props.debug && (
          <YouTubeEmbedDebugPanel id={connectionId} videoId={props.id} youtubeUrl={youtubeUrl} />
        )}

        {Option.isSome(connectionError) && !isPreviewing && (
          <YouTubeEmbedError error={connectionError.value} />
        )}

        {isLoading && <YouTubeEmbedLoader />}
      </YouTubeEmbedPosterContainer>
    </React.Fragment>
  )
}

const getYouTubeVideoId = (videoIdOrUrl: string): string => {
  try {
    const url = new URL(videoIdOrUrl)

    if (url.hostname === "youtu.be") {
      const id = url.pathname.replace(/^\//, "")
      return id.length > 0 ? id : videoIdOrUrl
    }

    if (url.hostname.includes("youtube.com")) {
      const id = url.searchParams.get("v")
      return id && id.length > 0 ? id : videoIdOrUrl
    }
  } catch {
    return videoIdOrUrl
  }

  return videoIdOrUrl
}

const getYouTubeEmbedUrl = (videoIdOrUrl: string): string => {
  const id = getYouTubeVideoId(videoIdOrUrl)
  const url = new URL(`https://www.youtube.com/embed/${id}`)
  url.searchParams.set("enablejsapi", "1")
  url.searchParams.set("playsinline", "1")
  url.searchParams.set("rel", "0")
  return url.toString()
}
