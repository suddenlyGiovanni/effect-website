// ─── VisualEffectDemo.tsx ─────────────────────────────────────────────────────
// Single-file prototype: VisualEffect core + React hooks + demo UI.
// Architecture: Atom.make (passive state) + manual fiber lifecycle.
// Children are independently observable via their own atoms.
// ─────────────────────────────────────────────────────────────────────────────

import { Cause, Effect, type Fiber, pipe, Schedule } from "effect"
import * as Atom from "effect/unstable/reactivity/Atom"
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult"
import * as AtomRegistry from "effect/unstable/reactivity/AtomRegistry"
import { RegistryProvider, useAtomValue } from "@effect/atom-react"
import { RegistryContext } from "@effect/atom-react/RegistryContext"
import { useCallback, useContext, useEffect, useRef, useState } from "react"
import { ChevronDownIcon } from "lucide-react"
import { cn } from "@/lib/utils"

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
  /** When "schedule", renders a step log instead of child nodes. */
  readonly variant: "default" | "schedule"
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
  options?: { readonly onReset?: () => void },
): VisualEffect<A, E> => {
  type VisualEffectResult = AsyncResult.AsyncResult<A, E>

  const initialIdle = AsyncResult.initial<A, E>()
  const initialWaiting = AsyncResult.initial(true)

  const atom = Atom.make<VisualEffectResult>(initialIdle)

  return {
    label,
    atom,
    children: [],
    variant: "default",
    asEffect: () =>
      Atom.set(atom, initialWaiting).pipe(
        Effect.andThen(effect),
        Effect.onExit((exit) => Atom.set(atom, AsyncResult.fromExit(exit))),
      ),
    resetAll(registry) {
      registry.set(atom, initialIdle)
      options?.onReset?.()
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
  const initialIdle = AsyncResult.initial<A, E>()
  const atom = Atom.make<AsyncResult.AsyncResult<A, E>>(initialIdle)

  return {
    label,
    atom,
    children,
    variant: "default",
    asEffect: () =>
      pipe(
        Atom.set(atom, AsyncResult.initial<A, E>(true)),
        Effect.andThen(combinator),
        Effect.onExit((exit) => Atom.set(atom, AsyncResult.fromExit(exit))),
      ),
    resetAll(registry) {
      registry.set(atom, initialIdle)
      for (const child of children) {
        child.resetAll(registry)
      }
    },
  }
}

/**
 * Create a schedule-variant VisualEffect. The single child is the base task
 * that gets repeated/retried. The UI shows a step log tracking each cycle.
 *
 * @example
 * ```ts
 * const baseTask = make("attempt", Effect.sleep("500 millis"))
 * const demoRetry = schedule(
 *   "Effect.retry",
 *   baseTask,
 *   baseTask.asEffect().pipe(Effect.retry({ times: 3, schedule: Schedule.spaced("1 second") })),
 * )
 * ```
 */
export const schedule = <A, E = never>(
  label: string,
  baseTask: VisualEffect<unknown, unknown>,
  combinator: Effect.Effect<A, E, AtomRegistry.AtomRegistry>,
): VisualEffect<A, E> => {
  const ve = group(label, [baseTask], combinator)
  return { ...ve, variant: "schedule" }
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

/** Which action the single control button should perform. */
type Action = "run" | "stop" | "reset"

interface UseVisualEffectResult {
  readonly state: VisualState
  readonly result: AsyncResult.AsyncResult<unknown, unknown>
  /** The action the control button should perform given current state. */
  readonly action: Action
  /** Execute the current action. */
  readonly dispatch: () => void
}

/**
 * Derive the control action from visual state.
 * idle → run, running → stop, any terminal → reset.
 */
const actionOf = (state: VisualState): Action => {
  switch (state) {
    case "idle":
      return "run"
    case "running":
      return "stop"
    default:
      return "reset"
  }
}

/** Button label for each action. */
const ACTION_LABEL: Record<Action, string> = {
  run: "▶",
  stop: "■",
  reset: "↺",
}

/**
 * Hook that connects a VisualEffect to React. Owns the fiber lifecycle —
 * run forks the observed effect, stop interrupts it, reset clears all atoms.
 *
 * The fiber's onExit unconditionally writes terminal state to atoms. To avoid
 * races, stop does NOT null fiberRef — the fiber's observer does it after
 * onExit completes. run guards on fiberRef so it can't proceed until the
 * old fiber is fully dead.
 *
 * Must be used inside a `<RegistryProvider>`.
 */
export const useVisualEffect = (ve: VisualEffect<unknown, unknown>): UseVisualEffectResult => {
  const result = useAtomValue(ve.atom)
  const registry = useContext(RegistryContext)
  const fiberRef = useRef<Fiber.Fiber<unknown, unknown> | null>(null)
  const state = stateOf(result)
  const action = actionOf(state)

  const dispatch = useCallback(() => {
    switch (actionOf(stateOf(result))) {
      case "run": {
        if (fiberRef.current !== null) return
        const program = ve.asEffect().pipe(
          Effect.provideService(AtomRegistry.AtomRegistry, registry),
        )
        const fiber = Effect.runFork(program)
        fiberRef.current = fiber
        fiber.addObserver(() => {
          fiberRef.current = null
        })
        return
      }
      case "stop": {
        fiberRef.current?.interruptUnsafe()
        return
      }
      case "reset": {
        if (fiberRef.current !== null) return
        ve.resetAll(registry)
        return
      }
    }
  }, [ve, registry, result])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      fiberRef.current?.interruptUnsafe()
    }
  }, [])

  return { state, result, action, dispatch }
}

/** Read-only hook for observing a child VisualEffect's state. No controls. */
const useObservedChild = (child: VisualEffect<unknown, unknown>) => {
  const result = useAtomValue(child.atom)
  return { state: stateOf(result), result }
}

// ─── Schedule step tracking ──────────────────────────────────────────────────

/** One attempt/iteration in a schedule-driven effect. */
interface ScheduleStep {
  readonly attempt: number
  readonly outcome: "completed" | "failed"
  /** Duration of the attempt in ms. */
  readonly durationMs: number
  /** Delay before this attempt (0 for the first). */
  readonly delayMs: number
}

/**
 * Track schedule steps by watching a child VisualEffect's state transitions.
 * Each running→terminal cycle is recorded as one step. The gap between
 * a terminal state and the next running state is the schedule delay.
 */
function useScheduleLog(child: VisualEffect<unknown, unknown>) {
  const { state } = useObservedChild(child)
  const [steps, setSteps] = useState<ReadonlyArray<ScheduleStep>>([])
  const prevStateRef = useRef<VisualState>(state)
  const attemptStartRef = useRef<number | null>(null)
  const lastTerminalRef = useRef<number | null>(null)
  const attemptCountRef = useRef(0)

  useEffect(() => {
    const prev = prevStateRef.current
    prevStateRef.current = state

    if (prev === state) return

    // idle = reset occurred → clear the log
    if (state === "idle") {
      setSteps([])
      attemptStartRef.current = null
      lastTerminalRef.current = null
      attemptCountRef.current = 0
      delayRef.current = 0
      return
    }

    // running started → record attempt start time
    if (state === "running") {
      const now = Date.now()
      const delayMs =
        lastTerminalRef.current !== null ? now - lastTerminalRef.current : 0
      attemptStartRef.current = now
      attemptCountRef.current += 1
      // Store delay for when this attempt finishes
      // We capture it in a ref so the terminal handler can read it
      delayRef.current = delayMs
    }

    // terminal state reached → record the step
    if (
      prev === "running" &&
      (state === "completed" || state === "failed")
    ) {
      const now = Date.now()
      const durationMs =
        attemptStartRef.current !== null ? now - attemptStartRef.current : 0
      lastTerminalRef.current = now

      setSteps((prev) => [
        ...prev,
        {
          attempt: attemptCountRef.current,
          outcome: state,
          durationMs,
          delayMs: delayRef.current,
        },
      ])
    }
  }, [state])

  // Mutable ref for delay — captured when running starts, read when terminal
  const delayRef = useRef(0)

  const clear = useCallback(() => {
    setSteps([])
    attemptStartRef.current = null
    lastTerminalRef.current = null
    attemptCountRef.current = 0
    delayRef.current = 0
    prevStateRef.current = "idle"
  }, [])

  return { steps, clear, childState: state }
}

/** Render a list of schedule steps. */
function ScheduleLog({
  steps,
  childState,
}: {
  readonly steps: ReadonlyArray<ScheduleStep>
  readonly childState: VisualState
}) {
  if (steps.length === 0 && childState !== "running") {
    return null
  }

  return (
    <div className="border-t border-border px-4 py-2">
      <div className="mb-1 text-xs text-muted-foreground">Schedule Steps</div>
      <div className="flex flex-col gap-0.5 text-xs">
        {steps.map((step) => (
          <div key={step.attempt} className="flex items-center gap-2">
            <span className="w-6 shrink-0 text-right tabular-nums text-muted-foreground">
              #{step.attempt}
            </span>
            <span
              className={cn(
                "w-16 shrink-0",
                step.outcome === "completed" ? "text-primary" : "text-destructive",
              )}
            >
              {step.outcome === "completed" ? "✓ pass" : "✗ fail"}
            </span>
            <span className="tabular-nums text-muted-foreground">{formatMs(step.durationMs)}</span>
            {step.delayMs > 0 && (
              <span className="text-muted-foreground/60">
                (delay: {formatMs(step.delayMs)})
              </span>
            )}
          </div>
        ))}
        {childState === "running" && (
          <div className="flex items-center gap-2">
            <span className="w-6 shrink-0 text-right tabular-nums text-muted-foreground">
              #{steps.length + 1}
            </span>
            <span className="w-16 shrink-0 text-blue-400">⋯ running</span>
          </div>
        )}
      </div>
    </div>
  )
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
    // idle = reset occurred → clear the log
    if (state === "idle") {
      setLog([])
      startRef.current = null
      return
    }
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
      className={cn(
        "flex items-center gap-2 rounded border bg-card/50 px-3 py-2 font-mono transition-all duration-300",
        cls.border,
      )}
    >
      <div className={cn("size-2 shrink-0 rounded-full transition-colors duration-300", cls.dot)} />
      <span className="text-xs text-foreground">{ve.label}</span>
      <span className={cn("ml-auto text-xs font-medium uppercase tracking-wider", cls.label)}>
        {state}
      </span>
    </div>
  )
}

/** A single node representing one VisualEffect with controls + debug log. */
function EffectNode({ ve }: { readonly ve: VisualEffect<unknown, unknown> }) {
  if (ve.variant === "schedule") {
    return <ScheduleEffectNode ve={ve} />
  }
  return <DefaultEffectNode ve={ve} />
}

function DefaultEffectNode({ ve }: { readonly ve: VisualEffect<unknown, unknown> }) {
  const { state, action, dispatch } = useVisualEffect(ve)
  const cls = STATE_CLASSES[state]
  const { log } = useStateLog(state)
  const [open, setOpen] = useState(false)

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border-2 bg-card font-mono transition-all duration-300",
        cls.border,
      )}
    >
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* State indicator dot */}
        <div className={cn("size-3 shrink-0 rounded-full transition-colors duration-300", cls.dot)} />

        {/* Label + state */}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-foreground">{ve.label}</div>
          <div className={cn("text-xs font-medium uppercase tracking-wider", cls.label)}>{state}</div>
        </div>

        {/* Single cycling control button */}
        <button
          onClick={dispatch}
          className="rounded border border-border bg-secondary px-2 py-1 text-sm text-foreground transition-colors hover:bg-muted"
          title={action}
        >
          {ACTION_LABEL[action]}
        </button>

        {/* Disclosure chevron */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded border border-border bg-secondary px-2 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Toggle transition log"
          aria-expanded={open}
        >
          <ChevronDownIcon
            className={cn(
              "size-4 translate-y-0.5 transition-transform duration-200",
              open && "rotate-180",
            )}
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

/** Schedule-variant node: shows a step log tracking each cycle of the base task. */
function ScheduleEffectNode({ ve }: { readonly ve: VisualEffect<unknown, unknown> }) {
  const { state, action, dispatch } = useVisualEffect(ve)
  const cls = STATE_CLASSES[state]
  const [open, setOpen] = useState(false)
  const { log } = useStateLog(state)

  // The first (and only) child is the base task
  const baseTask = ve.children[0]
  const scheduleLog = useScheduleLog(baseTask ?? ve)

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border-2 bg-card font-mono transition-all duration-300",
        cls.border,
      )}
    >
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className={cn("size-3 shrink-0 rounded-full transition-colors duration-300", cls.dot)} />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-foreground">{ve.label}</div>
          <div className={cn("text-xs font-medium uppercase tracking-wider", cls.label)}>
            {state}
          </div>
        </div>

        {/* Single cycling control button */}
        <button
          onClick={dispatch}
          className="rounded border border-border bg-secondary px-2 py-1 text-sm text-foreground transition-colors hover:bg-muted"
          title={action}
        >
          {ACTION_LABEL[action]}
        </button>

        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded border border-border bg-secondary px-2 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Toggle transition log"
          aria-expanded={open}
        >
          <ChevronDownIcon
            className={cn(
              "size-4 translate-y-0.5 transition-transform duration-200",
              open && "rotate-180",
            )}
          />
        </button>
      </div>

      {/* Schedule step log — always visible when there are steps */}
      {baseTask && (
        <ScheduleLog steps={scheduleLog.steps} childState={scheduleLog.childState} />
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

// Schedule: Effect.retry — a flaky task that fails 3 times then succeeds
let retryAttempt = 0
const retryBaseTask = make(
  "attempt",
  Effect.gen(function* () {
    yield* Effect.sleep("500 millis")
    retryAttempt++
    if (retryAttempt < 4) {
      return yield* Effect.fail(`Error #${retryAttempt}`)
    }
    return "Success!"
  }),
  { onReset: () => { retryAttempt = 0 } },
)
const demoRetry = schedule(
  "Effect.retry",
  retryBaseTask,
  retryBaseTask.asEffect().pipe(
    Effect.retry(Schedule.both(Schedule.spaced("1 second"), Schedule.recurs(4))),
  ),
)

// Schedule: Effect.repeat — a succeeding task repeated 4 times with spacing
let repeatCount = 0
const repeatBaseTask = make(
  "tick",
  Effect.gen(function* () {
    yield* Effect.sleep("400 millis")
    repeatCount++
    return `Tick #${repeatCount}`
  }),
  { onReset: () => { repeatCount = 0 } },
)
const demoRepeat = schedule(
  "Effect.repeat",
  repeatBaseTask,
  repeatBaseTask.asEffect().pipe(
    Effect.repeat(Schedule.both(Schedule.spaced("800 millis"), Schedule.recurs(3))),
  ),
)

const demoEffects: ReadonlyArray<VisualEffect<unknown, unknown>> = [
  demoSucceed,
  demoFail,
  demoSleep,
  demoDie,
  demoRace,
  demoAll,
  demoRetry,
  demoRepeat,
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
