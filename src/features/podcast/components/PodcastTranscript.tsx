import { useAtomSet, useAtomValue } from "@effect/atom-react"
import * as Clock from "effect/Clock"
import * as Effect from "effect/Effect"
import * as Schedule from "effect/Schedule"
import * as Atom from "effect/unstable/reactivity/Atom"
import { ChevronDownIcon } from "lucide-react"
import * as React from "react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  EmbedCommand,
  EmbedState,
  getPlaybackTimeSeconds,
  useEmbedManager,
} from "@/features/youtube-embed"
import { cn } from "@/lib/utils"
import type { PodcastTranscriptCue, TranscriptFollowMode } from "../domain"
import { usePodcastEpisode } from "../context"

const AUTO_SCROLL_SETTLE_DELAY_MS = 150
const AUTO_FOLLOW_RESUME_DELAY_MS = "5 seconds"

const isDesktopViewportAtom = Atom.make((get) => {
  if (typeof window === "undefined") {
    return
  }

  const mediaQuery = window.matchMedia("(min-width: 1024px)")
  const syncDesktop = () => {
    get.setSelf(mediaQuery.matches)
  }

  mediaQuery.addEventListener("change", syncDesktop)
  get.addFinalizer(() => mediaQuery.removeEventListener("change", syncDesktop))

  return mediaQuery.matches
})

export function PodcastTranscript() {
  const { transcript } = usePodcastEpisode()
  const embedManager = useEmbedManager()

  const rootRef = React.useRef<HTMLDivElement | null>(null)
  const cueElementMapRef = React.useRef(new Map<string, HTMLButtonElement>())
  const suppressScrollEventRef = React.useRef(false)
  const suppressScrollTimeoutRef = React.useRef<number | undefined>(undefined)
  const [isOpen, setIsOpen] = React.useState(true)

  const {
    activeTranscriptCueAtom,
    setActiveTranscriptCueAtom,
    shouldAutoFollowAtom,
    pauseAutoFollowAtom,
    resumeAutoFollowAtom,
  } = React.useMemo(() => {
    const autoFollowModeAtom = Atom.make<TranscriptFollowMode>("auto")

    const autoFollowPauseTokenAtom = Atom.make(0)

    const transcriptCueAtomReadonly = Atom.readable((get) => {
      const state = get(embedManager.stateAtom)
      return getActiveTranscriptCue(transcript, state)
    })

    const activeTranscriptCueAtom = Atom.optimistic(transcriptCueAtomReadonly)

    const pauseAutoFollowAtom = Atom.fn<void>()(
      Effect.fnUntraced(function* (_, get) {
        const token = get(autoFollowPauseTokenAtom) + 1
        get.set(autoFollowPauseTokenAtom, token)
        get.set(autoFollowModeAtom, "paused-by-user")
        yield* Effect.sleep(AUTO_FOLLOW_RESUME_DELAY_MS)
        if (get(autoFollowPauseTokenAtom) !== token) {
          return
        }
        get.set(autoFollowModeAtom, "auto")
      }),
      { concurrent: true },
    )

    const resumeAutoFollowAtom = Atom.fn<void>()((_, get) => {
      const token = get(autoFollowPauseTokenAtom) + 1
      get.set(autoFollowPauseTokenAtom, token)
      get.set(autoFollowModeAtom, "auto")
      return Effect.void
    })

    const shouldAutoFollowAtom = Atom.readable((get) => {
      return get(isDesktopViewportAtom) && get(autoFollowModeAtom) === "auto"
    })

    const setActiveTranscriptCueAtom = Atom.fn<PodcastTranscriptCue>()(
      Effect.fnUntraced(function* (cue, get) {
        const token = get(autoFollowPauseTokenAtom) + 1
        get.set(autoFollowPauseTokenAtom, token)
        get.set(autoFollowModeAtom, "auto")

        get.set(embedManager.previewAtom, false)

        const command = new EmbedCommand.cases.seekTo({
          args: [cue.startTimeSeconds, true],
        })
        get.set(embedManager.stateAtom, command)

        yield* Effect.sync(() => get(transcriptCueAtomReadonly)).pipe(
          Effect.filterOrFail(
            (actualCue) => actualCue?.id === cue.id,
            () => "unconfirmed_update" as const,
          ),
          Effect.retry({
            while: (error) => error === "unconfirmed_update",
            schedule: Schedule.spaced("100 millis"),
          }),
          Effect.ignore,
        )
      }),
    )

    return {
      activeTranscriptCueAtom,
      setActiveTranscriptCueAtom,
      shouldAutoFollowAtom,
      pauseAutoFollowAtom,
      resumeAutoFollowAtom,
    } as const
  }, [transcript, embedManager])

  const activeTranscriptCue = useAtomValue(activeTranscriptCueAtom)
  const setActiveTranscriptCue = useAtomSet(setActiveTranscriptCueAtom)
  const shouldAutoFollow = useAtomValue(shouldAutoFollowAtom)
  const pauseAutoFollow = useAtomSet(pauseAutoFollowAtom)
  const resumeAutoFollow = useAtomSet(resumeAutoFollowAtom)

  const activeCueId = activeTranscriptCue?.id ?? transcript[0]?.id

  const clearSuppressScrollTimeout = React.useCallback(() => {
    if (suppressScrollTimeoutRef.current !== undefined) {
      window.clearTimeout(suppressScrollTimeoutRef.current)
      suppressScrollTimeoutRef.current = undefined
    }
  }, [])

  const scheduleSuppressScrollRelease = React.useCallback(() => {
    clearSuppressScrollTimeout()
    suppressScrollTimeoutRef.current = window.setTimeout(() => {
      suppressScrollEventRef.current = false
      suppressScrollTimeoutRef.current = undefined
    }, AUTO_SCROLL_SETTLE_DELAY_MS)
  }, [clearSuppressScrollTimeout])

  const handleSeek = React.useCallback(
    (cue: PodcastTranscriptCue) => {
      resumeAutoFollow()
      setActiveTranscriptCue(cue)
    },
    [resumeAutoFollow, setActiveTranscriptCue],
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
      if (suppressScrollEventRef.current) {
        scheduleSuppressScrollRelease()
        return
      }
      pauseAutoFollow()
    }

    viewport.addEventListener("scroll", handleScroll, { passive: true })

    return () => viewport.removeEventListener("scroll", handleScroll)
  }, [pauseAutoFollow, scheduleSuppressScrollRelease])

  React.useEffect(() => {
    if (
      !isOpen ||
      !shouldAutoFollow ||
      activeCueId === undefined ||
      typeof window === "undefined"
    ) {
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
    scheduleSuppressScrollRelease()

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const viewportRect = viewport.getBoundingClientRect()
    const elementRect = element.getBoundingClientRect()
    const elementTop = elementRect.top - viewportRect.top + viewport.scrollTop
    const targetTop = Math.max(0, elementTop - viewport.clientHeight / 2 + elementRect.height / 2)

    viewport.scrollTo({
      top: targetTop,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    })

    return () => {
      clearSuppressScrollTimeout()
      suppressScrollEventRef.current = false
    }
  }, [
    activeCueId,
    clearSuppressScrollTimeout,
    isOpen,
    scheduleSuppressScrollRelease,
    shouldAutoFollow,
  ])

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="rounded-lg border border-zinc-700 bg-card"
    >
      <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between rounded-lg bg-card px-4 py-3 transition-colors hover:bg-accent/50 data-panel-open:rounded-b-none">
        <h2 className="text-sm font-semibold">Transcript</h2>
        <ChevronDownIcon className="size-4 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div ref={rootRef} className="border-t bg-card">
          <ScrollArea className="h-80 p-2 lg:max-h-[min(20rem,40vh)]">
            <ul className="space-y-1 pr-2">
              {transcript.map((cue) => {
                const isActive = cue === activeTranscriptCue

                return (
                  <li key={cue.id} className="list-none">
                    <button
                      ref={(element) => setCueElement(cue.id, element)}
                      type="button"
                      onClick={() => handleSeek(cue)}
                      aria-current={isActive ? "true" : undefined}
                      aria-label={`Jump to ${cue.label}`}
                      className={cn(
                        "group flex w-full cursor-pointer items-baseline gap-4 rounded-md bg-inherit px-3 py-2.5 text-left hover:bg-accent/50",
                        isActive && "bg-accent",
                      )}
                    >
                      <code className="shrink-0 font-mono text-xs leading-relaxed text-muted-foreground">
                        {cue.label}
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

const getActiveTranscriptCue = (
  chapters: ReadonlyArray<PodcastTranscriptCue>,
  state: EmbedState,
): PodcastTranscriptCue | undefined => {
  // When the embed is inactive the first cue is the "active" one
  if (state._tag !== "Active") {
    return chapters[0]
  }

  const currentTimeSeconds = getPlaybackTimeSeconds(state.playback)

  // If the current playback time is not defined, the video has not started
  // so again the first cue is the "active" one - this is mostly a defensive
  // check, as an active embed state should always have a current playback time
  if (!currentTimeSeconds) {
    return chapters[0]
  }

  // The "active" cue is the cue where the current playback time falls within
  // the bounds of the cue
  const activeCue = chapters.find((cue) => {
    return cue.startTimeSeconds <= currentTimeSeconds && currentTimeSeconds < cue.endTimeSeconds
  })

  return activeCue ?? chapters[0]
}
