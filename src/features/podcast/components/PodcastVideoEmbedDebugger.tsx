import * as React from "react"
import { cn } from "@/lib/utils"
import {
  useDebugSnapshot,
  usePlayerSnapshot,
  usePodcastEpisode,
  useVideoEmbedConnectionPhase,
  useVideoEmbedControls,
} from "./PodcastEpisodeProvider"

export function PodcastVideoEmbedDebugger({ youtubeUrl }: { readonly youtubeUrl: string }) {
  const episode = usePodcastEpisode()
  const connectionPhase = useVideoEmbedConnectionPhase()
  const snapshot = usePlayerSnapshot()
  const debugSnapshot = useDebugSnapshot()
  const { play, pause } = useVideoEmbedControls()
  const [minimized, setMinimized] = React.useState(false)

  const handleMinimize = React.useCallback(() => {
    setMinimized((minimized) => !minimized)
  }, [setMinimized])

  const handlePlayVideo = React.useCallback(() => {
    play()
  }, [play])

  const handlePauseVideo = React.useCallback(() => {
    pause()
  }, [pause])

  return (
    <div className="pointer-events-none absolute right-3 bottom-3 left-3 z-3 flex flex-col gap-3 rounded-xl border border-white/10 bg-black/70 px-3 py-2 font-mono text-[11px] tracking-[0.12em] text-white/75 uppercase shadow-lg backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "inline-flex size-2 rounded-full",
              connectionPhase === "connected" && "bg-emerald-400",
              connectionPhase === "connecting" && "bg-amber-300",
              connectionPhase === "error" && "bg-red-400",
              connectionPhase === "idle" && "bg-white/35",
            )}
          />
          <span>{connectionPhase === "connected" ? "yt linked" : connectionPhase}</span>
          <span>{snapshot.status}</span>
          <span>{formatSeconds(snapshot.currentTime)}</span>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            className="rounded-md border border-white/12 bg-white/8 px-2 py-1 text-[10px] text-white transition-colors hover:bg-white/14"
            onClick={handleMinimize}
          >
            {minimized ? "maximize" : "minimize"}
          </button>
          <button
            type="button"
            className="rounded-md border border-white/12 bg-white/8 px-2 py-1 text-[10px] text-white transition-colors hover:bg-white/14 disabled:opacity-50"
            disabled={connectionPhase !== "connected"}
            onClick={handlePlayVideo}
          >
            play
          </button>
          <button
            type="button"
            className="rounded-md border border-white/12 bg-white/8 px-2 py-1 text-[10px] text-white transition-colors hover:bg-white/14 disabled:opacity-50"
            disabled={connectionPhase !== "connected"}
            onClick={handlePauseVideo}
          >
            pause
          </button>
        </div>
      </div>

      {!minimized && (
        <React.Fragment>
          <div className="grid gap-1 text-[10px] tracking-[0.08em] text-white/65 md:grid-cols-2">
            <span>video: {snapshot.videoId || episode.youtube.id}</span>
            <span>events: {debugSnapshot.eventCount}</span>
            <span>last-event: {debugSnapshot.lastEvent}</span>
            <span>last-command: {debugSnapshot.lastCommand}</span>
            <span>last-player-state: {debugSnapshot.lastPlayerState ?? "none"}</span>
            <span>origin: {youtubeUrl}</span>
          </div>

          {debugSnapshot.lastRawInfo.length > 0 && (
            <pre className="overflow-x-auto rounded-md border border-white/8 bg-black/35 px-2 py-2 text-[10px] tracking-normal text-white/70 normal-case">
              {debugSnapshot.lastRawInfo}
            </pre>
          )}
        </React.Fragment>
      )}
    </div>
  )
}

const formatSeconds = (seconds: number) => {
  const normalizedSeconds = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0
  const minutes = Math.floor(normalizedSeconds / 60)
  const remainder = normalizedSeconds % 60
  return `${minutes}:${String(remainder).padStart(2, "0")}`
}
