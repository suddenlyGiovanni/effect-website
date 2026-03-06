import { useAtomValue } from "@effect/atom-react"
import * as DateTime from "effect/DateTime"
import { motion } from "motion/react"
import * as React from "react"
import type { ExampleScheduleTimelineDefinition } from "@/lib/examples/constructors"
import type { VisualEffectState } from "@/lib/examples/domain"
import { cn } from "@/lib/utils"
import { stepStateAtom } from "@/services/VisualEffectManager"
import { useExampleState } from "./VisualEffectProvider"

const TIMELINE_CONFIG = {
  clearDelayMs: 300,
  cursorWidth: 3,
  dotSize: 12,
  height: 50,
  lineThickness: 3,
  scrollBuffer: 240,
  startOffset: 50,
  tickMarkSpacing: 50,
} as const

const TIMELINE_COLORS = {
  backgroundLine: "var(--color-zinc-700)",
  cursorActive: "var(--color-white)",
  cursorInactive: "var(--color-neutral-500)",
  gapActive: "var(--color-neutral-500)",
  gapInactive: "var(--color-neutral-600)",
  runningActive: "var(--color-blue-400)",
  runningInactive: "var(--color-blue-500)",
  tickMark: "var(--color-zinc-700)",
} as const

type ScheduleSegmentKind = "running" | "gap"

interface ScheduleSegment {
  readonly id: string
  readonly kind: ScheduleSegmentKind
  readonly startedAtMs: number
  readonly endedAtMs: number | undefined
}

interface ScheduleTimelineSession {
  readonly runStartedAtMs: number
  readonly segments: ReadonlyArray<ScheduleSegment>
  readonly clearing: boolean
}

export function VisualEffectScheduleTimeline({
  config,
}: {
  readonly config: ExampleScheduleTimelineDefinition
}) {
  const exampleState = useExampleState()
  const attemptState = useAtomValue(stepStateAtom(config.attemptStep))
  const containerReference = React.useRef<HTMLDivElement | null>(null)
  const clearTimeoutReference = React.useRef<number | undefined>(undefined)
  const sessionStartReference = React.useRef<number | null>(null)
  const activeSegmentKindReference = React.useRef<ScheduleSegmentKind | null>(null)
  const [containerWidth, setContainerWidth] = React.useState(0)
  const [nowMs, setNowMs] = React.useState(() => Date.now())
  const [session, setSession] = React.useState<ScheduleTimelineSession | null>(null)

  React.useEffect(() => {
    const container = containerReference.current

    if (container === null) {
      return
    }

    const updateWidth = () => {
      setContainerWidth(container.offsetWidth)
    }

    updateWidth()

    const observer = new ResizeObserver(updateWidth)
    observer.observe(container)

    return () => {
      observer.disconnect()
    }
  }, [])

  React.useEffect(() => {
    if (exampleState._tag !== "Running") {
      return
    }

    let frame = 0

    const tick = () => {
      setNowMs(Date.now())
      frame = requestAnimationFrame(tick)
    }

    tick()

    return () => {
      cancelAnimationFrame(frame)
    }
  }, [exampleState._tag])

  React.useEffect(() => {
    return () => {
      const clearTimeout = clearTimeoutReference.current

      if (clearTimeout !== undefined) {
        window.clearTimeout(clearTimeout)
      }
    }
  }, [])

  React.useEffect(() => {
    if (exampleState._tag === "Running") {
      const nextRunStartedAtMs = DateTime.toEpochMillis(exampleState.startedAt)
      const activeClearTimeout = clearTimeoutReference.current

      if (activeClearTimeout !== undefined) {
        window.clearTimeout(activeClearTimeout)
        clearTimeoutReference.current = undefined
      }

      if (sessionStartReference.current !== nextRunStartedAtMs) {
        // Timeline history is intentionally local UI state. Starting a fresh run
        // must drop any prior trail so a new retry/repeat session is visually isolated.
        sessionStartReference.current = nextRunStartedAtMs
        activeSegmentKindReference.current = null
        setSession({
          runStartedAtMs: nextRunStartedAtMs,
          segments: [],
          clearing: false,
        })
      } else {
        setSession((current) =>
          current === null || current.clearing === false ? current : { ...current, clearing: false },
        )
      }

      return
    }

    if (exampleState._tag !== "Idle" || session === null || clearTimeoutReference.current !== undefined) {
      return
    }

    setSession((current) => (current === null ? null : { ...current, clearing: true }))

    clearTimeoutReference.current = window.setTimeout(() => {
      sessionStartReference.current = null
      activeSegmentKindReference.current = null
      clearTimeoutReference.current = undefined
      setSession(null)
    }, TIMELINE_CONFIG.clearDelayMs)
  }, [exampleState, session])

  const closeActiveSegment = React.useCallback((endedAtMs: number) => {
    setSession((current) => {
      if (current === null || current.segments.length === 0) {
        return current
      }

      const lastSegment = current.segments[current.segments.length - 1]

      if (lastSegment === undefined || lastSegment.endedAtMs !== undefined) {
        return current
      }

      if (endedAtMs <= lastSegment.startedAtMs) {
        return {
          ...current,
          segments: current.segments.slice(0, -1),
        }
      }

      return {
        ...current,
        segments: [
          ...current.segments.slice(0, -1),
          {
            ...lastSegment,
            endedAtMs,
          },
        ],
      }
    })
  }, [])

  const openSegment = React.useCallback((kind: ScheduleSegmentKind, startedAtMs: number) => {
    setSession((current) => {
      if (current === null) {
        return current
      }

      const lastSegment = current.segments[current.segments.length - 1]

      if (lastSegment !== undefined && lastSegment.endedAtMs === undefined && lastSegment.kind === kind) {
        return current
      }

      return {
        ...current,
        segments: [
          ...current.segments,
          {
            id: crypto.randomUUID(),
            kind,
            startedAtMs: Math.max(startedAtMs, current.runStartedAtMs),
            endedAtMs: undefined,
          },
        ],
      }
    })
  }, [])

  React.useEffect(() => {
    const runStartedAtMs = sessionStartReference.current

    if (session === null || runStartedAtMs === null) {
      return
    }

    const nextMode = getTimelineMode(exampleState, attemptState)
    const previousMode = activeSegmentKindReference.current

    if (previousMode === nextMode) {
      return
    }

    const transitionAtMs = getTransitionTimeMs({
      attemptState,
      exampleState,
      nextMode,
      previousMode,
      runStartedAtMs,
    })

    if (previousMode !== null) {
      closeActiveSegment(transitionAtMs)
    }

    if (nextMode !== null) {
      openSegment(nextMode, transitionAtMs)
    }

    activeSegmentKindReference.current = nextMode
  }, [attemptState, closeActiveSegment, exampleState, openSegment, session])

  if (session === null) {
    return null
  }

  const timelineTimeMs =
    exampleState._tag === "Running"
      ? nowMs
      : getStateEndedAtMs(exampleState) ?? getSessionEndMs(session)

  const cursorX = toTimelineX(timelineTimeMs, session.runStartedAtMs, config.pixelsPerSecond)
  const scrollOffset =
    containerWidth === 0
      ? 0
      : Math.max(0, cursorX - containerWidth * config.scrollThreshold)
  const totalWidth = containerWidth + scrollOffset + TIMELINE_CONFIG.scrollBuffer
  const tickCount = Math.max(0, Math.ceil(totalWidth / TIMELINE_CONFIG.tickMarkSpacing))
  const renderedSegments = session.segments.map((segment) => ({
    ...segment,
    endX: toTimelineX(
      segment.endedAtMs ?? timelineTimeMs,
      session.runStartedAtMs,
      config.pixelsPerSecond,
    ),
    startX: toTimelineX(segment.startedAtMs, session.runStartedAtMs, config.pixelsPerSecond),
  }))

  return (
    <div className="border-b border-zinc-800 bg-zinc-950/80 px-6 py-4">
      <div ref={containerReference} className="relative w-full overflow-hidden" style={{ height: TIMELINE_CONFIG.height }}>
        <div
          className="absolute right-0 left-0"
          style={{
            height: TIMELINE_CONFIG.lineThickness,
            top: "50%",
            transform: "translateY(-50%)",
            backgroundColor: TIMELINE_COLORS.backgroundLine,
            opacity: session.clearing ? 0 : 1,
          }}
        />

        {Array.from({ length: tickCount }, (_, index) => {
          const x = (index + 1) * TIMELINE_CONFIG.tickMarkSpacing - scrollOffset

          return (
            <div
              key={`tick-${index.toString()}`}
              className="pointer-events-none absolute top-0 bottom-0"
              style={{
                left: `${x}px`,
                width: 1,
                backgroundColor: TIMELINE_COLORS.tickMark,
                opacity: session.clearing ? 0 : 1,
              }}
            />
          )
        })}

        {renderedSegments.map((segment) => {
          const left = segment.startX - scrollOffset
          const width = Math.max(0, segment.endX - segment.startX)
          const isActive = segment.endedAtMs === undefined && exampleState._tag === "Running"
          const lineColor =
            segment.kind === "running"
              ? isActive
                ? TIMELINE_COLORS.runningActive
                : TIMELINE_COLORS.runningInactive
              : isActive
                ? TIMELINE_COLORS.gapActive
                : TIMELINE_COLORS.gapInactive

          const durationMs = (segment.endedAtMs ?? timelineTimeMs) - segment.startedAtMs

          return (
            <React.Fragment key={segment.id}>
              <motion.div
                className={cn("absolute", segment.kind === "gap" && "rounded-full")}
                style={{
                  left: `${left}px`,
                  width: `${width}px`,
                  height: TIMELINE_CONFIG.lineThickness,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
                animate={{
                  backgroundColor: lineColor,
                  opacity: session.clearing ? 0 : 1,
                  width: `${width}px`,
                }}
                transition={{
                  backgroundColor: { duration: 0.24, ease: "easeOut" },
                  opacity: { duration: 0.3, ease: "easeInOut" },
                  width: { duration: 0 },
                }}
              />

              {segment.kind === "running" && (
                <motion.div
                  className="absolute rounded-full"
                  style={{
                    left: `${left - TIMELINE_CONFIG.dotSize / 2}px`,
                    width: TIMELINE_CONFIG.dotSize,
                    height: TIMELINE_CONFIG.dotSize,
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    backgroundColor: lineColor,
                    opacity: session.clearing ? 0 : 1,
                    scale: 1,
                  }}
                  transition={{
                    backgroundColor: { duration: 0.24, ease: "easeOut" },
                    opacity: { duration: 0.3, ease: "easeInOut" },
                    scale: { type: "spring", bounce: 0.35, visualDuration: 0.4 },
                  }}
                />
              )}

              {segment.kind === "running" && segment.endedAtMs !== undefined && width > 0 && (
                <motion.div
                  className="absolute rounded-full"
                  style={{
                    left: `${left + width - TIMELINE_CONFIG.dotSize / 2}px`,
                    width: TIMELINE_CONFIG.dotSize,
                    height: TIMELINE_CONFIG.dotSize,
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    backgroundColor: TIMELINE_COLORS.runningInactive,
                    opacity: session.clearing ? 0 : 1,
                    scale: 1,
                  }}
                  transition={{
                    backgroundColor: { duration: 0.24, ease: "easeOut" },
                    opacity: { duration: 0.3, ease: "easeInOut" },
                    scale: { type: "spring", bounce: 0.35, visualDuration: 0.4 },
                  }}
                />
              )}

              {segment.kind === "gap" && width > 56 && durationMs > 0 && (
                <div
                  className="pointer-events-none absolute"
                  style={{
                    left: `${left + width / 2}px`,
                    top: `${TIMELINE_CONFIG.height / 2}px`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <motion.div
                    className="rounded border border-neutral-700 bg-neutral-900/90 px-2 py-0.5 font-mono text-xs text-neutral-300 whitespace-nowrap"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{
                      opacity: session.clearing ? 0 : 1,
                      scale: 1,
                    }}
                    transition={{
                      opacity: { duration: 0.2, ease: "easeOut" },
                      scale: { duration: 0.2, ease: "easeOut" },
                    }}
                  >
                    {formatDuration(durationMs)}
                  </motion.div>
                </div>
              )}
            </React.Fragment>
          )
        })}

        <motion.div
          className="absolute top-0 bottom-0"
          style={{
            width: TIMELINE_CONFIG.cursorWidth,
          }}
          animate={{
            backgroundColor:
              exampleState._tag === "Running"
                ? TIMELINE_COLORS.cursorActive
                : TIMELINE_COLORS.cursorInactive,
            left: `${cursorX - scrollOffset}px`,
            opacity: session.clearing ? 0 : 1,
          }}
          transition={{
            backgroundColor: { duration: 0.24, ease: "easeOut" },
            left: {
              duration: exampleState._tag === "Running" ? 0.05 : 0.16,
              ease: "linear",
            },
            opacity: { duration: 0.3, ease: "easeInOut" },
          }}
        />
      </div>
    </div>
  )
}

const formatDuration = (durationMs: number): string => `${Math.max(0, Math.round(durationMs))}ms`

const getTimelineMode = (
  exampleState: VisualEffectState,
  attemptState: VisualEffectState,
): ScheduleSegmentKind | null => {
  if (exampleState._tag !== "Running") {
    return null
  }

  return attemptState._tag === "Running" ? "running" : "gap"
}

const getTransitionTimeMs = ({
  attemptState,
  exampleState,
  nextMode,
  previousMode,
  runStartedAtMs,
}: {
  readonly attemptState: VisualEffectState
  readonly exampleState: VisualEffectState
  readonly nextMode: ScheduleSegmentKind | null
  readonly previousMode: ScheduleSegmentKind | null
  readonly runStartedAtMs: number
}): number => {
  if (nextMode === "running" && attemptState._tag === "Running") {
    return DateTime.toEpochMillis(attemptState.startedAt)
  }

  if (nextMode === "gap") {
    if (previousMode === "running") {
      return getStateEndedAtMs(attemptState) ?? Date.now()
    }

    if (exampleState._tag === "Running") {
      return DateTime.toEpochMillis(exampleState.startedAt)
    }
  }

  if (nextMode === null) {
    return getStateEndedAtMs(exampleState) ?? Date.now()
  }

  return runStartedAtMs
}

const getStateEndedAtMs = (state: VisualEffectState): number | undefined => {
  switch (state._tag) {
    case "Succeeded":
    case "Failed":
    case "Interrupted":
    case "Died":
      return DateTime.toEpochMillis(state.endedAt)
    default:
      return undefined
  }
}

const getSessionEndMs = (session: ScheduleTimelineSession): number => {
  const lastSegment = session.segments[session.segments.length - 1]

  if (lastSegment === undefined) {
    return session.runStartedAtMs
  }

  return lastSegment.endedAtMs ?? lastSegment.startedAtMs
}

const toTimelineX = (timeMs: number, runStartedAtMs: number, pixelsPerSecond: number): number => {
  return TIMELINE_CONFIG.startOffset + ((timeMs - runStartedAtMs) / 1000) * pixelsPerSecond
}
