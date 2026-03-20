import { ChevronDownIcon } from "lucide-react"
import * as React from "react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { PodcastTranscriptCue } from "../domain"
import { useEmbedState } from "../context/EmbedManagerContext"
import { usePodcastEpisode } from "../context/PodcastEpisodeContext"
import {
  useActiveTranscriptCue,
  usePauseAutoScroll,
  useResumeAutoScroll,
  useSeekToCue,
  useShouldAutoFollowTranscript,
} from "../context/PodcastTranscriptContext"

export function PodcastTranscript() {
  const episode = usePodcastEpisode()
  const embedState = useEmbedState()
  const activeTranscriptCue = useActiveTranscriptCue()
  const seekToCue = useSeekToCue()
  const pauseAutoScroll = usePauseAutoScroll()
  const resumeAutoScroll = useResumeAutoScroll()
  const shouldAutoFollowTranscript = useShouldAutoFollowTranscript()
  const rootRef = React.useRef<HTMLDivElement | null>(null)
  const cueElementMapRef = React.useRef(new Map<string, HTMLButtonElement>())
  const suppressScrollEventRef = React.useRef(false)
  const activeCueId = activeTranscriptCue?.id ?? episode.transcript[0]?.id

  const handleSeek = React.useCallback(
    (cue: PodcastTranscriptCue) => {
      if (embedState._tag !== "Active") return
      resumeAutoScroll()
      seekToCue(cue)
    },
    [embedState, resumeAutoScroll, seekToCue],
  )

  const setCueElement = React.useCallback((cueId: string, element: HTMLButtonElement | null) => {
    if (element) {
      cueElementMapRef.current.set(cueId, element)
    } else {
      cueElementMapRef.current.delete(cueId)
    }
  }, [])

  React.useEffect(() => {
    const root = rootRef.current

    if (root === null) {
      return
    }

    const viewport = root.querySelector('[data-slot="scroll-area-viewport"]')

    if (!(viewport instanceof HTMLElement)) {
      return
    }

    const handleScroll = () => {
      if (suppressScrollEventRef.current) return
      pauseAutoScroll()
    }

    viewport.addEventListener("scroll", handleScroll, { passive: true })

    return () => viewport.removeEventListener("scroll", handleScroll)
  }, [pauseAutoScroll])

  React.useEffect(() => {
    if (!shouldAutoFollowTranscript || activeCueId === undefined || typeof window === "undefined") {
      return
    }

    const element = cueElementMapRef.current.get(activeCueId)
    const root = rootRef.current

    if (!element || !root) {
      return
    }

    const viewport = root.querySelector('[data-slot="scroll-area-viewport"]')

    if (!(viewport instanceof HTMLElement)) {
      return
    }

    suppressScrollEventRef.current = true

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const viewportRect = viewport.getBoundingClientRect()
    const elementRect = element.getBoundingClientRect()
    const elementTop = elementRect.top - viewportRect.top + viewport.scrollTop
    const targetTop = Math.max(0, elementTop - viewport.clientHeight / 2 + elementRect.height / 2)

    viewport.scrollTo({
      top: targetTop,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    })

    const timeout = window.setTimeout(() => {
      suppressScrollEventRef.current = false
    }, 250)

    return () => {
      window.clearTimeout(timeout)
      suppressScrollEventRef.current = false
    }
  }, [activeCueId, shouldAutoFollowTranscript])

  return (
    <Collapsible defaultOpen={true} className="rounded-lg border border-zinc-700 bg-card">
      <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between rounded-lg bg-card px-4 py-3 transition-colors hover:bg-accent/50 data-panel-open:rounded-b-none">
        <h2 className="text-sm font-semibold">Transcript</h2>
        <ChevronDownIcon className="size-4 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div ref={rootRef} className="border-t bg-card">
          <ScrollArea className="h-80 p-2 lg:max-h-[min(20rem,40vh)]">
            <ul className="space-y-1 pr-2">
              {episode.transcript.map((cue) => {
                const isActive = cue === activeTranscriptCue

                return (
                  <li key={cue.id} className="list-none">
                    <button
                      ref={(element) => setCueElement(cue.id, element)}
                      type="button"
                      onClick={() => handleSeek(cue)}
                      aria-current={isActive ? "true" : undefined}
                      aria-label={`Jump to ${cue.startLabel}`}
                      className={cn(
                        "group flex w-full cursor-pointer items-baseline gap-4 rounded-md bg-inherit px-3 py-2.5 text-left hover:bg-accent/50",
                        isActive && "bg-accent",
                      )}
                    >
                      <code className="shrink-0 font-mono text-xs leading-relaxed text-muted-foreground">
                        {cue.startLabel}
                      </code>
                      <span
                        className={cn(
                          "min-w-0 flex-1 text-sm leading-relaxed text-zinc-300",
                          isActive
                            ? "text-foreground"
                            : "text-muted-foreground group-hover:text-foreground",
                        )}
                      >
                        {cue.text}
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
