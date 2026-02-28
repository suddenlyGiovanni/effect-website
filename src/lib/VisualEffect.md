# VisualEffect API Design

Observable Effect execution for interactive UI demos.

Built on `Atom.fn` from `effect/unstable/reactivity`. The core type is a plain record wrapping an `AtomResultFn<void, A, E>` — NOT a class. State is modeled by `AsyncResult<A, E>` (Initial/Success/Failure + waiting flag), with `Cause` inspection for interrupt vs. defect vs. typed error.

## Architecture

- `Atom.fn` manages fiber lifecycle, state transitions, and the waiting flag
- Play / Stop / Reset are writes to the atom: `void | Atom.Interrupt | Atom.Reset`
- Timer, sound, and notifications are separable concerns — NOT baked in
- Composition (Effect.all, Effect.race) uses `ObservedChild` + `AtomRef`
- React integration via `@effect/atom-react` hooks (`useAtom`, `useAtomValue`, `useAtomRef`)

## State Model

`AsyncResult<A, E>` replaces the old 6-variant custom union:

| Visual State  | AsyncResult                                       |
|---------------|---------------------------------------------------|
| idle          | `Initial { waiting: false }`                      |
| running       | `Initial/Success/Failure { waiting: true }`       |
| completed     | `Success { value, waiting: false }`               |
| failed        | `Failure { cause }` where `Cause.hasFails`        |
| interrupted   | `Failure { cause }` where `AsyncResult.isInterrupted` |
| death         | `Failure { cause }` where `Cause.hasDies`         |

---

## Core Types

```ts
interface VisualEffect<A, E = never> extends
  Effect.Yieldable<VisualEffect<A, E>, A, E>
{
  readonly name: string
  readonly atom: Atom.Writable<AsyncResult.AsyncResult<A, E>>
  readonly effect: Effect.Effect<A, E>
  asEffect(): Effect.Effect<A, E>
}

type VisualState =
  | "idle"
  | "running"
  | "completed"
  | "failed"
  | "interrupted"
  | "death"
```

- `name` — label for UI display and debugging
- `atom` — a simple `Writable<AsyncResult<A, E>>` atom. The effect's lifecycle combinators push state into it directly
- `effect` — the original effect, retained for composition via `Yieldable`
- `asEffect()` — returns a *wrapped* version of the effect that updates the atom as it runs

### Yieldable

`VisualEffect` extends `Effect.Yieldable<Self, A, E>`, which requires:

- `asEffect(): Effect<A, E>` — returns the effect wrapped with lifecycle hooks that update the atom
- `[Symbol.iterator]()` — provided by `YieldableProto` from `effect/internal/core`

This means a `VisualEffect` can be yielded directly in `Effect.gen`:

```ts
const program = Effect.gen(function*() {
  const weather = yield* weatherEffect   // VisualEffect<Weather, HttpError>
  const emoji   = yield* emojiEffect     // VisualEffect<string, never>
  return { weather, emoji }
})
```

And used in any combinator that accepts an `Effect`:

```ts
Effect.all([weatherEffect, emojiEffect])
Effect.race(weatherEffect, emojiEffect)
Effect.timeout(weatherEffect, "5 seconds")
weatherEffect.pipe(Effect.map(w => w.temperature))
```

**Key distinction from the previous `Atom.fn` design:** yielding a `VisualEffect` or passing it to a combinator runs the effect *and* updates the atom. The observation is built into the effect itself via combinators — not managed by a separate `Atom.fn` state machine.

## Constructors

```ts
import { YieldableProto, PipeInspectableProto } from "effect/internal/core"

const make = <A, E>(
  name: string,
  effect: Effect.Effect<A, E>
): VisualEffect<A, E> => {
  // Simple writable atom holding AsyncResult — no Atom.fn
  const atom = Atom.make(AsyncResult.initial<A, E>())

  // Wrap the effect with lifecycle combinators that push state into the atom
  const observed = effect.pipe(
    // On start: transition to running
    Effect.tap(() =>
      Atom.set(atom, AsyncResult.initial<A, E>(true))
    ),
    // On any exit: transition to terminal state
    Effect.onExit((exit) =>
      Atom.set(atom, AsyncResult.fromExit(exit))
    )
  )

  return {
    ...PipeInspectableProto,
    ...YieldableProto,
    name,
    atom,
    effect,
    asEffect() {
      return observed
    }
  }
}
```

No `Atom.fn`. No thunks. No counter atoms. The atom is a plain `Atom.make(initialValue)` — a `Writable<AsyncResult<A, E>>` created by the `state` primitive internally. The effect is wrapped with two combinators:

1. **`Effect.tap`** — when the effect starts executing, sets the atom to `Initial { waiting: true }` (running)
2. **`Effect.onExit`** — when the effect completes (success, failure, or interruption), sets the atom to `AsyncResult.fromExit(exit)` which produces `Success` or `Failure` as appropriate

`asEffect()` returns the *wrapped* effect, so `yield* ve` both runs the effect and updates the atom. The raw `effect` field is retained for cases where you need the unwrapped version.

`Atom.set` is an effectful operation (`Effect.Effect<void, never, AtomRegistry>`) that calls `registry.set(atom, value)`. The `AtomRegistry` requirement is satisfied by the atom runtime context in which the effect runs.

## State Derivation

Pure function — no side effects, no subscriptions. Used as a key into animation variants, CSS classes, sound maps.

```ts
const stateOf = <A, E>(result: AsyncResult.AsyncResult<A, E>): VisualState => {
  if (AsyncResult.isInitial(result)) {
    return result.waiting ? "running" : "idle"
  }
  if (AsyncResult.isSuccess(result)) {
    return result.waiting ? "running" : "completed"
  }
  // Failure — inspect Cause
  if (result.waiting) return "running"
  if (AsyncResult.isInterrupted(result)) return "interrupted"
  if (Cause.hasDies(result.cause)) return "death"
  return "failed"
}
```

## Controls

Controls are direct writes to the atom. No `Atom.fn` write protocol — just `registry.set` on a plain `Writable`.

```ts
// Reset — return to Initial { waiting: false }
const reset = <A, E>(
  registry: AtomRegistry.AtomRegistry,
  ve: VisualEffect<A, E>
): void => registry.set(ve.atom, AsyncResult.initial<A, E>())
```

Play and stop are handled differently now. Since there's no `Atom.fn` managing a fiber, the component is responsible for running the effect and managing interruption:

```ts
// In a React hook:
const useVisualEffect = <A, E>(ve: VisualEffect<A, E>) => {
  const result = useAtomValue(ve.atom)
  const registry = useContext(RegistryContext)
  const fiberRef = useRef<Fiber.RuntimeFiber<A, E> | null>(null)

  const play = useCallback(() => {
    // Fork the observed effect — it updates the atom as it runs
    fiberRef.current = Effect.runFork(ve.asEffect())
  }, [ve])

  const stop = useCallback(() => {
    fiberRef.current?.interruptUnsafe()
    fiberRef.current = null
  }, [])

  const reset = useCallback(() => {
    fiberRef.current?.interruptUnsafe()
    fiberRef.current = null
    registry.set(ve.atom, AsyncResult.initial())
  }, [registry, ve])

  // Cleanup on unmount
  useEffect(() => () => fiberRef.current?.interruptUnsafe(), [])

  return { state: stateOf(result), result, play, stop, reset } as const
}
```

This is more explicit than the `Atom.fn` approach — the hook owns the fiber lifecycle, and the atom is just a state container that the effect writes to.

---

## Execution Flow

### 1. Component mounts

```tsx
const ve = useMemo(() => VisualEffect.make("sleep", Effect.sleep("2 seconds")), [])
const { state, result, play, stop, reset } = VisualEffect.useVisualEffect(ve)
```

- `make` creates a `Writable<AsyncResult<A, E>>` initialized to `AsyncResult.initial()` (idle)
- `useAtomValue(ve.atom)` subscribes to the atom via `useSyncExternalStore`
- `stateOf(AsyncResult.initial())` returns `"idle"`

### 2. User clicks play

```ts
play()
// → Effect.runFork(ve.asEffect())
```

- `asEffect()` returns the wrapped effect
- `Effect.runFork` starts a fiber
- The `Effect.tap` fires immediately: `Atom.set(atom, AsyncResult.initial(true))`
- The atom transitions to `Initial { waiting: true }` → subscribers notified → React re-renders
- `stateOf` returns `"running"`

### 3. Effect completes

- The inner effect finishes with `Exit.succeed(value)` or `Exit.fail(cause)`
- `Effect.onExit` fires: `Atom.set(atom, AsyncResult.fromExit(exit))`
- For success: atom becomes `AsyncResult.success(value)` → `stateOf` returns `"completed"`
- For typed error: atom becomes `AsyncResult.failure(Cause.fail(error))` → `"failed"`
- For defect: atom becomes `AsyncResult.failure(Cause.die(defect))` → `"death"`

### 4. User clicks stop

```ts
stop()
// → fiberRef.current?.interruptUnsafe()
```

- The fiber is interrupted
- `Effect.onExit` fires with `Exit.fail(Cause.interrupt())`: `Atom.set(atom, AsyncResult.failure(Cause.interrupt()))`
- `AsyncResult.isInterrupted` returns true → `stateOf` returns `"interrupted"`

### 5. User clicks reset

```ts
reset()
// → fiber interrupted + registry.set(ve.atom, AsyncResult.initial())
```

- Any running fiber is interrupted
- Atom set directly to `AsyncResult.initial()` → `stateOf` returns `"idle"`

---

## React Hooks

### `useVisualEffect`

Primary hook. Owns the fiber lifecycle, reads state from the atom.

```ts
const useVisualEffect = <A, E>(ve: VisualEffect<A, E>) => {
  const result = useAtomValue(ve.atom)  // from @effect/atom-react
  const registry = useContext(RegistryContext)
  const fiberRef = useRef<Fiber.RuntimeFiber<A, E> | null>(null)

  const play = useCallback(() => {
    fiberRef.current = Effect.runFork(ve.asEffect())
  }, [ve])

  const stop = useCallback(() => {
    fiberRef.current?.interruptUnsafe()
    fiberRef.current = null
  }, [])

  const reset = useCallback(() => {
    fiberRef.current?.interruptUnsafe()
    fiberRef.current = null
    registry.set(ve.atom, AsyncResult.initial())
  }, [registry, ve])

  useEffect(() => () => fiberRef.current?.interruptUnsafe(), [])

  return { state: stateOf(result), result, play, stop, reset } as const
}
```

### `useObservedChild`

Read-only hook for children in composed demos. Same atom, just no controls.

```ts
const useObservedChild = <A, E>(child: VisualEffect<A, E>) => {
  const result = useAtomValue(child.atom)  // from @effect/atom-react
  return {
    state: stateOf(result),
    result,
  } as const
}
```

### `useStateTransition`

Detects state edges for one-shot animations (flash on complete, shake on fail).

```ts
const useStateTransition = (state: VisualState) => {
  const prevRef = useRef(state)
  const prev = prevRef.current
  prevRef.current = state
  return {
    justStarted: state === "running" && prev !== "running",
    justCompleted: state === "completed" && prev !== "completed",
    justFailed: state === "failed" && prev !== "failed",
    justInterrupted: state === "interrupted" && prev !== "interrupted",
    previousState: prev,
    currentState: state,
  } as const
}
```

---

## Composition

For demos with multiple effects (Effect.all, Effect.race), each child is itself a `VisualEffect` — it has its own atom that gets updated via the same lifecycle combinators. The parent `VisualEffect` controls play/stop/reset for all.

### `observe`

Creates a child `VisualEffect`. Same as `make` — each child gets its own atom and its own lifecycle-wrapped effect. The only difference from a top-level `VisualEffect` is that the child is not played independently; the parent's composed effect runs it.

```ts
// observe is just an alias for make — the child is a full VisualEffect
const observe = make
```

### `compose`

Assembles children into a parent `VisualEffect`. Because children are `Yieldable`, the combinator can use them directly in `Effect.gen`, `Effect.race`, `Effect.all`, etc. When `yield* child` executes, the child's `asEffect()` runs — which updates the child's atom.

```ts
const compose = <A, E>(
  name: string,
  children: ReadonlyArray<VisualEffect<unknown, unknown>>,
  combinator: (children: ReadonlyArray<VisualEffect<unknown, unknown>>) => Effect.Effect<A, E>
): VisualEffect<A, E> => {
  const composedEffect = combinator(children)
  return make(name, composedEffect)
}
```

Usage:

```ts
const result = VisualEffect.compose(
  "winner",
  [tortoise, achilles],
  (children) => Effect.race(children[0], children[1])
)
```

When the parent plays:
1. `Effect.runFork(result.asEffect())` runs the composed effect
2. The parent's `Effect.tap` fires → parent atom transitions to running
3. Inside, `Effect.race(children[0], children[1])` calls `children[0].asEffect()` and `children[1].asEffect()`
4. Each child's `Effect.tap` fires → each child's atom transitions to running independently
5. When a child completes, its `Effect.onExit` fires → child atom transitions to completed/failed
6. When the race resolves, the losing child is interrupted → its `Effect.onExit` fires with `Cause.interrupt()` → child atom transitions to interrupted
7. The parent's `Effect.onExit` fires → parent atom transitions to completed

When the parent resets:
- The hook interrupts the fiber and sets the parent atom to `AsyncResult.initial()`
- Child atoms should also be reset. The `reset` function in `useVisualEffect` should reset all children:

```ts
const useComposedVisualEffect = <A, E>(
  ve: VisualEffect<A, E>,
  children: ReadonlyArray<VisualEffect<unknown, unknown>>
) => {
  const base = useVisualEffect(ve)
  const registry = useContext(RegistryContext)

  const reset = useCallback(() => {
    base.reset()
    for (const child of children) {
      registry.set(child.atom, AsyncResult.initial())
    }
  }, [base.reset, children, registry])

  return { ...base, reset } as const
}
```

---

## Separable Concerns

### Timer

Derived atom, opt-in. Ticks every 10ms while running (matching old `Timer.tsx`). Freezes on completion. Resets to 0 on idle.

```ts
const timer = <A, E>(
  ve: VisualEffect<A, E>
): Atom.Atom<{ readonly startTime: number | null; readonly elapsed: number }> =>
  Atom.readable((get) => {
    const result = get(ve.atom)
    if (AsyncResult.isInitial(result) && !result.waiting) {
      return { startTime: null, elapsed: 0 }
    }
    if (!result.waiting) {
      // Terminal — freeze at last tick value
      const prev = get.self<{ startTime: number | null; elapsed: number }>()
      return Option.match(prev, {
        onNone: () => ({ startTime: null, elapsed: 0 }),
        onSome: (p) => ({ startTime: null, elapsed: p.elapsed })
      })
    }
    // Running — tick every 10ms
    const start = Date.now()
    const handle = setInterval(() => {
      get.setSelf({ startTime: start, elapsed: Date.now() - start })
    }, 10) as unknown as number
    get.addFinalizer(() => clearInterval(handle))
    return { startTime: start, elapsed: 0 }
  })
```

### Sound

External subscription on state transitions. Not on the type.

```ts
const withSound = <A, E>(
  registry: AtomRegistry.AtomRegistry,
  ve: VisualEffect<A, E>,
  sounds: Record<VisualState, () => void>
): (() => void) => {
  let prev: VisualState = "idle"
  return registry.subscribe(ve.atom, (result) => {
    const next = stateOf(result)
    if (next !== prev) {
      sounds[next]?.()
      prev = next
    }
  })
}
```

### Notifications

PubSub service in Effect context, entirely decoupled from the core type.

```ts
interface Notification {
  readonly id: string
  readonly message: string
  readonly timestamp: number
  readonly duration?: number | undefined
  readonly icon?: string | undefined
}

const NotificationPubSub = ServiceMap.Reference(
  PubSub.unbounded<Notification>()
)

const notify = (
  message: string,
  options?: { readonly duration?: number; readonly icon?: string }
): Effect.Effect<void> =>
  Effect.flatMap(NotificationPubSub, (pubsub) =>
    PubSub.publish(pubsub, {
      id: crypto.randomUUID(),
      message,
      timestamp: Date.now(),
      ...options
    })
  )
```

---

## UI Usage Examples

### Simple Effect (Effect.succeed)

```tsx
function EffectSucceedExample() {
  const ve = useMemo(() => VisualEffect.make("value", Effect.succeed(42)), [])
  const { state, result, play, stop, reset } = VisualEffect.useVisualEffect(ve)

  return (
    <div>
      <HeaderView state={state} onPlay={play} onStop={stop} onReset={reset} />
      <EffectNode name={ve.name} state={state} result={result} />
    </div>
  )
}
```

### Composed Effects (Effect.race)

```tsx
function EffectRaceExample() {
  const [tortoise, achilles, raceResult] = useMemo(() => {
    const t = VisualEffect.make("tortoise", loadEmoji("tortoise"))
    const a = VisualEffect.make("achilles", loadEmoji("achilles"))

    // Children are Yieldable — use them directly in combinators
    const result = VisualEffect.compose(
      "winner",
      [t, a],
      (children) => Effect.race(children[0], children[1])
    )
    return [t, a, result] as const
  }, [])

  // Parent controls all execution; reset also resets children
  const { state, play, stop, reset } = VisualEffect.useComposedVisualEffect(
    raceResult,
    [tortoise, achilles]
  )

  // Children are read-only observers
  const tortoiseState = VisualEffect.useObservedChild(tortoise)
  const achillesState = VisualEffect.useObservedChild(achilles)

  return (
    <div>
      <HeaderView state={state} onPlay={play} onStop={stop} onReset={reset} />
      <div className="flex gap-4">
        <EffectNode name="tortoise" state={tortoiseState.state} />
        <EffectNode name="achilles" state={achillesState.state} />
        <Arrow />
        <EffectNode name="winner" state={state} />
      </div>
    </div>
  )
}
```

### Composed Effects (Effect.gen)

Sequential composition works naturally because `VisualEffect` is `Yieldable`:

```tsx
function SequentialExample() {
  const [step1, step2, pipeline] = useMemo(() => {
    const s1 = VisualEffect.make("fetch", fetchData)
    const s2 = VisualEffect.make("transform", transformData)

    const result = VisualEffect.compose(
      "pipeline",
      [s1, s2],
      (children) => Effect.gen(function*() {
        const data = yield* children[0]        // runs fetch, updates s1.atom
        const transformed = yield* children[1] // runs transform, updates s2.atom
        return transformed
      })
    )
    return [s1, s2, result] as const
  }, [])

  const { state, play, stop, reset } = VisualEffect.useComposedVisualEffect(
    pipeline,
    [step1, step2]
  )
  const step1State = VisualEffect.useObservedChild(step1)
  const step2State = VisualEffect.useObservedChild(step2)

  return (
    <div>
      <HeaderView state={state} onPlay={play} onStop={stop} onReset={reset} />
      <EffectNode name="fetch" state={step1State.state} />
      <Arrow />
      <EffectNode name="transform" state={step2State.state} />
      <Arrow />
      <EffectNode name="pipeline" state={state} />
    </div>
  )
}
```

### Timer

```tsx
function TimedExample() {
  const ve = useMemo(
    () => VisualEffect.make("sleep", Effect.sleep("2 seconds")),
    []
  )
  const { state, play, stop, reset } = VisualEffect.useVisualEffect(ve)
  const timerAtom = useMemo(() => VisualEffect.timer(ve), [ve])
  const { elapsed } = useAtomValue(timerAtom)

  return (
    <div>
      <HeaderView state={state} onPlay={play} onStop={stop} onReset={reset} />
      <EffectNode name={ve.name} state={state} />
      <span className="font-mono">
        {elapsed < 1000 ? `${elapsed}ms` : `${(elapsed / 1000).toFixed(1)}s`}
      </span>
    </div>
  )
}
```

### Notifications

```tsx
// Effect definition — notify from inside the effect
const sleepEffect = Effect.gen(function*() {
  yield* Effect.sleep("1 second")
  yield* VisualEffect.notify("sleeping...", { duration: 2000 })
  yield* Effect.sleep("2 seconds")
  return "Refreshed!"
})

// Component
function SleepExample() {
  const ve = useMemo(() => VisualEffect.make("sleep", sleepEffect), [])
  const { state, play, stop, reset } = VisualEffect.useVisualEffect(ve)
  // ... render with NotificationBubble subscribing to the PubSub
}
```

### Sound

```tsx
function SoundExample() {
  const ve = useMemo(() => VisualEffect.make("demo", myEffect), [])
  const registry = useContext(RegistryContext)

  useEffect(() => {
    return VisualEffect.withSound(registry, ve, {
      idle: () => {},
      running: () => playStartSound(),
      completed: () => playSuccessSound(),
      failed: () => playErrorSound(),
      interrupted: () => playInterruptSound(),
      death: () => playDeathSound(),
    })
  }, [registry, ve])
}
```

### EffectNode (state-driven rendering)

```tsx
const nodeVariants: Record<VisualState, Variant> = {
  idle:        { backgroundColor: "#18181b", borderColor: "#3f3f46", scale: 1 },
  running:     { backgroundColor: "#1e3a5f", borderColor: "#3b82f6", scale: 1.05 },
  completed:   { backgroundColor: "#14532d", borderColor: "#22c55e", scale: 1 },
  failed:      { backgroundColor: "#450a0a", borderColor: "#ef4444", scale: 1 },
  interrupted: { backgroundColor: "#431407", borderColor: "#f97316", scale: 1 },
  death:       { backgroundColor: "#1c0a0a", borderColor: "#991b1b", scale: 1 },
}

function EffectNode({ name, state, result }: {
  name: string
  state: VisualState
  result?: AsyncResult.AsyncResult<unknown, unknown>
}) {
  const { justCompleted, justFailed } = VisualEffect.useStateTransition(state)

  return (
    <motion.div variants={nodeVariants} animate={state}>
      {state === "idle" && <StarIcon />}
      {state === "running" && <ShimmerOverlay />}
      {state === "completed" && result && <ResultView result={result} />}
      {state === "failed" && <FailureBubble />}
      {state === "death" && <DeathBubble />}
      {state === "interrupted" && <InterruptIcon />}
    </motion.div>
  )
}
```

### HeaderView (play/stop/reset button)

```tsx
function HeaderView({ state, onPlay, onStop, onReset }: {
  state: VisualState
  onPlay: () => void
  onStop: () => void
  onReset: () => void
}) {
  const action = state === "idle" ? onPlay
    : state === "running" ? onStop
    : onReset

  const icon = state === "idle" ? <PlayIcon />
    : state === "running" ? <StopIcon />
    : <ResetIcon />

  return <button onClick={action}>{icon}</button>
}
```

---

## Old vs. New

| Aspect              | Old (landing)                            | New (proposed)                                |
|---------------------|------------------------------------------|-----------------------------------------------|
| Core type           | 400-line mutable class                   | Plain record + `Writable<AsyncResult>`        |
| State model         | Custom 6-variant union + transition table| `AsyncResult` + `Cause` inspection            |
| State updates       | Manual `setState()` in class             | Effect lifecycle combinators (`tap`, `onExit`) |
| Fiber management    | Manual (`this.fiber`, `interruptUnsafe`) | Hook owns fiber via `useRef`                  |
| Listener management | Hand-rolled `Set<() => void>`            | `AtomRegistry.subscribe` / `useAtomValue`     |
| Play/Stop/Reset     | Instance methods                         | Hook callbacks: `runFork` / `interruptUnsafe` / `registry.set` |
| Composition         | `VisualEffectService` in Context         | Children are `VisualEffect`s — each has own atom, composed via `Yieldable` |
| Timer               | Baked into class (`startTime`/`endTime`) | Derived atom, opt-in                          |
| Sound               | Baked into state transitions             | External subscription, opt-in                 |
| Notifications       | Baked into class                         | `PubSub` service, separate atom               |
| React hooks         | Custom `useSyncExternalStore` wrappers   | `useAtomValue` from `@effect/atom-react`      |
| Yieldable           | No                                       | Yes — `yield*` in generators, pass to any combinator |
