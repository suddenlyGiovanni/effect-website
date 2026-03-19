import * as Option from "effect/Option"
import * as Atom from "effect/unstable/reactivity/Atom"
import { ChevronDownIcon } from "lucide-react"
import * as React from "react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { PodcastTranscriptCue } from "../domain"
import {
  useActiveTranscriptCue,
  usePauseAutoScroll,
  usePodcastEpisode,
  useSeekToCue,
  useSetPreconnected,
} from "./PodcastEpisodeProvider"

const scrollElementAtom = Atom.make(Option.none<HTMLElement>())

const scrollListenerAtom = Atom.make((get) => {
  const element = get(scrollElementAtom)
})

export function PodcastTranscript({
  bodyClassName,
  className,
  panelClassName,
  scrollAreaClassName,
}: {
  readonly bodyClassName?: string | undefined
  readonly className?: string | undefined
  readonly panelClassName?: string | undefined
  readonly scrollAreaClassName?: string | undefined
}) {
  const episode = usePodcastEpisode()
  const setPreconnected = useSetPreconnected()
  const activeTranscriptCue = useActiveTranscriptCue()
  const seekToCue = useSeekToCue()
  const pauseAutoScroll = usePauseAutoScroll()

  const handleSeek = React.useCallback(
    (cue: PodcastTranscriptCue) => {
      seekToCue(cue)
    },
    [seekToCue],
  )

  const handlePreconnect = React.useCallback(() => {
    setPreconnected((preconnected) => {
      if (preconnected) return preconnected
      return true
    })
  }, [setPreconnected])

  const rootRef = React.useCallback(
    (root: HTMLElement | null) => {
      if (!root) {
        return
      }

      const viewport = root.querySelector('[data-slot="scroll-area-viewport"]')

      if (!(viewport instanceof HTMLElement)) {
        return
      }

      const handleScroll = () => {
        pauseAutoScroll()
      }

      viewport.addEventListener("scroll", handleScroll, { passive: true })

      return () => {
        viewport.removeEventListener("scroll", handleScroll)
      }
    },
    [pauseAutoScroll],
  )

  // const activeCue = useAtomValue(activeTranscriptCueAtom(playerId))
  // const setPendingPlaybackIntent = useAtomSet(pendingPlaybackIntentAtom(playerId))
  // const [followMode, setFollowMode] = useAtom(transcriptFollowModeAtom(playerId))
  // const [lastUserScrollAt, setLastUserScrollAt] = useAtom(lastTranscriptUserScrollAtAtom(playerId))
  // const shouldAutoFollow = useAtomValue(shouldAutoFollowTranscriptAtom(playerId))
  // const [preconnected, setPreconnected] = useAtom(preconnectedAtom(playerId))
  // const rootRef = React.useRef<HTMLDivElement | null>(null)
  // const cueElementMapRef = React.useRef(new Map<string, HTMLButtonElement>())
  // const suppressScrollEventRef = React.useRef(false)
  // const activeCueId = Option.match(activeCue, {
  //   onNone: () => transcript[0]?.id,
  //   onSome: (cue) => cue.id,
  // })

  // React.useEffect(() => {
  //   if (!shouldAutoFollow || !activeCueId) {
  //     return
  //   }
  //
  //   if (typeof window === "undefined") {
  //     return
  //   }
  //
  //   if (window.matchMedia("(max-width: 1023px)").matches) {
  //     return
  //   }
  //
  //   const element = cueElementMapRef.current.get(activeCueId)
  //   const root = rootRef.current
  //
  //   if (!element || !root) {
  //     return
  //   }
  //
  //   const viewport = root.querySelector('[data-slot="scroll-area-viewport"]')
  //
  //   if (!(viewport instanceof HTMLElement)) {
  //     return
  //   }
  //
  //   suppressScrollEventRef.current = true
  //   const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  //   const viewportRect = viewport.getBoundingClientRect()
  //   const elementRect = element.getBoundingClientRect()
  //   const elementTop = elementRect.top - viewportRect.top + viewport.scrollTop
  //   const targetTop = Math.max(0, elementTop - viewport.clientHeight / 2 + elementRect.height / 2)
  //
  //   viewport.scrollTo({
  //     top: targetTop,
  //     behavior: prefersReducedMotion ? "auto" : "smooth",
  //   })
  //
  //   const timeout = window.setTimeout(() => {
  //     suppressScrollEventRef.current = false
  //   }, 250)
  //
  //   return () => {
  //     window.clearTimeout(timeout)
  //     suppressScrollEventRef.current = false
  //   }
  // }, [activeCueId, shouldAutoFollow])
  //
  // const setCueElement = React.useCallback((cueId: string, element: HTMLButtonElement | null) => {
  //   if (element) {
  //     cueElementMapRef.current.set(cueId, element)
  //     return
  //   }
  //
  //   cueElementMapRef.current.delete(cueId)
  // }, [])

  return (
    <Collapsible
      defaultOpen={true}
      className={cn("rounded-lg border border-zinc-700 bg-card", className)}
    >
      <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between rounded-lg bg-card px-4 py-3 transition-colors hover:bg-accent/50 data-panel-open:rounded-b-none">
        <h2 className="text-sm font-semibold">Transcript</h2>
        <ChevronDownIcon className="size-4 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className={panelClassName}>
        <div ref={rootRef} className={cn("border-t bg-card", bodyClassName)}>
          <ScrollArea className={cn("h-[400px] p-2", scrollAreaClassName)}>
            <ul className="space-y-1 pr-2">
              {episode.transcript.map((cue) => {
                const isActive = cue === activeTranscriptCue
                return (
                  <li key={cue.id} className="list-none">
                    <button
                      // ref={(element) => setCueElement(segment.id, element)}
                      onClick={() => handleSeek(cue)}
                      onFocus={handlePreconnect}
                      onPointerOver={handlePreconnect}
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
