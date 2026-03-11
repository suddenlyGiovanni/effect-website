# Visual Effect Finalizer Visualization Specification

## 1. Intent

This specification defines how the landing-page Visual Effect system should gain first-class support for Effect finalizers.

The feature goal is straightforward.

Visitors should be able to see:

1. when a finalizer is registered,
2. in what order finalizers are stacked,
3. when cleanup starts,
4. and when cleanup finishes.

The visual target is the old landing page finalizer panel from `.repos/landing`, but the implementation target is the new `website-v4` architecture.

That means the new feature must fit these existing invariants:

1. `defineExample(...)` remains the authoring entry point.
2. `VisualEffectManager` remains the runtime authority.
3. React components remain presentation-only consumers of atom state.
4. The implementation uses public Effect v4 APIs instead of runtime internals.

## 2. Background

### 2.1 Old website behavior

The old website implemented a dedicated imperative `VisualScope` model in `.repos/landing/src/VisualScope.ts` and rendered it with:

- `.repos/landing/src/components/scope/ScopeStack.tsx`
- `.repos/landing/src/components/scope/FinalizerCard.tsx`
- `.repos/landing/src/examples/effect-add-finalizer.tsx`
- `.repos/landing/src/examples/effect-acquire-release.tsx`

That system was visually effective, even though it was not coupled to real Effect scope semantics.

The key user-visible behaviors were:

1. Finalizers appeared in the panel as soon as they were registered.
2. Pending finalizers accumulated on the left side.
3. The currently executing finalizer moved to the center and pulsed.
4. Completed finalizers accumulated on the right side.
5. The visual order matched Effect's LIFO cleanup behavior.

Those behaviors are the parity target.

### 2.2 New website state

The new site already has the core primitives needed for a clean implementation:

- `src/lib/examples/constructors.ts` creates stable `ExampleDefinition` objects.
- `src/services/VisualEffectManager.ts` owns execution and writes atom state.
- `src/components/landing/examples/VisualEffect.tsx` owns card layout.
- `src/components/landing/examples/VisualEffectProvider.tsx` already exposes runtime atoms to React.
- `src/lib/examples/catalog.ts` already contains a `scope` category waiting for examples.

What is missing is a finalizer-specific runtime channel.

Unlike schedule visualization, finalizer registration and finalizer execution are not derivable from existing step and example state. The runtime must emit explicit finalizer events or explicit finalizer state transitions.

### 2.3 Effect v4 constraints

The relevant Effect v4 APIs in `.repos/effect-smol` are:

- `Effect.addFinalizer`
- `Effect.acquireRelease`
- `Scope.addFinalizer`
- `Scope.addFinalizerExit`

Those APIs guarantee cleanup behavior, but they do not expose a ready-made visualization stream.

That means the new site should not try to inspect live scope internals. It should wrap the public APIs it already asks example authors to use and emit visual state from those wrappers.

## 3. Scope

### 3.1 In scope

- A finalizer panel rendered underneath the effect nodes.
- Visualizing both finalizer registration and finalizer execution.
- A small authoring API for `Effect.addFinalizer` and `Effect.acquireRelease` examples.
- A runtime data model stored in atoms and driven by `VisualEffectManager`.
- Porting at least two scope examples into the `scope` category.
- Preserving the old panel's core motion and layout language.

### 3.2 Out of scope

- Generic automatic visualization for arbitrary unwrapped `Scope` usage.
- Introspecting private Effect scope internals.
- Nested scope trees or multiple visible scope lanes in v1.
- Parallel finalizer-layout support in v1.
- Finalizer sound cues.
- Persisting panel history across tab changes, reloads, or unmounts.

## 4. Design Principles

1. The panel should represent real Effect finalizer semantics, not a fake side model.
2. Runtime state should live in atoms, not in an imperative React-owned class.
3. The feature should use small explicit helper APIs instead of magical instrumentation.
4. The default v1 layout should assume one implicit scope per example.
5. The visual language should stay faithful to the old site.
6. Reset semantics must be robust against stale asynchronous finalizer updates.

## 5. Recommended Architecture

### 5.1 High-level design

The recommended design adds a dedicated finalizer runtime service, provided by `VisualEffectManager` on each example run.

Example authors opt into the panel and use helper functions exposed from `defineExample(...).build(...)`.

Those helpers wrap public Effect APIs and emit visual state transitions into a new atom family.

The data flow should look like this:

```ts
defineExample({
  finalizerPanel: {},
  build: ({ addStep, finalizers }) => {
    finalizers.enable()

    const program = Effect.gen(function* () {
      yield* finalizers.add("Clean up", Effect.sync(() => {
        // cleanup logic
      }))
    })

    return addStep(program, { label: "effect" }).pipe(Effect.scoped)
  },
})
```

At runtime:

1. `VisualEffectManager.start(...)` creates a fresh finalizer panel state for that run.
2. It provides a `VisualFinalizers` service alongside `ControlSnapshot` and `Notifications`.
3. `finalizers.add(...)` and `finalizers.acquireRelease(...)` use that service to register visual finalizers and wrap cleanup execution.
4. React reads the panel atom and renders the panel below the nodes.

### 5.2 Why this is the right fit

This design matches the current architecture better than reviving the old `VisualScope` class.

It keeps runtime truth in one place, keeps React passive, and avoids coupling the UI to Effect internals that are not meant to be observed directly.

It also scales better than tracer-based instrumentation, because finalizers are cleanup registrations rather than normal work spans. Forcing them into step tracing would blur the meaning of the node visualization.

## 6. Public Authoring API

### 6.1 Example definition changes

`ExampleDefinitionOptions` should gain an explicit panel opt-in.

```ts
export interface ExampleFinalizerPanelDefinition {
  readonly title: string
}

export interface ExampleDefinition {
  readonly type: ExampleType
  readonly key: string
  readonly title: string
  readonly subtitle: string | undefined
  readonly description: string | undefined
  readonly steps: ReadonlyArray<StepDefinition>
  readonly controls: ReadonlyArray<AnyExampleControl>
  readonly program: RenderableEffect<RenderableResult, RenderableResult, ExampleEnvironment>
  readonly code: CodeSnippetDefinition
  readonly finalizerPanel: ExampleFinalizerPanelDefinition | undefined
}

export interface ExampleDefinitionOptions<Type extends ExampleType> {
  readonly type?: Type | undefined
  readonly label: string
  readonly subtitle?: string | undefined
  readonly description?: string | undefined
  readonly code: CodeSnippetConfig
  readonly resultHighlight?: HighlightSelector | ReadonlyArray<HighlightSelector>
  readonly finalizerPanel?: Partial<ExampleFinalizerPanelDefinition> | undefined
  readonly build: (
    ctx: BuildContext<Type>,
  ) => RenderableEffect<RenderableResult, RenderableResult, ExampleEnvironment>
}
```

The explicit `finalizerPanel` option is important because the old site rendered a visible placeholder panel even before any run began. The new site should do the same. React should not need to guess whether a panel should exist based on runtime events arriving later.

The default title should be `"FINALIZERS"`.

### 6.2 Build context additions

`BuildContext` should gain a `finalizers` namespace.

```ts
export interface BuildContext<Type extends ExampleType> {
  readonly addStep: { ... }
  readonly controls: { ... }
  readonly snippet: { ... }
  readonly finalizers: {
    readonly enable: (options?: { readonly title?: string | undefined }) => void
    readonly add: <R>(
      label: string,
      finalizer: Effect.Effect<void, never, R>,
    ) => Effect.Effect<void, never, R | ExampleEnvironment | Scope.Scope>
    readonly addExit: <R>(
      label: string,
      finalizer: (exit: Exit.Exit<unknown, unknown>) => Effect.Effect<void, never, R>,
    ) => Effect.Effect<void, never, R | ExampleEnvironment | Scope.Scope>
    readonly acquireRelease: <A, E, R, R2>(
      acquire: Effect.Effect<A, E, R>,
      options: {
        readonly label: string
        readonly release: (
          resource: A,
          exit: Exit.Exit<unknown, unknown>,
        ) => Effect.Effect<void, never, R2>
      },
    ) => Effect.Effect<A, E, R | R2 | ExampleEnvironment | Scope.Scope>
  }
}
```

### 6.3 Why `enable()` should exist

`enable()` does two jobs.

First, it makes panel intent explicit during `defineExample(...)`, which keeps constructor output deterministic.

Second, it gives the implementation a place to validate future options without forcing runtime heuristics.

The recommended rule is simple: examples that want the panel call `finalizers.enable()` during `build(...)`, and examples that do not want the panel do nothing.

### 6.4 Why helper wrappers should exist

The feature should not require example authors to manually register a visual event and then manually call `Effect.addFinalizer` in a second step.

That would be easy to get wrong and would fragment style across examples.

Instead, the helper wrappers should encode one canonical path.

### 6.5 Example: `Effect.addFinalizer`

```ts
export const addFinalizerExample = defineExample({
  label: "Effect.addFinalizer",
  description: "Register cleanup logic that always runs when the scope closes.",
  finalizerPanel: {},
  code: {
    language: "typescript",
    source: `const effect = Effect.gen(function* () {
  yield* Effect.addFinalizer(() => Console.log("cleanup"))
  yield* Effect.sleep("700 millis")
  return "Done"
}).pipe(Effect.scoped)`,
  },
  build: ({ addStep, finalizers }) => {
    finalizers.enable()

    const effect = addStep(
      Effect.gen(function* () {
        yield* finalizers.add("Clean up", Effect.sleep("800 millis"))
        yield* Effect.sleep("700 millis")
        return new PrimitiveResult("Done")
      }),
      {
        label: "effect",
        highlight: HighlightSelector.Text({ text: 'Effect.addFinalizer(() => Console.log("cleanup"))' }),
      },
    )

    return effect.pipe(Effect.scoped)
  },
})
```

### 6.6 Example: `Effect.acquireRelease`

```ts
const makeDatabase = finalizers.acquireRelease(connectDatabase(), {
  label: "Close database",
  release: (db) => Effect.sync(() => db.close()),
})

const makeCache = finalizers.acquireRelease(connectCache(), {
  label: "Flush cache",
  release: (cache) => Effect.sync(() => cache.flush()),
})

const makeLogger = finalizers.acquireRelease(openLogFile(), {
  label: "Close log file",
  release: (file) => Effect.sync(() => file.close()),
})
```

This matches the mental model Effect users already have.

Each resource helper remains a real resource acquisition, but now registration and cleanup are observable in the panel.

## 7. Runtime Service Design

### 7.1 New environment service

The implementation should add a per-run service that owns finalizer visualization updates.

```ts
export class VisualFinalizers extends ServiceMap.Service<
  VisualFinalizers,
  {
    readonly register: (label: string) => Effect.Effect<VisualFinalizerId>
    readonly start: (id: VisualFinalizerId) => Effect.Effect<void>
    readonly end: (
      id: VisualFinalizerId,
      exit: Exit.Exit<void, never>,
    ) => Effect.Effect<void>
    readonly run: <R>(
      id: VisualFinalizerId,
      effect: Effect.Effect<void, never, R>,
    ) => Effect.Effect<void, never, R>
  }
>()("VisualFinalizers") {}
```

`ExampleEnvironment` should therefore become:

```ts
export type ExampleEnvironment = ControlSnapshot | Notifications | VisualFinalizers
```

### 7.2 Why a service is better than direct atom writes

The service keeps all run-local sequencing in one place.

It can:

1. generate stable registration IDs,
2. stamp the current run identifier onto updates,
3. centralize panel-state transitions,
4. and hide the registry mutation details from example authors.

That keeps the public API small and the runtime safer.

### 7.3 Helper implementation shape

The helpers in `constructors.ts` should delegate to the runtime service.

`finalizers.add(...)` should look conceptually like this:

```ts
const add = <R>(
  label: string,
  finalizer: Effect.Effect<void, never, R>,
): Effect.Effect<void, never, R | ExampleEnvironment | Scope.Scope> =>
  Effect.gen(function* () {
    const visual = yield* VisualFinalizers
    const id = yield* visual.register(label)

    yield* Effect.addFinalizer((_) => visual.run(id, finalizer))
  })
```

`finalizers.addExit(...)` should preserve the exit-sensitive callback shape:

```ts
const addExit = <R>(
  label: string,
  finalizer: (exit: Exit.Exit<unknown, unknown>) => Effect.Effect<void, never, R>,
): Effect.Effect<void, never, R | ExampleEnvironment | Scope.Scope> =>
  Effect.gen(function* () {
    const visual = yield* VisualFinalizers
    const id = yield* visual.register(label)

    yield* Effect.addFinalizer((exit) => visual.run(id, finalizer(exit)))
  })
```

### 7.4 `acquireRelease` must preserve Effect semantics

The `finalizers.acquireRelease(...)` helper must not weaken the guarantees of `Effect.acquireRelease`.

That means the implementation should preserve the uninterruptible acquire-register boundary.

The implementation should therefore be built in the same style as Effect's own internal `acquireRelease`, but with an additional visual registration step after acquisition succeeds.

Recommended pseudocode:

```ts
const acquireRelease = <A, E, R, R2>(
  acquire: Effect.Effect<A, E, R>,
  options: {
    readonly label: string
    readonly release: (
      resource: A,
      exit: Exit.Exit<unknown, unknown>,
    ) => Effect.Effect<void, never, R2>
  },
): Effect.Effect<A, E, R | R2 | ExampleEnvironment | Scope.Scope> =>
  Effect.uninterruptibleMask(({ restore }) =>
    Effect.flatMap(restore(acquire), (resource) =>
      Effect.gen(function* () {
        const visual = yield* VisualFinalizers
        const id = yield* visual.register(options.label)

        yield* Effect.addFinalizer((exit) =>
          visual.run(id, options.release(resource, exit)),
        )

        return resource
      }),
    ),
  )
```

This keeps the finalizer registration truthful.

The card appears only once the resource has actually been acquired and a release action has actually been attached.

## 8. Runtime State Model

### 8.1 New domain types

`src/lib/examples/domain.ts` should gain a dedicated finalizer panel model.

```ts
export type VisualFinalizerPhase =
  | "Pending"
  | "Running"
  | "Succeeded"
  | "Failed"
  | "Interrupted"

export interface VisualFinalizerEntry {
  readonly id: string
  readonly label: string
  readonly registrationIndex: number
  readonly registeredAt: DateTime.Utc
  readonly phase: VisualFinalizerPhase
  readonly startedAt: DateTime.Utc | undefined
  readonly endedAt: DateTime.Utc | undefined
}

export type VisualFinalizerPanelStatus = "Idle" | "Active" | "Releasing" | "Released"

export interface VisualFinalizerPanelState {
  readonly runId: number
  readonly status: VisualFinalizerPanelStatus
  readonly finalizers: ReadonlyArray<VisualFinalizerEntry>
}
```

### 8.2 Why one implicit panel is enough in v1

The old site did not render a scope tree. It rendered one finalizer lane.

That is still the right v1 target.

It covers the two examples users most expect:

1. `Effect.addFinalizer`
2. `Effect.acquireRelease`

Both can be explained clearly with a single finalizer panel and without introducing nested-scope complexity.

### 8.3 Panel status semantics

- `Idle`: no run is active and no finalizers are registered.
- `Active`: the example run is active and at least zero or more finalizers may be registered.
- `Releasing`: at least one finalizer has started executing.
- `Released`: all registered finalizers for the current run have completed.

The UI does not need to show the status text explicitly in v1, but it should use it for styling and placeholder behavior.

## 9. Atom Model and State Reduction

### 9.1 New atom family

`VisualEffectManager.ts` should define a new atom family.

```ts
export const finalizerPanelAtom = Atom.family((_definition: ExampleDefinition) =>
  Atom.make<VisualFinalizerPanelState>({
    runId: 0,
    status: "Idle",
    finalizers: [],
  }),
)
```

### 9.2 Prefer a pure reducer

The update logic should be expressed through a small pure reducer instead of open-coded atom mutations scattered across the manager.

Recommended event union:

```ts
export type VisualFinalizerEvent =
  | { readonly _tag: "RunStarted"; readonly runId: number }
  | {
      readonly _tag: "Registered"
      readonly runId: number
      readonly id: string
      readonly label: string
      readonly registrationIndex: number
      readonly at: DateTime.Utc
    }
  | { readonly _tag: "Started"; readonly runId: number; readonly id: string; readonly at: DateTime.Utc }
  | {
      readonly _tag: "Finished"
      readonly runId: number
      readonly id: string
      readonly at: DateTime.Utc
      readonly phase: Exclude<VisualFinalizerPhase, "Pending" | "Running">
    }
  | { readonly _tag: "Reset"; readonly runId: number }
```

Reducer sketch:

```ts
const reduceFinalizerPanel = (
  state: VisualFinalizerPanelState,
  event: VisualFinalizerEvent,
): VisualFinalizerPanelState => {
  if (event._tag !== "RunStarted" && event._tag !== "Reset" && event.runId !== state.runId) {
    return state
  }

  switch (event._tag) {
    case "RunStarted":
      return { runId: event.runId, status: "Active", finalizers: [] }
    case "Registered":
      return {
        ...state,
        status: state.status === "Idle" ? "Active" : state.status,
        finalizers: [...state.finalizers, {
          id: event.id,
          label: event.label,
          registrationIndex: event.registrationIndex,
          registeredAt: event.at,
          phase: "Pending",
          startedAt: undefined,
          endedAt: undefined,
        }],
      }
    case "Started":
      return {
        ...state,
        status: "Releasing",
        finalizers: state.finalizers.map((finalizer) =>
          finalizer.id === event.id
            ? { ...finalizer, phase: "Running", startedAt: event.at }
            : finalizer,
        ),
      }
    case "Finished": {
      const nextFinalizers = state.finalizers.map((finalizer) =>
        finalizer.id === event.id
          ? { ...finalizer, phase: event.phase, endedAt: event.at }
          : finalizer,
      )

      const hasPendingOrRunning = nextFinalizers.some(
        (finalizer) => finalizer.phase === "Pending" || finalizer.phase === "Running",
      )

      return {
        ...state,
        status: hasPendingOrRunning ? "Releasing" : "Released",
        finalizers: nextFinalizers,
      }
    }
    case "Reset":
      return { runId: event.runId, status: "Idle", finalizers: [] }
  }
}
```

### 9.3 Why `runId` is mandatory

`reset()` can happen while cleanup is still running or while delayed async state writes are still in flight.

Without a run identifier, a stale finalizer completion from the previous run could mutate the next run's panel.

The reducer should therefore ignore stale events.

## 10. `VisualEffectManager` Integration

### 10.1 Start behavior

When `VisualEffectManager.start(example)` begins a run, it should:

1. increment a per-example run counter,
2. initialize `finalizerPanelAtom(example)` with `RunStarted`,
3. build a `VisualFinalizers` service bound to that example and run identifier,
4. provide that service to `example.program`.

Conceptually:

```ts
const visualFinalizers = makeVisualFinalizers({
  example,
  runId,
  registry,
  clock,
})

const services = ServiceMap.make(ControlSnapshot, snapshot)
  .pipe(ServiceMap.add(Notifications, { notify }))
  .pipe(ServiceMap.add(VisualFinalizers, visualFinalizers))
```

### 10.2 Stop behavior

`stop(example)` should keep its current semantics: interrupt the example fiber.

Because Effect finalizers run during interruption, the panel should remain live and show release progress.

That means `stop` must not immediately clear the finalizer atom.

### 10.3 Reset behavior

`reset(example)` should continue to be a hard visual reset.

It should:

1. interrupt and remove the example fiber,
2. reset node and schedule atoms as it does today,
3. clear the finalizer panel atom to `Idle`,
4. invalidate stale finalizer updates by advancing `runId`.

This preserves the current reset affordance and matches user expectations from the old site.

### 10.4 Failure classification

The wrapper service should classify finalizer completion using `Exit`.

Recommended mapping:

- successful finalizer effect -> `Succeeded`
- interrupt-only cause -> `Interrupted`
- any other failure or defect -> `Failed`

This is more informative than the old site, but still visually simple.

## 11. UI Design

### 11.1 Layout placement

The panel should render in `src/components/landing/examples/VisualEffect.tsx` immediately below the node strip.

Required order:

1. `VisualEffectControls`
2. `VisualEffectConfigPanel`
3. `VisualEffectNodes`
4. `VisualEffectFinalizerPanel` when enabled
5. `VisualEffectScheduleTimeline` when present
6. `VisualEffectCodeSnippet`

This keeps the panel visually attached to the runtime objects it explains.

### 11.2 New React APIs

`VisualEffectProvider.tsx` should expose:

```ts
export const useFinalizerPanel = () => {
  const example = useExampleDefinition()
  return useAtomValue(finalizerPanelAtom(example))
}
```

### 11.3 New components

Recommended new files:

- `src/components/landing/examples/VisualEffectFinalizerPanel.tsx`
- `src/components/landing/examples/VisualEffectFinalizerCard.tsx`

`VisualEffectFinalizerPanel.tsx` should own the layout and card positioning.

`VisualEffectFinalizerCard.tsx` should own the per-card color, icon, and motion treatment.

### 11.4 Panel visual parity requirements

The panel should preserve the old visual grammar.

It should render:

1. a fixed-height lane,
2. centered `FINALIZERS` label text,
3. faint animated chevrons on both sides,
4. pending cards stacked from the left,
5. a running card centered and slightly enlarged,
6. completed cards stacked from the right.

The v1 layout may still use the same 200px card width and 88px lane height from the old site, adjusted only as needed for the new card shell.

### 11.5 Card states

Recommended card phases and treatment:

- `Pending`: zinc background, muted checkbox, white monospace label.
- `Running`: blue glow, pulse, centered emphasis.
- `Succeeded`: green completion state with check mark.
- `Failed`: red completion state with alert icon.
- `Interrupted`: orange completion state with stop or octagon icon.

### 11.6 Motion behavior

The panel should retain the old motion language:

- cards spring in when registered,
- the active card slides to the center when release begins,
- running cards pulse softly,
- completed cards settle to the right,
- and a newly completed card emits a short flash.

All animations must respect the existing `MotionConfig reducedMotion="user"` wrapper.

### 11.7 Empty and idle state

When the example has never run or has been reset, the panel should still be visible if `finalizerPanel` is enabled.

It should show the centered placeholder lane and no cards.

That preserves the old site's affordance: the panel teaches the concept before the visitor presses Run.

## 12. Ordering Semantics

### 12.1 Registration order

Finalizers should be displayed on the left in the same order they were registered.

This makes the stack easy to read as it grows.

### 12.2 Execution order

Execution should follow Effect's real LIFO semantics.

That means the last registered pending card should be the first one that moves to the center and runs.

### 12.3 Completion order

In a sequential scope, completed cards will naturally accumulate on the right in reverse registration order.

That is exactly the educational behavior we want users to observe.

## 13. Runtime Ordering vs Legacy Timing

The old site manually triggered cleanup after the main task had already reached a terminal visual state.

The new site should prefer true runtime behavior instead.

In Effect, a scoped program does not fully complete until its finalizers finish.

That means the result node may remain visually `Running` while the finalizer panel is executing cleanup.

That is acceptable and desirable.

It teaches a more truthful model: resource cleanup is part of the effect's lifecycle, not a separate afterthought.

## 14. Example Migration Plan

### 14.1 `Effect.addFinalizer`

Port the old `effect-add-finalizer` demo into `src/lib/examples/catalog/`.

The new example should preserve the old behavior:

- configurable outcome (`succeed`, `fail`, `die`, `interrupt`),
- exactly one finalizer registration,
- clear cleanup label,
- scoped execution.

Recommended shape:

```ts
export const addFinalizerExample = defineExample({
  label: "Effect.addFinalizer",
  description: "Register cleanup logic that always runs when the scope closes.",
  finalizerPanel: {},
  build: ({ addStep, controls, finalizers }) => {
    finalizers.enable()

    const outcome = controls.register(makeSegmentedOutcomeControl(...))

    const effect = addStep(
      Effect.gen(function* () {
        const selected = yield* controls.read(outcome)

        yield* finalizers.add("Clean up", Effect.sleep("800 millis"))
        yield* Effect.sleep("700 millis")

        switch (selected) {
          case "succeed":
            return new PrimitiveResult("Done")
          case "fail":
            return yield* Effect.fail(new ErrorResult("Boom"))
          case "die":
            return yield* Effect.die(new ErrorResult("Defect"))
          case "interrupt":
            yield* Effect.sleep("1 hour")
            return new PrimitiveResult("Interrupted")
        }
      }),
      { label: "effect", highlight: ... },
    )

    return effect.pipe(Effect.scoped)
  },
})
```

### 14.2 `Effect.acquireRelease`

Port the old `effect-acquire-release` example with three acquired resources and one outer result node.

The example should use:

- one helper call per resource,
- one visible finalizer card per resource,
- one outer effect that uses the resources,
- the existing success / fail / die rotation or an equivalent deterministic sequence.

This example is important because it shows why finalizer ordering matters.

Users should be able to watch `logger`, `cache`, and `database` resources release in reverse order.

### 14.3 Scope category population

After those two examples are implemented, `src/lib/examples/catalog.ts` should populate the `scope` category.

Recommended initial order:

1. `Effect.addFinalizer`
2. `Effect.acquireRelease`

## 15. File-Level Change Plan

### Files to modify

- `src/lib/examples/constructors.ts`
  - Add `finalizerPanel` to `ExampleDefinition`.
  - Add `finalizers` to `BuildContext`.
  - Add helper implementations and `enable()` support.

- `src/lib/examples/domain.ts`
  - Add finalizer panel domain types.

- `src/services/VisualEffectManager.ts`
  - Add `finalizerPanelAtom(example)`.
  - Create and provide the `VisualFinalizers` runtime service.
  - Reset finalizer state safely.

- `src/components/landing/examples/VisualEffectProvider.tsx`
  - Add `useFinalizerPanel()`.

- `src/components/landing/examples/VisualEffect.tsx`
  - Insert the panel below nodes.

- `src/lib/examples/catalog.ts`
  - Populate the `scope` category.

### New files

- `src/components/landing/examples/VisualEffectFinalizerPanel.tsx`
- `src/components/landing/examples/VisualEffectFinalizerCard.tsx`
- `src/lib/examples/catalog/effect-add-finalizer.ts`
- `src/lib/examples/catalog/effect-acquire-release.ts`

### Files that should stay unchanged in v1

- `src/components/landing/examples/VisualEffectNode.tsx`
- `src/lib/examples/snippet-highlights.ts`
- `src/services/SoundManager.ts`

The feature should slot into the current framework rather than trigger a broad refactor.

## 16. Testing Strategy

### 16.1 Reducer tests

The pure finalizer reducer should have direct tests for:

1. registration appends a pending finalizer,
2. start moves the matching finalizer to `Running`,
3. finish updates the finalizer phase and end timestamp,
4. final panel status becomes `Released` when the last pending or running finalizer ends,
5. stale events from an older `runId` are ignored,
6. reset clears the panel.

### 16.2 Helper integration tests

Add focused tests for helper semantics:

1. `finalizers.add(...)` registers exactly one visual finalizer.
2. `finalizers.add(...)` executes on success, failure, die, and interrupt.
3. `finalizers.acquireRelease(...)` does not register when acquire fails.
4. `finalizers.acquireRelease(...)` registers after successful acquire.
5. registered `acquireRelease` finalizers run in LIFO order inside a scoped program.

### 16.3 Manual verification

Manual checks remain essential because this feature is highly visual.

Required checks:

1. Run `Effect.addFinalizer` and confirm the pending card appears as soon as the finalizer is registered.
2. Complete the example and confirm the card moves to the center, runs, and then settles to the right.
3. Interrupt the example and confirm cleanup still executes.
4. Run `Effect.acquireRelease` and confirm resources release in reverse registration order.
5. Reset during cleanup and confirm the panel clears immediately without stale cards leaking into the next run.
6. Confirm the panel only appears for examples that enabled it.
7. Confirm reduced-motion mode still communicates state changes clearly.

### 16.4 Build checks

- `pnpm check`
- `pnpm lint`
- `pnpm build`

## 17. Acceptance Criteria

The feature is complete when all of the following are true.

1. Example authors can opt into a finalizer panel with a small explicit API.
2. Finalizer registration appears visually as soon as it occurs.
3. Finalizer execution appears visually when cleanup starts.
4. Execution order reflects real Effect LIFO semantics.
5. The panel is rendered underneath the effect nodes and inside the existing card shell.
6. The panel visually matches the old site's pending / running / completed stacking model.
7. Reset semantics are safe against stale asynchronous finalizer updates.
8. The `scope` tab contains at least `Effect.addFinalizer` and `Effect.acquireRelease` examples.

## 18. Rejected Alternatives

### 18.1 Reviving the old `VisualScope` class

This would be fast to sketch, but it would duplicate runtime truth and drift away from real Effect semantics.

The old site used that approach because it did not yet have the new atom-driven runtime architecture.

The new site should not go backwards.

### 18.2 Tracer-only instrumentation

This is a poor fit.

Finalizers are cleanup registrations, not user-authored step spans. Tracing them as normal spans would make the node model noisier and would still not solve the labeling problem cleanly.

### 18.3 Scope-internal introspection

This would couple the website to Effect internals that are not part of the intended public authoring model.

That complexity is unnecessary for the user-visible outcome we want.

## 19. Final Recommendation

The right implementation is explicit, stateful, and boring.

Add a real finalizer runtime service. Expose small helper wrappers for `Effect.addFinalizer` and `Effect.acquireRelease`. Store panel state in atoms. Render a dedicated panel below the nodes. Keep the old visual language, but let the new architecture own the truth.

That approach restores one of the most memorable pieces of the old visualizer without compromising the new site's cleaner design.

## 20. Open Questions

None.
