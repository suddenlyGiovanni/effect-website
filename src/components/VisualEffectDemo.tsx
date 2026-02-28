// ─── VisualEffectDemo.tsx ─────────────────────────────────────────────────────
// Single-file prototype: VisualEffect core + React hooks + demo UI.
// Drop into an Astro page with `client:load` to test.
// ─────────────────────────────────────────────────────────────────────────────

import { Cause, Effect, pipe, Schedule } from "effect"
import * as Atom from "effect/unstable/reactivity/Atom"
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult"
import { RegistryProvider, useAtomValue, useAtomSet } from "@effect/atom-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

// ─── Core types ──────────────────────────────────────────────────────────────

/** The 6 visual states derivable from AsyncResult + Cause inspection. */
export type VisualState = "idle" | "running" | "completed" | "failed" | "interrupted" | "death"

/**
 * A VisualEffect wraps an Effect program with an observable atom that drives
 * UI state. The atom is an `AtomResultFn` — it manages fiber lifecycle
 * internally (run/interrupt/reset via write symbols).
 */
export interface VisualEffect<A, E = never> {
  readonly label: string
  readonly atom: Atom.AtomResultFn<void, A, E>
  readonly effect: Effect.Effect<A, E>
}

// ─── Constructors ────────────────────────────────────────────────────────────

/** Create a VisualEffect from a label and an Effect program. */
export const make = <A, E = never>(
  label: string,
  effect: Effect.Effect<A, E>,
): VisualEffect<A, E> => ({
  label,
  atom: Atom.fn(() => effect),
  effect,
})

// ─── State derivation ────────────────────────────────────────────────────────

/** Derive the visual state from an AsyncResult. */
export const stateOf = <A, E>(result: AsyncResult.AsyncResult<A, E>): VisualState => {
  if (AsyncResult.isInitial(result)) {
    return result.waiting ? "running" : "idle"
  }
  if (AsyncResult.isSuccess(result)) {
    return result.waiting ? "running" : "completed"
  }
  // Failure case
  if (result.waiting) {
    return "running"
  }
  if (Cause.hasInterruptsOnly(result.cause)) {
    return "interrupted"
  }
  if (Cause.hasDies(result.cause)) {
    return "death"
  }
  return "failed"
}

// ─── Style mappings ──────────────────────────────────────────────────────────

/** Tailwind classes for each visual state — uses site's oklch design tokens. */
const STATE_CLASSES: Record<
  VisualState,
  {
    readonly border: string
    readonly dot: string
    readonly label: string
  }
> = {
  idle: {
    border: "border-border",
    dot: "bg-muted-foreground",
    label: "text-muted-foreground",
  },
  running: {
    border: "border-blue-500",
    dot: "bg-blue-500 animate-[ve-pulse_1s_ease-in-out_infinite]",
    label: "text-blue-400",
  },
  completed: {
    border: "border-primary",
    dot: "bg-primary",
    label: "text-primary",
  },
  failed: {
    border: "border-destructive",
    dot: "bg-destructive",
    label: "text-destructive",
  },
  interrupted: {
    border: "border-amber-400",
    dot: "bg-amber-400",
    label: "text-amber-400",
  },
  death: {
    border: "border-accent-foreground",
    dot: "bg-accent-foreground",
    label: "text-accent-foreground",
  },
}

// ─── React hooks ─────────────────────────────────────────────────────────────

interface UseVisualEffectResult<A, E> {
  readonly state: VisualState
  readonly result: AsyncResult.AsyncResult<A, E>
  readonly run: () => void
  readonly stop: () => void
  readonly reset: () => void
}

/**
 * Hook that connects a VisualEffect to React. Returns derived visual state
 * and run/stop/reset controls.
 *
 * Must be used inside a `<RegistryProvider>`.
 */
export const useVisualEffect = <A, E>(ve: VisualEffect<A, E>): UseVisualEffectResult<A, E> => {
  const result = useAtomValue(ve.atom)
  const write = useAtomSet(ve.atom)
  const state = stateOf(result)

  const run = useCallback(() => {
    write(undefined as void)
  }, [write])

  const stop = useCallback(() => {
    write(Atom.Interrupt)
  }, [write])

  const reset = useCallback(() => {
    write(Atom.Reset)
  }, [write])

  return useMemo(() => ({ state, result, run, stop, reset }), [state, result, run, stop, reset])
}

// ─── UI Components ───────────────────────────────────────────────────────────

import { ChevronDownIcon } from "lucide-react"

interface LogEntry {
  readonly time: number
  readonly state: VisualState
}

/** Track state transitions with timestamps. */
function useStateLog(state: VisualState) {
  const [log, setLog] = useState<ReadonlyArray<LogEntry>>([])
  const prevRef = useRef<VisualState>(state)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    if (state === prevRef.current) return
    const prev = prevRef.current
    prevRef.current = state
    if (startRef.current === null) {
      startRef.current = Date.now()
    }
    if (prev === "idle") {
      setLog([{ time: 0, state }])
    } else {
      setLog((entries) => [...entries, { time: Date.now() - startRef.current!, state }])
    }
  }, [state])

  const clear = useCallback(() => {
    setLog([])
    startRef.current = null
    prevRef.current = state
  }, [state])

  return { log, clear }
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

/** A single node representing one VisualEffect with controls + debug log. */
function EffectNode({ ve }: { readonly ve: VisualEffect<unknown, unknown> }) {
  const { state, run, stop, reset } = useVisualEffect(ve)
  const cls = STATE_CLASSES[state]
  const { log, clear } = useStateLog(state)
  const [open, setOpen] = useState(false)

  const handleReset = useCallback(() => {
    reset()
    clear()
  }, [reset, clear])

  return (
    <div
      className={`overflow-hidden rounded-lg border-2 bg-card font-mono transition-all duration-300 ${cls.border}`}
    >
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* State indicator dot */}
        <div className={`size-3 shrink-0 rounded-full transition-colors duration-300 ${cls.dot}`} />

        {/* Label + state */}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-foreground">{ve.label}</div>
          <div className={`text-xs font-medium uppercase tracking-wider ${cls.label}`}>{state}</div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={run}
            disabled={state === "running"}
            className="rounded border border-border bg-secondary px-2 py-1 text-sm text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            title="Run"
          >
            ▶
          </button>
          <button
            onClick={stop}
            disabled={state !== "running"}
            className="rounded border border-border bg-secondary px-2 py-1 text-sm text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            title="Stop"
          >
            ■
          </button>
          <button
            onClick={handleReset}
            className="rounded border border-border bg-secondary px-2 py-1 text-sm text-foreground transition-colors hover:bg-muted"
            title="Reset"
          >
            ↺
          </button>
        </div>

        {/* Disclosure chevron */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded border border-border bg-secondary px-2 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Toggle transition log"
          aria-expanded={open}
        >
          <ChevronDownIcon
            className={`size-4 transition-transform duration-200 translate-y-0.5 ${open ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* Transition log panel */}
      {open && (
        <div className="border-t border-border px-4 py-2 text-xs">
          {log.length === 0 ? (
            <span className="text-muted-foreground">No transitions yet — press ▶ to run</span>
          ) : (
            <div className="flex flex-col gap-0.5">
              {log.map((entry, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-14 shrink-0 text-right tabular-nums text-muted-foreground">
                    {formatMs(entry.time)}
                  </span>
                  <span className={STATE_CLASSES[entry.state].label}>{entry.state}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Demo effects ────────────────────────────────────────────────────────────

const demoEffects = {
  succeed: make("Effect.succeed", Effect.succeed(42)),

  fail: make("Effect.fail", Effect.fail(new Error("Boom!"))),

  sleep: make("Effect.sleep(3s)", Effect.sleep("3 seconds")),

  die: make("Effect.die", Effect.die("Fatal defect")),

  race: make(
    "Effect.race",
    Effect.race(
      pipe(Effect.sleep("2 seconds"), Effect.andThen(Effect.succeed("A wins"))),
      pipe(Effect.sleep("1 second"), Effect.andThen(Effect.succeed("B wins"))),
    ),
  ),

  retry: make(
    "Effect.retry",
    pipe(
      Effect.failSync(() => new Error("flaky")),
      Effect.retry({ times: 3, schedule: Schedule.spaced("500 millis") }),
    ),
  ),
}

// ─── Demo shell ──────────────────────────────────────────────────────────────

function DemoContent() {
  const effects: Array<VisualEffect<unknown, unknown>> = Object.values(demoEffects)

  return (
    <div className="mx-auto flex max-w-md flex-col gap-3 p-6">
      <h2 className="mb-2 font-mono text-xl font-bold text-foreground">VisualEffect Demo</h2>
      {effects.map((ve) => (
        <EffectNode key={ve.label} ve={ve} />
      ))}
    </div>
  )
}

/** Top-level demo component. Provides the AtomRegistry context. */
export function VisualEffectDemo() {
  return (
    <RegistryProvider>
      <style>{`
        @keyframes ve-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>
      <DemoContent />
    </RegistryProvider>
  )
}

export default VisualEffectDemo
