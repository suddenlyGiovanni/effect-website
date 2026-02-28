// ─── VisualEffectDemo.tsx ─────────────────────────────────────────────────────
// Single-file prototype: VisualEffect core + React hooks + demo UI.
// Architecture: Atom.make (passive state) + manual fiber lifecycle.
// Children are independently observable via their own atoms.
// ─────────────────────────────────────────────────────────────────────────────

import { Cause, Effect, type Fiber, pipe } from "effect"
import * as Atom from "effect/unstable/reactivity/Atom"
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult"
import * as AtomRegistry from "effect/unstable/reactivity/AtomRegistry"
import { RegistryProvider, useAtomValue } from "@effect/atom-react"
import { RegistryContext } from "@effect/atom-react/RegistryContext"
import { useCallback, useContext, useEffect, useRef, useState } from "react"
import { ChevronDownIcon } from "lucide-react"

// ─── Core types ──────────────────────────────────────────────────────────────

/** The 6 visual states derivable from AsyncResult + Cause inspection. */
export type VisualState = "idle" | "running" | "completed" | "failed" | "interrupted" | "death"

/**
 * A VisualEffect wraps an Effect program with an observable atom that drives
 * UI state. The atom is exposed as read-only (`Atom.Atom`) for covariance —
 * writes go through `registry.set` in the hook.
 *
 * For composed effects, `children` holds independently observable child
 * VisualEffects whose atoms update as the parent runs.
 */
export interface VisualEffect<out A, out E = never> {
  readonly label: string
  /** Read-only view of the result atom. Covariant so collections work. */
  readonly atom: Atom.Atom<AsyncResult.AsyncResult<A, E>>
  readonly children: ReadonlyArray<VisualEffect<unknown, unknown>>
  /** Returns the effect wrapped with lifecycle hooks that update the atom. */
  asEffect(): Effect.Effect<A, E, AtomRegistry.AtomRegistry>
  /** Reset this effect and all children to idle. */
  resetAll(registry: AtomRegistry.AtomRegistry): void
}

// ─── Constructors ────────────────────────────────────────────────────────────

/** Create a leaf VisualEffect from a label and an Effect program. */
export const make = <A, E = never>(
  label: string,
  effect: Effect.Effect<A, E>,
): VisualEffect<A, E> => {
  type VisualEffectResult = AsyncResult.AsyncResult<A, E>

  const initialIdle = AsyncResult.initial<A, E>()
  const initialWaiting = AsyncResult.initial(true)

  const atom = Atom.make<VisualEffectResult>(initialIdle)

  // When the observed effect is about to start execution, transition the atom
  // to the waiting state to mark the visual state as "running"
  const run = Atom.set(atom, initialWaiting)

  const observed: Effect.Effect<A, E, AtomRegistry.AtomRegistry> = run.pipe(
    Effect.andThen(effect),
    // On any exit: transition to terminal state
    Effect.onExit((exit) => Atom.set(atom, AsyncResult.fromExit(exit))),
  )

  return {
    label,
    atom,
    children: [],
    asEffect: () => observed,
    resetAll(registry) {
      registry.set(atom, AsyncResult.initial<A, E>())
    },
  }
}

/**
 * Create a composed VisualEffect from children and a combinator function.
 * Each child has its own atom that updates independently as the parent runs.
 *
 * The combinator should call `child.asEffect()` to compose children — this
 * ensures each child's lifecycle hooks (atom updates) fire. Because effects
 * share the fiber tree, interruption propagates structurally.
 *
 * @example
 * ```ts
 * const raceDemo = group(
 *   "Effect.race",
 *   [branchA, branchB],
 *   Effect.race(branchA.asEffect(), branchB.asEffect()),
 * )
 * ```
 */
export const group = <A, E = never>(
  label: string,
  children: ReadonlyArray<VisualEffect<unknown, unknown>>,
  combinator: Effect.Effect<A, E, AtomRegistry.AtomRegistry>,
): VisualEffect<A, E> => {
  const atom = Atom.make<AsyncResult.AsyncResult<A, E>>(AsyncResult.initial<A, E>())

  return {
    label,
    atom,
    children,
    asEffect: () =>
      pipe(
        // On start: transition parent to running BEFORE children execute
        Atom.set(atom, AsyncResult.initial<A, E>(true)),
        Effect.andThen(combinator),
        Effect.onExit((exit) => Atom.set(atom, AsyncResult.fromExit(exit))),
      ),
    resetAll(registry) {
      registry.set(atom, AsyncResult.initial<A, E>())
      for (const child of children) {
        child.resetAll(registry)
      }
    },
  }
}

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

interface UseVisualEffectResult {
  readonly state: VisualState
  readonly result: AsyncResult.AsyncResult<unknown, unknown>
  readonly run: () => void
  readonly stop: () => void
  readonly reset: () => void
}

/**
 * Hook that connects a VisualEffect to React. Owns the fiber lifecycle —
 * run forks the observed effect, stop interrupts it, reset clears all atoms.
 *
 * Must be used inside a `<RegistryProvider>`.
 */
export const useVisualEffect = (ve: VisualEffect<unknown, unknown>): UseVisualEffectResult => {
  const result = useAtomValue(ve.atom)
  const registry = useContext(RegistryContext)
  const fiberRef = useRef<Fiber.Fiber<unknown, unknown> | null>(null)
  const state = stateOf(result)

  const run = useCallback(() => {
    // Guard against double-invocation before React re-renders
    if (fiberRef.current !== null) return
    const program = ve.asEffect().pipe(Effect.provideService(AtomRegistry.AtomRegistry, registry))
    const fiber = Effect.runFork(program)
    fiberRef.current = fiber
    // Clear ref when fiber completes so re-run is possible
    fiber.addObserver(() => {
      fiberRef.current = null
    })
  }, [ve, registry])

  const stop = useCallback(() => {
    fiberRef.current?.interruptUnsafe()
    fiberRef.current = null
  }, [])

  const reset = useCallback(() => {
    // Interrupt any running fiber
    fiberRef.current?.interruptUnsafe()
    fiberRef.current = null
    // Reset all atoms (parent + children recursively)
    ve.resetAll(registry)
  }, [ve, registry])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      fiberRef.current?.interruptUnsafe()
    }
  }, [])

  return { state, result, run, stop, reset }
}

/** Read-only hook for observing a child VisualEffect's state. No controls. */
const useObservedChild = (child: VisualEffect<unknown, unknown>) => {
  const result = useAtomValue(child.atom)
  return { state: stateOf(result), result }
}

// ─── UI Components ───────────────────────────────────────────────────────────

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
      const elapsed = startRef.current === null ? 0 : Date.now() - startRef.current
      setLog((entries) => [...entries, { time: elapsed, state }])
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

/** Read-only child node — no controls, just state display. */
function ChildNode({ ve }: { readonly ve: VisualEffect<unknown, unknown> }) {
  const { state } = useObservedChild(ve)
  const cls = STATE_CLASSES[state]

  return (
    <div
      className={`flex items-center gap-2 rounded border bg-card/50 px-3 py-2 font-mono transition-all duration-300 ${cls.border}`}
    >
      <div className={`size-2 shrink-0 rounded-full transition-colors duration-300 ${cls.dot}`} />
      <span className="text-xs text-foreground">{ve.label}</span>
      <span className={`ml-auto text-xs font-medium uppercase tracking-wider ${cls.label}`}>
        {state}
      </span>
    </div>
  )
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
            className={`size-4 translate-y-0.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* Children */}
      {ve.children.length > 0 && (
        <div className="flex flex-col gap-1.5 border-t border-border px-4 py-3">
          {ve.children.map((child) => (
            <ChildNode key={child.label} ve={child} />
          ))}
        </div>
      )}

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

const demoSucceed = make("Effect.succeed", Effect.succeed(42))

const demoFail = make("Effect.fail", Effect.fail("Boom!"))

const demoSleep = make("Effect.sleep(3s)", Effect.sleep("3 seconds"))

const demoDie = make("Effect.die", Effect.die("Fatal defect"))

// Composed: Effect.race with independently observable branches
const raceBranchA = make(
  "Branch A (2s)",
  pipe(Effect.sleep("2 seconds"), Effect.andThen(Effect.succeed("A wins"))),
)
const raceBranchB = make(
  "Branch B (1s)",
  pipe(Effect.sleep("1 second"), Effect.andThen(Effect.succeed("B wins"))),
)
const demoRace = group(
  "Effect.race",
  [raceBranchA, raceBranchB],
  Effect.race(raceBranchA.asEffect(), raceBranchB.asEffect()),
)

// Composed: Effect.all — both must complete
const allBranchA = make(
  "Task A (1s)",
  pipe(Effect.sleep("1 second"), Effect.andThen(Effect.succeed("A done"))),
)
const allBranchB = make(
  "Task B (2s)",
  pipe(Effect.sleep("2 seconds"), Effect.andThen(Effect.succeed("B done"))),
)
const demoAll = group(
  "Effect.all",
  [allBranchA, allBranchB],
  Effect.all([allBranchA.asEffect(), allBranchB.asEffect()]),
)

const demoEffects: ReadonlyArray<VisualEffect<unknown, unknown>> = [
  demoSucceed,
  demoFail,
  demoSleep,
  demoDie,
  demoRace,
  demoAll,
]

// ─── Demo shell ──────────────────────────────────────────────────────────────

function DemoContent() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-3 p-6">
      <h2 className="mb-2 font-mono text-xl font-bold text-foreground">VisualEffect Demo</h2>
      {demoEffects.map((ve) => (
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
