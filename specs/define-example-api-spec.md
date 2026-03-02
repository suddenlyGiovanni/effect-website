# Example Definition + Tracer Tracking Specification

## Intent

This specification defines a fresh API for authoring interactive Effect examples that are easy to write, easy to visualize, and deterministic for the UI.

The design is centered around two ideas:

1. `defineExample(...)` builds a **static UI blueprint eagerly** and returns the executable effect program.
2. Runtime updates are produced from **Effect's built-in tracing** via a custom tracer, not from a parallel custom execution engine.

The authoring API should feel like normal Effect code, with one lightweight helper (`addStep`) that can be used directly or in a pipe.

## Mandatory references before implementation

If this spec is used in a clean session, the implementation pass must read these files first.

### Project files

- `src/components/VisualEffectDemo.tsx` (legacy single-file prototype; reference behavior only)
- `src/components/landing/examples/InteractiveExamples.tsx` (new examples entrypoint)
- `src/components/landing/examples/Example.tsx` (target UI component)
- `src/components/landing/examples/ExampleHeader.tsx` (header surface for run controls)
- `src/components/landing/sections/Examples.astro` (landing section mounting the React island)
- `src/pages/index.astro` (route composition including landing sections)

### Effect v4 references (`.repos/effect-smol`)

- `.repos/effect-smol/LLMS.md`
- `.repos/effect-smol/packages/effect/src/Effect.ts` (specifically `withSpan`, `withTracer`, `withTracerEnabled`, `currentSpan`)
- `.repos/effect-smol/packages/effect/src/Tracer.ts` (custom tracer interface and span model)
- `.repos/effect-smol/packages/effect/src/unstable/reactivity/Atom.ts` (`Atom.runtime`, `Atom.family`, `Atom.pull`, `Atom.keepAlive`)
- `.repos/effect-smol/packages/atom/react/src/Hooks.ts` (`useAtomValue`, `useAtomSuspense`)
- `.repos/effect-smol/packages/atom/react/src/RegistryContext.ts` (`RegistryProvider`, default registry behavior)
- `.repos/effect-smol/packages/atom/react/src/ReactHydration.ts` (`HydrationBoundary`)

These references are mandatory because they define the runtime contracts this specification depends on.

## Implementation output file plan

Implementation should produce/modify at least these files.

- `src/services/VisualEffectManager.ts` (full service + layer + tracer adapter)
- `src/lib/examples/defineExample.ts` (definition API: `defineExample`, `addStep`, `withExampleRun`)
- `src/lib/examples/catalog.ts` (exported example definitions and `EXAMPLE_BY_KEY` map)
- `src/lib/examples/events.ts` (event schemas, id schemas, tagged errors)
- `src/lib/examples/ui-state.ts` (Atom runtime/state atoms + reducers)
- `src/hooks/examples/useExampleRun.ts` (run action helper for new example system)
- `src/components/landing/examples/Example.tsx` (render blueprint + runtime status)
- `src/components/landing/examples/InteractiveExamples.tsx` (wire new example definitions)

If implementation chooses different file names, it must still preserve this module separation.

## Existing code interaction policy

The repository currently keeps the older prototype mostly inside `src/components/VisualEffectDemo.tsx`.

For this implementation, treat `src/components/VisualEffectDemo.tsx` as legacy reference only and migrate landing examples to the new `defineExample` + manager + Atom runtime stack.

Required constraints:

- do not route new landing examples through `VisualEffectDemo` internals.
- do not mix legacy and new runtime state in the same landing examples surface.
- keep `VisualEffectDemo` compiling unless explicitly removed in a dedicated cleanup commit.

## Authoring Experience

The intended usage is:

```ts
import * as Effect from "effect/Effect"

declare const readTemperature: (city: string) => Effect.Effect<string>

const allExample = defineExample({
  key: "examples/concurrency/all",
  label: "Effect.all",
  build: ({ addStep }) =>
    Effect.all([
      addStep(readTemperature("New York"), { label: "nyc" }),
      readTemperature("Berlin").pipe(addStep({ label: "berlin" })),
      addStep(readTemperature("Tokyo"), { label: "tokyo" }),
      addStep(readTemperature("London"), { label: "london" }),
    ]),
})
```

Important behavior:

- `defineExample` executes `build` eagerly to collect step metadata for pre-run UI.
- `build` returns the effect program (it must return an `Effect`, not run it).
- `addStep` both registers a UI step and wraps the effect with tracing metadata.

## Goals

- Keep example authoring simple and composable.
- Support eager UI rendering before first run.
- Use Effect tracing as the runtime source of truth.
- Keep contracts schema-first with branded ids and tagged errors.
- Keep runtime in-memory and bounded.

## Non-Goals

- Persisting example history.
- Supporting arbitrary runtime introspection of any effect without instrumentation.
- Building a generic observability backend.

## Runtime dependency assumptions

This specification assumes the versions already present in this repository:

- `effect@4.0.0-beta.19`
- `@effect/atom-react@4.0.0-beta.19`

If versions are upgraded, verify `Tracer` and Atom APIs before implementation.

## High-Level Architecture

The design has two layers that intentionally do different jobs.

### 1) Definition Layer (`defineExample`)

At definition time, we build:

- `blueprint`: static data used by UI before execution.
- `effect`: executable effect whose spans are tagged for runtime tracking.

This gives the UI immediate structure and avoids fragile pre-run introspection.

### 2) Runtime Layer (`VisualEffectManager` + custom tracer)

At runtime, the manager provides:

- a custom tracer (built on Effect `Tracer` interface),
- event stream for UI updates,
- run registry / cancellation / bounded replay.

Combinators (`withExampleRun`, `addStep`) ensure tracked programs execute under this tracer.

## Schema-First Types

All public data shapes must be represented with Effect Schema and derived types.

### Branded identifier schemas

```ts
import { Schema } from "effect"

export const ExampleKeySchema = Schema.String.pipe(Schema.brand("ExampleKey"))
export type ExampleKey = Schema.Schema.Type<typeof ExampleKeySchema>

export const RunIdSchema = Schema.String.pipe(Schema.brand("RunId"))
export type RunId = Schema.Schema.Type<typeof RunIdSchema>

export const FlowIdSchema = Schema.String.pipe(Schema.brand("FlowId"))
export type FlowId = Schema.Schema.Type<typeof FlowIdSchema>

export const StepNodeIdSchema = Schema.String.pipe(Schema.brand("StepNodeId"))
export type StepNodeId = Schema.Schema.Type<typeof StepNodeIdSchema>

export const StepInstanceIdSchema = Schema.String.pipe(Schema.brand("StepInstanceId"))
export type StepInstanceId = Schema.Schema.Type<typeof StepInstanceIdSchema>
```

Notes:

- `StepNodeId` identifies the static step in the blueprint.
- `StepInstanceId` identifies one runtime execution instance of a step.

Boundary parsing rule:

- create branded ids by decoding with schema at boundaries (`Schema.decodeUnknown*`).
- do not use type assertions for branded ids in implementation code.

Suggested helpers:

```ts
import { Schema } from "effect"

export const mkExampleKey = Schema.decodeUnknownSync(ExampleKeySchema)
export const mkStepNodeId = Schema.decodeUnknownSync(StepNodeIdSchema)
```

## Blueprint Model (Pre-Run UI)

```ts
import { Schema } from "effect"

export const StepBlueprintSchema = Schema.Struct({
  nodeId: StepNodeIdSchema,
  label: Schema.String,
  order: Schema.Number,
  parentNodeId: Schema.optional(StepNodeIdSchema),
  optional: Schema.optional(Schema.Boolean),
  description: Schema.optional(Schema.String),
})

export const ExampleBlueprintSchema = Schema.Struct({
  key: ExampleKeySchema,
  label: Schema.String,
  steps: Schema.Array(StepBlueprintSchema),
})

export type ExampleBlueprint = Schema.Schema.Type<typeof ExampleBlueprintSchema>
```

Requirements:

- `steps` are deterministic in order.
- `nodeId` is unique within an example.
- `parentNodeId` is optional and only used for nested display relationships.

## Runtime Event Model

```ts
import { Schema } from "effect"

export const Event = Schema.Union(
  Schema.Struct({
    _tag: Schema.Literal("RunRequested"),
    seq: Schema.Number,
    atMs: Schema.Number,
    key: ExampleKeySchema,
    runId: RunIdSchema,
  }),
  Schema.Struct({
    _tag: Schema.Literal("RunStarted"),
    seq: Schema.Number,
    atMs: Schema.Number,
    key: ExampleKeySchema,
    runId: RunIdSchema,
    flowId: FlowIdSchema,
    label: Schema.String,
  }),
  Schema.Struct({
    _tag: Schema.Literal("StepStarted"),
    seq: Schema.Number,
    atMs: Schema.Number,
    key: ExampleKeySchema,
    runId: RunIdSchema,
    flowId: FlowIdSchema,
    stepInstanceId: StepInstanceIdSchema,
    nodeId: StepNodeIdSchema,
    label: Schema.String,
    parentStepInstanceId: Schema.optional(StepInstanceIdSchema),
  }),
  Schema.Struct({
    _tag: Schema.Literal("StepSucceeded"),
    seq: Schema.Number,
    atMs: Schema.Number,
    key: ExampleKeySchema,
    runId: RunIdSchema,
    stepInstanceId: StepInstanceIdSchema,
    nodeId: StepNodeIdSchema,
    durationMs: Schema.Number,
    result: Schema.Unknown,
  }),
  Schema.Struct({
    _tag: Schema.Literal("StepFailed"),
    seq: Schema.Number,
    atMs: Schema.Number,
    key: ExampleKeySchema,
    runId: RunIdSchema,
    stepInstanceId: StepInstanceIdSchema,
    nodeId: StepNodeIdSchema,
    durationMs: Schema.Number,
    failure: Schema.Unknown,
  }),
  Schema.Struct({
    _tag: Schema.Literal("StepInterrupted"),
    seq: Schema.Number,
    atMs: Schema.Number,
    key: ExampleKeySchema,
    runId: RunIdSchema,
    stepInstanceId: StepInstanceIdSchema,
    nodeId: StepNodeIdSchema,
    durationMs: Schema.Number,
    reason: Schema.Literal("user", "parent", "runtime"),
  }),
  Schema.Struct({
    _tag: Schema.Literal("StepFinished"),
    seq: Schema.Number,
    atMs: Schema.Number,
    key: ExampleKeySchema,
    runId: RunIdSchema,
    stepInstanceId: StepInstanceIdSchema,
    nodeId: StepNodeIdSchema,
    durationMs: Schema.Number,
  }),
  Schema.Struct({
    _tag: Schema.Literal("RunSucceeded"),
    seq: Schema.Number,
    atMs: Schema.Number,
    key: ExampleKeySchema,
    runId: RunIdSchema,
    durationMs: Schema.Number,
    result: Schema.Unknown,
  }),
  Schema.Struct({
    _tag: Schema.Literal("RunFailed"),
    seq: Schema.Number,
    atMs: Schema.Number,
    key: ExampleKeySchema,
    runId: RunIdSchema,
    durationMs: Schema.Number,
    failure: Schema.Unknown,
  }),
  Schema.Struct({
    _tag: Schema.Literal("RunInterrupted"),
    seq: Schema.Number,
    atMs: Schema.Number,
    key: ExampleKeySchema,
    runId: RunIdSchema,
    durationMs: Schema.Number,
    reason: Schema.Literal("user", "parent", "runtime"),
  }),
  Schema.Struct({
    _tag: Schema.Literal("RunFinished"),
    seq: Schema.Number,
    atMs: Schema.Number,
    key: ExampleKeySchema,
    runId: RunIdSchema,
    durationMs: Schema.Number,
  }),
  Schema.Struct({
    _tag: Schema.Literal("RunRejected"),
    seq: Schema.Number,
    atMs: Schema.Number,
    key: ExampleKeySchema,
    policy: Schema.Literal("deny"),
  }),
  Schema.Struct({
    _tag: Schema.Literal("CancelRequested"),
    seq: Schema.Number,
    atMs: Schema.Number,
    key: ExampleKeySchema,
    runId: RunIdSchema,
  }),
  Schema.Struct({
    _tag: Schema.Literal("UnknownStepNodeObserved"),
    seq: Schema.Number,
    atMs: Schema.Number,
    key: ExampleKeySchema,
    runId: RunIdSchema,
    observedNodeId: Schema.String,
  }),
  Schema.Struct({
    _tag: Schema.Literal("DroppedEvents"),
    seq: Schema.Number,
    atMs: Schema.Number,
    dropped: Schema.Number,
  }),
)

export type Event = Schema.Schema.Type<typeof Event>
```

## Errors

Service errors must use `Schema.TaggedErrorClass`.

```ts
import { Schema } from "effect"

export class RunNotFound extends Schema.TaggedErrorClass<RunNotFound>()(
  "RunNotFound",
  { runId: RunIdSchema },
) {}

export class DuplicateStepNodeId extends Schema.TaggedErrorClass<DuplicateStepNodeId>()(
  "DuplicateStepNodeId",
  { key: ExampleKeySchema, nodeId: StepNodeIdSchema },
) {}
```

## API Surface

### `defineExample`

`defineExample` is a pure definition helper. It runs `build` eagerly to collect step blueprint and returns a typed example definition.

```ts
import * as Effect from "effect/Effect"

export interface AddStepOptions {
  readonly id?: StepNodeId
  readonly label: string
  readonly description?: string
  readonly parentId?: StepNodeId
  readonly optional?: boolean
}

export interface BuildContext {
  readonly addStep: {
    <A, E, R>(self: Effect.Effect<A, E, R>, options: AddStepOptions): Effect.Effect<A, E, R>
    (options: AddStepOptions): <A, E, R>(self: Effect.Effect<A, E, R>) => Effect.Effect<A, E, R>
  }
}

export interface ExampleDefinition<A, E, R> {
  readonly key: ExampleKey
  readonly label: string
  readonly blueprint: ExampleBlueprint
  readonly effect: Effect.Effect<A, E, R | VisualEffectManager>
}

export declare const defineExample: <A, E, R>(input: {
  readonly key: ExampleKey
  readonly label: string
  readonly build: (ctx: BuildContext) => Effect.Effect<A, E, R>
}) => ExampleDefinition<A, E, R>
```

Behavior details:

- `build` is called exactly once during definition.
- each `addStep` application registers one blueprint step.
- if `id` is omitted, step id is generated deterministically (`step-0`, `step-1`, ...).
- duplicate `nodeId` is a definition-time error.
- returned `effect` is automatically wrapped with run-level tracking.

Deterministic id/order algorithm:

- maintain `nextOrder` counter initialized to `0`.
- each `addStep` call increments `nextOrder` and assigns that value to `order`.
- default id for omitted `id` is `step-${order}`.
- blueprint steps are stored in call order and frozen before return.

### Example catalog pattern (required)

This specification uses a module-level catalog for discovery, not service-level example registration.

```ts
export const EXAMPLES = [allExample, retryExample, raceExample] as const

export const EXAMPLE_BY_KEY = new Map(EXAMPLES.map((example) => [example.key, example] as const))
```

UI should read blueprints directly from `ExampleDefinition` values in this catalog.

### `addStep`

`addStep` is dual and does two things in one call:

1. registers static step metadata into the blueprint collector,
2. wraps the provided effect with tracing metadata for runtime capture.

This is the core authoring convenience: one helper controls both pre-run UI definition and runtime trace observability.

Required implementation behavior for `addStep`:

- register step in blueprint collector with deterministic `order`
- wrap the effect with `Effect.withSpan(options.label, { attributes: ... })`
- include required `ve.*` attributes (`ve.kind=step`, `ve.example.key`, `ve.step.nodeId`, `ve.step.label`)
- support dual usage (`addStep(effect, options)` and `effect.pipe(addStep(options))`)

### `withExampleRun` (internal/public utility)

`defineExample` should internally apply a run-level combinator to the built effect. This combinator is useful to expose for advanced usage.

```ts
export interface WithExampleRunOptions<A, E> {
  readonly key: ExampleKey
  readonly label: string
  readonly policy?: "deny" | "interrupt-previous" | "allow"
  readonly successSchema?: Schema.Schema<A, unknown>
  readonly failureSchema?: Schema.Schema<E, unknown>
}

export declare const withExampleRun: {
  <A, E>(options: WithExampleRunOptions<A, E>):
    <R>(self: Effect.Effect<A, E, R>) => Effect.Effect<A, E, R | VisualEffectManager>
}
```

Required implementation behavior for `withExampleRun`:

- allocate `runId` before program start
- emit `RunRequested`
- apply concurrency policy
- if accepted, run `self` under both:
  - `Effect.withTracer(manager.tracer)`
  - root `Effect.withSpan(options.label, { attributes: ... })` carrying required `ve.*` keys
- emit `RunRejected` for deny policy collisions

## VisualEffectManager Service

```ts
import { Effect, Layer, ServiceMap, Stream } from "effect"
import type * as Tracer from "effect/Tracer"

export interface RunSnapshot {
  readonly runId: RunId
  readonly key: ExampleKey
  readonly status: "running" | "succeeded" | "failed" | "interrupted"
  readonly startedAtMs: number
  readonly endedAtMs: number | undefined
}

export class VisualEffectManager extends ServiceMap.Service<
  VisualEffectManager,
  {
    readonly tracer: Tracer.Tracer
    readonly events: Stream.Stream<Event>
    readonly eventsFromSeq: (fromSeq: number) => Stream.Stream<Event>
    readonly cancelRun: (runId: RunId, reason?: "user" | "parent" | "runtime") => Effect.Effect<boolean>
    readonly runSnapshot: (runId: RunId) => Effect.Effect<RunSnapshot, RunNotFound>
    readonly clearCompleted: (olderThanMs: number) => Effect.Effect<number>
  }
>()("website/services/VisualEffectManager") {
  static readonly layer = Layer.effect(this, this.make)
}
```

Notes:

- manager runtime remains in-memory only.
- `events` is the live stream (plus bounded replay if configured globally).
- `eventsFromSeq(fromSeq)` returns replay + live stream beginning strictly after `fromSeq`.

## Manager internal state requirements

The implementation must keep these internal structures:

- `seqRef: Ref<number>` for monotonic event sequence.
- `pubsub: PubSub<Event>` with bounded sliding behavior.
- `history: ring buffer<Event>` for replay support.
- `activeRuns: Map<RunId, { key: ExampleKey; fiber: Fiber.Fiber<unknown, unknown>; startedAtMs: number; flowId: FlowId }>`.
- `flowToRun: Map<FlowId, RunId>` for trace/span -> run correlation.
- `spanToStep: Map<string, { runId: RunId; key: ExampleKey; nodeId: StepNodeId; stepInstanceId: StepInstanceId; startedAtMs: number }>` where map key is tracer `spanId`.
- `runToKeyIndex: Map<ExampleKey, Set<RunId>>` for policy checks.

Suggested defaults:

- live pubsub capacity: `2048`
- replay buffer size: `512`

These defaults can be constants in `VisualEffectManager.ts`.

## Tracing Integration Design

## Why custom tracer

Effect tracing already tracks hierarchy, timing, and exits. Using a custom tracer means we can observe real execution without writing our own parent-child scheduler.

## How tracked spans are identified

`addStep` and `withExampleRun` must attach metadata that tracer can read at span creation time.

Required mechanism:

- attach metadata via `SpanOptionsNoTrace.attributes` using exact keys below.
- do not rely on free-form span names for correlation.

Required attribute keys:

- `ve.kind`: `"run" | "step"`
- `ve.example.key`: `ExampleKey`
- `ve.run.id`: `RunId` (present on run spans; optional on step spans)
- `ve.step.nodeId`: `StepNodeId` (step spans only)
- `ve.step.label`: `string` (step spans only)

Implementation note: `withExampleRun` should set run attributes and install tracer context. `addStep` should set step attributes. The tracer must parse these attributes and emit typed events.

The custom tracer reads these attributes and emits typed `Event`s.

## Tracer composition

The manager tracer should wrap/delegate to the current tracer rather than replace behavior.

- Create underlying span from delegate tracer.
- If span is not visual-tracked, return passthrough span.
- If visual-tracked, return wrapped span that intercepts `end` and records events.

This approach keeps compatibility with any existing tracing behavior.

## Tracer to event mapping algorithm (required)

The custom tracer must implement this mapping deterministically.

1. On span creation:
   - read required `ve.*` attributes
   - if `ve.kind=run`, emit `RunStarted`
   - if `ve.kind=step`, allocate `stepInstanceId`, emit `StepStarted`
   - store span-id -> runtime metadata map for terminal correlation
2. On span end:
   - resolve metadata from span-id map
   - compute `durationMs` from span status timestamps
   - map exit cause:
     - success -> `StepSucceeded` / `RunSucceeded`
     - interrupt-only cause -> `StepInterrupted` / `RunInterrupted`
     - all other failures/defects -> `StepFailed` / `RunFailed`
   - emit terminal status event, then emit `StepFinished` or `RunFinished`
3. Cleanup:
   - remove span-id mapping on terminal emission
   - clear run-id mapping when run finishes

If a step span is observed without a resolvable `nodeId`, emit `UnknownStepNodeObserved` and still emit terminal run events.

## Runtime execution flow

1. User selects an example. UI renders `example.blueprint` immediately.
2. User runs `example.effect` (with manager layer provided).
3. `withExampleRun` allocates `runId`, emits `RunRequested`, resolves policy.
4. `withExampleRun` installs manager tracer with `Effect.withTracer(...)` and wraps root span.
5. `addStep`-wrapped effects create step spans carrying `nodeId` metadata.
6. Tracer emits step/run lifecycle events as spans start/end.
7. Manager publishes events to stream and updates snapshots.

## Required lifecycle ordering rules

For each run:

1. `RunRequested`
2. `RunStarted` (only if not rejected)
3. zero or more step events
4. exactly one of `RunSucceeded | RunFailed | RunInterrupted`
5. `RunFinished`

For each step instance:

1. `StepStarted`
2. exactly one of `StepSucceeded | StepFailed | StepInterrupted`
3. `StepFinished`

`CancelRequested` is an intent signal and does not replace terminal events.

Duplicate terminal emission for a run or step is forbidden.

## Concurrency policy

Policy is per `ExampleKey`.

- `deny`: reject new run when one is active (`RunRejected`).
- `interrupt-previous`: interrupt active run(s), then start new run.
- `allow`: let multiple runs execute simultaneously.

Default policy: `deny`.

## Cancellation semantics

- `cancelRun(runId, reason)` emits `CancelRequested` when run exists.
- it interrupts the tracked fiber (`interruptUnsafe` / effect interruption path).
- terminal `RunInterrupted` is emitted only when tracer observes actual run span exit with interrupt-only cause.
- if run id does not exist, return `false` and do not emit cancel event.

## Encoding rules for step/run payloads

Success/failure payloads should be schema-encoded when schemas are supplied.

- success: encode with provided schema, else fallback to `Schema.Unknown` encoding.
- failure: encode typed error with provided schema when available; include cause summary fallback string on encode failure.
- encoding failures must never crash tracked program execution.

## Determinism constraints

- blueprint generation must be deterministic.
- event sequence number is globally monotonic per manager instance.
- terminal event uniqueness is enforced (no duplicate terminal event per span/run).
- each runtime step event must resolve to known `nodeId` or emit `UnknownStepNodeObserved`.
- tracer timestamps (`bigint` nanoseconds) must be converted to millisecond numbers consistently (`Number(ns / 1_000_000n)`).

## UI integration with Effect Atom

This section defines the recommended UI integration strategy. The key idea is to keep runtime state derivation in Atom, so React components mostly read ready-to-render values.

### Why Atom is the right fit

- Atom gives us a reactive cache for derived UI state.
- `Atom.runtime(layer)` lets atoms access `VisualEffectManager` without manual service plumbing in each component.
- `@effect/atom-react` provides minimal hooks (`RegistryProvider`, `useAtomValue`, `useAtomSuspense`) that map cleanly to React islands.
- event streams can be reduced with `Stream.scan` into stable view state, then consumed as an atom.

### Effect Atom APIs this design relies on

- `Atom.runtime(layer)`: creates a runtime-aware atom factory so atoms can depend on `VisualEffectManager` services.
- `Atom.family(...)`: memoized keyed atoms for per-example state.
- `Atom.keepAlive`: keeps visualization atoms alive across short unmount/remount cycles.
- `@effect/atom-react` `RegistryProvider`: lifecycle owner for `AtomRegistry` in React.
- `@effect/atom-react` `useAtomValue` (and optionally `useAtomSuspense`): declarative reads from atoms.

### Recommended atom architecture

Use three layers of UI state:

1. **Static example metadata** from `ExampleDefinition` (`blueprint`, `label`, `key`).
2. **Dynamic run state** reduced from manager event stream.
3. **View model atoms** that merge static blueprint + dynamic run state for rendering.

Do not re-encode this logic inside components. Components should read atom values and render.

### Runtime + atom setup example

```ts
import * as Effect from "effect/Effect"
import * as Stream from "effect/Stream"
import * as Atom from "effect/unstable/reactivity/Atom"
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult"

interface ExampleRuntimeState {
  readonly statusByNodeId: ReadonlyMap<StepNodeId, "idle" | "running" | "succeeded" | "failed" | "interrupted">
  readonly latestRunId: RunId | undefined
  readonly startedAtMs: number | undefined
  readonly endedAtMs: number | undefined
}

const initialRuntimeState: ExampleRuntimeState = {
  statusByNodeId: new Map(),
  latestRunId: undefined,
  startedAtMs: undefined,
  endedAtMs: undefined,
}

const reduceEvent = (state: ExampleRuntimeState, event: Event): ExampleRuntimeState => {
  switch (event._tag) {
    case "RunStarted":
      return {
        ...state,
        latestRunId: event.runId,
        startedAtMs: event.atMs,
        endedAtMs: undefined,
      }
    case "StepStarted": {
      const next = new Map(state.statusByNodeId)
      next.set(event.nodeId, "running")
      return { ...state, statusByNodeId: next }
    }
    case "StepSucceeded":
    case "StepFailed":
    case "StepInterrupted": {
      const status =
        event._tag === "StepSucceeded"
          ? "succeeded"
          : event._tag === "StepFailed"
          ? "failed"
          : "interrupted"
      const next = new Map(state.statusByNodeId)
      next.set(event.nodeId, status)
      return { ...state, statusByNodeId: next }
    }
    case "RunFinished":
      return { ...state, endedAtMs: event.atMs }
    default:
      return state
  }
}

const managerLayer = VisualEffectManager.layer
const uiRuntime = Atom.runtime(managerLayer)

const runtimeStateAtom = Atom.family((key: ExampleKey) =>
  uiRuntime.atom(
    VisualEffectManager.use((manager) =>
      manager.events.pipe(
        Stream.filter((event) => event._tag === "DroppedEvents" || event.key === key),
        Stream.scan(initialRuntimeState, reduceEvent),
      )
    ),
    { initialValue: initialRuntimeState },
  ).pipe(Atom.keepAlive),
)

const exampleByKey = new Map<ExampleKey, ExampleDefinition<unknown, unknown, unknown>>([
  [allExample.key, allExample],
])

const viewModelAtom = Atom.family((key: ExampleKey) =>
  Atom.make((get) => {
    const runtimeStateResult = get(runtimeStateAtom(key))
    const runtimeState = runtimeStateResult._tag === "Success"
      ? runtimeStateResult.value
      : initialRuntimeState

    const example = exampleByKey.get(key)
    if (example === undefined) {
      return {
        key,
        label: "unknown",
        blueprint: { key, label: "unknown", steps: [] },
        runtime: runtimeState,
      }
    }

    return {
      key: example.key,
      label: example.label,
      blueprint: example.blueprint,
      runtime: runtimeState,
    }
  }).pipe(Atom.keepAlive),
)
```

Notes:

- use `Atom.family` for keyed atoms (one atom instance per example key).
- when reading family atoms from React, use `useMemo` to create a stable atom reference from the key.
- use `Atom.keepAlive` for long-lived visualization state so temporary unmounts do not reset state immediately.
- the event filter should be implemented with exact event-to-example correlation rules in real code.

### React integration example (`@effect/atom-react`)

```tsx
import * as React from "react"
import { RegistryProvider, useAtomValue } from "@effect/atom-react"

function ExamplePanel({ example }: { readonly example: ExampleDefinition<unknown, unknown, unknown> }) {
  const atom = React.useMemo(
    () => viewModelAtom(example.key),
    [example.key],
  )
  const view = useAtomValue(atom)

  return (
    <section>
      <h3>{view.label}</h3>
      {/* render blueprint eagerly */}
      {/* then render runtime status overlays from view.runtime */}
    </section>
  )
}

export function ExamplePage() {
  return (
    <RegistryProvider defaultIdleTTL={2_000}>
      <ExamplePanel example={allExample} />
    </RegistryProvider>
  )
}
```

`RegistryProvider` is not strictly required because `@effect/atom-react` installs a default `RegistryContext` value. In practice, `RegistryProvider` is still recommended for this project so we control registry lifecycle, idle TTL, initial values, and hydration behavior explicitly. Increasing `defaultIdleTTL` is useful for docs UI where users may switch tabs and come back quickly.

### Run action integration example

The run button can execute the example effect directly. The event stream atoms update automatically through manager events.

```ts
import * as Effect from "effect/Effect"

const managerLayer = VisualEffectManager.layer

export const runExample = (example: ExampleDefinition<unknown, unknown, unknown>) =>
  Effect.runFork(example.effect.pipe(Effect.provide(managerLayer)))
```

If the app needs full control over cancellation and run ownership, use manager APIs (`cancelRun`, `runSnapshot`) keyed by emitted `RunId`.

### Suspense option

If an atom intentionally stays in `AsyncResult.Initial` / waiting states, use `useAtomSuspense` for fallback UIs. For the view model atom above, we intentionally provide an initial value to avoid requiring Suspense for primary rendering.

### SSR / hydration note

When server-side rendering atom values, use `effect/unstable/reactivity/Hydration` + `HydrationBoundary` from `@effect/atom-react`. For client-only islands this is optional.

## Validation rules

Definition-time validations:

- unique example key
- unique step node ids
- `parentId` must reference existing step node

Runtime validations:

- tracked step span must include node id metadata
- unknown node ids generate warning event
- malformed external event payloads are decode-rejected at consumer boundary

## Testing requirements

Recommended test file locations:

- `src/services/VisualEffectManager.test.ts`
- `src/lib/examples/defineExample.test.ts`
- `src/lib/examples/ui-state.test.ts`

- [ ] `defineExample` eagerly produces blueprint and effect.
- [ ] `addStep` dual API works in direct and piped styles.
- [ ] deterministic auto-generated step ids when `id` omitted.
- [ ] duplicate step id raises `DuplicateStepNodeId`.
- [ ] `EXAMPLES` catalog has unique `ExampleKey` values.
- [ ] custom tracer emits run and step lifecycle events.
- [ ] `withExampleRun` requires `VisualEffectManager` in environment.
- [ ] concurrency policy behavior (`deny`, `interrupt-previous`, `allow`).
- [ ] event sequence monotonicity.
- [ ] terminal event uniqueness.
- [ ] unknown step node warning event behavior.
- [ ] bounded buffer behavior and `DroppedEvents`.
- [ ] schema encode fallback behavior on invalid payload.
- [ ] `Atom.runtime(VisualEffectManager.layer)` can consume manager events and produce stable view state.
- [ ] `@effect/atom-react` integration works with default context and with explicit `RegistryProvider` + `useAtomValue`.
- [ ] view model atom preserves state across short unmounts when `Atom.keepAlive` is used.

## Implementation checklist

### Phase 1: Schemas and public contracts

- [ ] add branded id schemas
- [ ] add blueprint schemas
- [ ] add run event schema union
- [ ] add tagged error classes
- [ ] add `defineExample` / `addStep` / `withExampleRun` public typings

### Phase 2: Definition engine

- [ ] implement eager `build` execution in `defineExample`
- [ ] implement step collector and deterministic id generation
- [ ] implement blueprint freeze + validation
- [ ] auto-wrap returned program with `withExampleRun`
- [ ] publish `EXAMPLES` catalog and `EXAMPLE_BY_KEY` map

### Phase 3: Manager + tracer runtime

- [ ] implement manager state: active runs, snapshots, event seq, replay buffer
- [ ] implement custom tracer with delegate composition
- [ ] map traced span lifecycle to `Event`
- [ ] implement cancel + run lookup APIs

### Phase 4: UI wiring

- [ ] consume `EXAMPLES` catalog and expose blueprints to UI
- [ ] create `Atom.runtime(VisualEffectManager.layer)` for UI data atoms
- [ ] consume event stream in Atom reducers (`Stream.scan` -> runtime state)
- [ ] merge static blueprint + dynamic events into view-model atoms
- [ ] wire React islands with `useAtomValue` and an explicit `RegistryProvider` where lifecycle control is needed

### Phase 5: Verification

- [ ] implement and pass tests listed above
- [ ] run `pnpm vitest --run` (or add equivalent test command if missing)
- [ ] run `pnpm lint`
- [ ] run `pnpm build`

## Unresolved questions

None. This specification is intended to be implementation-complete for a clean session.

## Acceptance criteria

This specification is complete when:

- authors can define examples with `defineExample` and `addStep` in both direct and piped forms,
- UI can render full step graph before run from `blueprint`,
- runtime run/step events are emitted from custom tracer built on Effect tracing,
- manager streams are stable, bounded, and schema-first,
- Effect Atom integration is documented and validated with working usage patterns,
- service errors use `Schema.TaggedErrorClass`,
- tests validate lifecycle, determinism, and policy behavior.
