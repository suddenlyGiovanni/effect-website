# Visual Effect Atom Controls Specification

## 1. Intent

Define a first-class, Effect-idiomatic controls API for landing Visual Effect examples where:

1. `build(...)` declares controls.
2. UI renders directly from control atoms.
3. Program logic reads control values through Effect.

The design must preserve current architecture invariants:

- `defineExample(...)` still executes `build(...)` eagerly to collect static step blueprint.
- Step graph stays static per example definition.
- Runtime state machine remains driven by `VisualEffectManager`.

## 2. Why Atom-Based Controls

Current `website-v4` has static example definitions and no per-example configuration panel.

- `BuildContext` only has `addStep` today (`src/lib/examples/constructors.ts`).
- `VisualEffectManager.start` accepts only `example` today (`src/services/VisualEffectManager.ts`).
- Header controls are run/stop/reset only (`src/components/landing/examples/VisualEffectControls.tsx`).

Legacy site had custom per-example config UI (e.g. `Effect.all` concurrency) but via ad-hoc component-local state (`.repos/landing/src/examples/effect-all.tsx`).

Atom-based controls improve this by making control state:

- typed at definition site,
- renderable with normal `@effect/atom-react` hooks,
- readable in program effects without custom plumbing.

This aligns with Effect v4 patterns already used by this project:

- `Atom.runtime(...)`
- `runtime.fn(...)`
- registry-backed reads/writes via `useAtomValue` / `useAtomSet`.

## 3. Scope

### 3.1 In scope

- New control API in `build(...)`.
- Storage of control definitions in `ExampleDefinition`.
- Generic control panel rendering for custom control components.
- Run-time control snapshot service for deterministic program execution.
- `Effect.all` concurrency migration as reference implementation.

### 3.2 Out of scope

- Live mutating already-running fibers with control changes.
- Dynamic step graph changes based on controls.
- Persisting control values to URL/local storage (possible follow-up).

## 4. Design Principles

1. **Atoms are source of truth for UI controls.**
2. **Programs read controls through Effect services, not React closures.**
3. **Run behavior is snapshot-based and deterministic.**
4. **API supports fully custom control UIs, not only segmented presets.**
5. **Illegal control configs fail at definition time.**

## 5. Proposed API

## 5.1 Core types

```ts
import type * as React from "react"
import * as Atom from "effect/unstable/reactivity/Atom"
import * as Effect from "effect/Effect"
import * as Schema from "effect/Schema"

export type ControlChangePolicy = "never" | "ifRunning" | "always"

export interface ExampleControlHandle<A> {
  readonly id: string
  readonly label: string
  readonly description: string | undefined
  readonly atom: Atom.Writable<A>
  readonly schema: Schema.Schema<A>
  readonly render: React.ComponentType<ExampleControlRenderProps<A>>
  readonly changePolicy: ControlChangePolicy
}

export interface ExampleControlRenderProps<A> {
  readonly atom: Atom.Writable<A>
  readonly disabled: boolean
}

export interface RegisterControlInput<A> {
  readonly id: string
  readonly label: string
  readonly description?: string | undefined
  readonly schema: Schema.Schema<A>
  readonly initialValue: A
  readonly render: React.ComponentType<ExampleControlRenderProps<A>>
  readonly changePolicy?: ControlChangePolicy | undefined
}
```

## 5.2 Build context additions

```ts
export interface BuildContext {
  readonly addStep: {
    <A extends RenderableResult, E extends RenderableResult>(
      self: RenderableEffect<A, E>,
      options: AddStepOptions,
    ): RenderableEffect<A, E>
    (
      options: AddStepOptions,
    ): <A extends RenderableResult, E extends RenderableResult>(
      self: RenderableEffect<A, E>,
    ) => RenderableEffect<A, E>
  }

  readonly controls: {
    readonly register: <A>(input: RegisterControlInput<A>) => ExampleControlHandle<A>
    readonly read: <A>(
      control: ExampleControlHandle<A>,
    ) => Effect.Effect<A, UnknownControlReferenceError, ExampleControlSnapshot>
  }
}
```

`controls.register(...)` is the main API. It enables fully custom control rendering because author provides the control component.

## 5.3 Optional helper constructors (non-core)

These are sugar on top of `register`, not required for expressive power:

```ts
export const makeSegmentedControl = <
  const Options extends readonly [string, ...Array<string>],
>(input: {
  readonly id: string
  readonly label: string
  readonly options: Options
  readonly initialValue: Options[number]
  readonly changePolicy?: ControlChangePolicy
}): RegisterControlInput<Options[number]> => { ... }
```

## 5.4 Example definition model updates

```ts
export interface ExampleDefinition {
  readonly key: string
  readonly title: string
  readonly subtitle: string | undefined
  readonly description: string | undefined
  readonly steps: ReadonlyArray<StepDefinition>
  readonly controls: ReadonlyArray<ExampleControlHandle<unknown>>
  readonly program: RenderableEffect<RenderableResult, RenderableResult>
  readonly code: ExampleCompiledCode
}
```

Note: `program` remains static and can read controls at runtime via `controls.read(...)`.

## 6. Runtime Service: Control Snapshot

Programs must not read live mutable control state while running. They read a run-scoped snapshot service.

```ts
export class ExampleControlSnapshot extends ServiceMap.Service<
  ExampleControlSnapshot,
  {
    readonly get: (id: string) => Effect.Effect<unknown, UnknownControlReferenceError>
  }
>()("website-v4/examples/ExampleControlSnapshot") {}

export class UnknownControlReferenceError extends Schema.TaggedErrorClass<UnknownControlReferenceError>()(
  "UnknownControlReferenceError",
  {
    exampleKey: Schema.String,
    controlId: Schema.String,
  },
) {}
```

`controls.read(handle)` implementation:

```ts
const read = <A>(
  handle: ExampleControlHandle<A>,
): Effect.Effect<A, UnknownControlReferenceError, ExampleControlSnapshot> =>
  ExampleControlSnapshot.use((snapshot) =>
    snapshot.get(handle.id).pipe(
      Effect.flatMap((unknownValue) => Schema.decodeUnknown(handle.schema)(unknownValue)),
      Effect.catchAllDefect(() =>
        Effect.dieMessage(`Control schema decode failed for ${handle.id}`),
      ),
    ),
  )
```

## 7. Execution Semantics

## 7.1 Start behavior

On `VisualEffectManager.start(example)`:

1. Capture `startedAt`.
2. Build a snapshot map by reading each control atom from current `AtomRegistry`.
3. Provide `ExampleControlSnapshot` to `example.program`.
4. Run with existing tracing/step-state instrumentation.

Pseudo flow:

```ts
const snapshotEntries = new Map(
  example.controls.map((control) => [control.id, registry.get(control.atom)]),
)

const snapshot = ExampleControlSnapshot.of({
  get: (id) => {
    const value = snapshotEntries.get(id)
    return value === undefined
      ? Effect.fail(new UnknownControlReferenceError({ exampleKey: example.key, controlId: id }))
      : Effect.succeed(value)
  },
})

return example.program.pipe(Effect.provideService(ExampleControlSnapshot, snapshot))
```

## 7.2 Control change behavior while running

Control writes happen in UI atom state immediately.

When a control changes:

- `changePolicy = "never"`: no run state side effect.
- `changePolicy = "ifRunning"` (default): if example is running, call `reset(example)`.
- `changePolicy = "always"`: always call `reset(example)`.

No auto-run in this iteration.

## 7.3 Determinism guarantee

Control values are frozen per run. Changing control UI while a run is active does not affect in-flight behavior.

## 8. UI Model

## 8.1 Panel placement

Required order in `VisualEffect.tsx`:

1. `VisualEffectControls` (run/stop/reset)
2. `VisualEffectConfigPanel` (new; if controls exist)
3. `VisualEffectNodes`
4. `VisualEffectCodeSnippet`

## 8.2 Generic panel renderer

```tsx
export function VisualEffectConfigPanel() {
  const example = useExampleDefinition()
  const state = useExampleState()
  const disabled = state._tag === "Running"

  if (example.controls.length === 0) {
    return null
  }

  return (
    <section className="border-b border-zinc-800 bg-zinc-950/70 px-4 py-3">
      {example.controls.map((control) => {
        const Control = control.render
        return <Control key={control.id} atom={control.atom} disabled={disabled} />
      })}
    </section>
  )
}
```

## 8.3 Control write wrapper

To enforce `changePolicy`, panel-level wrappers should own writes:

```ts
export const useControlWrite = <A>(control: ExampleControlHandle<A>) => {
  const example = useExampleDefinition()
  const state = useExampleState()
  const set = useAtomSet(control.atom)
  const { reset } = useExampleControls()

  return (next: A) => {
    set(next)

    if (control.changePolicy === "always") {
      reset()
      return
    }

    if (control.changePolicy === "ifRunning" && state._tag === "Running") {
      reset()
    }
  }
}
```

## 9. Authoring Examples

## 9.1 Fully custom control component

```tsx
interface AllConfig {
  readonly concurrency: "sequential" | "numbered" | "unbounded"
  readonly cap: number
  readonly includeLondon: boolean
}

const AllConfigSchema = Schema.Struct({
  concurrency: Schema.Literal("sequential", "numbered", "unbounded"),
  cap: Schema.Number,
  includeLondon: Schema.Boolean,
})

function AllConfigControl(props: ExampleControlRenderProps<AllConfig>) {
  const [value, setValue] = useAtom(props.atom)

  const parseConcurrency = (input: string): AllConfig["concurrency"] => {
    if (input === "numbered") {
      return "numbered"
    }
    if (input === "unbounded") {
      return "unbounded"
    }
    return "sequential"
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <label className="font-mono text-xs tracking-wider text-zinc-500">CONCURRENCY</label>

      <select
        value={value.concurrency}
        disabled={props.disabled}
        onChange={(event) =>
          setValue({
            concurrency: parseConcurrency(event.target.value),
            cap: value.cap,
            includeLondon: value.includeLondon,
          })
        }
      >
        <option value="sequential">sequential</option>
        <option value="numbered">numbered</option>
        <option value="unbounded">unbounded</option>
      </select>

      <label className="font-mono text-xs tracking-wider text-zinc-500">CAP</label>
      <input
        type="range"
        min={1}
        max={8}
        step={1}
        value={value.cap}
        disabled={props.disabled || value.concurrency !== "numbered"}
        onChange={(event) =>
          setValue({
            concurrency: value.concurrency,
            cap: Number(event.target.value),
            includeLondon: value.includeLondon,
          })
        }
      />

      <label className="font-mono text-xs tracking-wider text-zinc-500">INCLUDE LONDON</label>
      <input
        type="checkbox"
        checked={value.includeLondon}
        disabled={props.disabled}
        onChange={(event) =>
          setValue({
            concurrency: value.concurrency,
            cap: value.cap,
            includeLondon: event.target.checked,
          })
        }
      />
    </div>
  )
}
```

## 9.2 `build(...)` usage with program reads

```ts
export const allExample = defineExample({
  label: "Effect.all",
  description: "Combine multiple effects into one, returning results based on input structure",
  code: {
    language: "typescript",
    source: `...`,
  },
  build: ({ addStep, controls }) => {
    const config = controls.register<AllConfig>({
      id: "all-config",
      label: "ALL CONFIG",
      schema: AllConfigSchema,
      initialValue: {
        concurrency: "sequential",
        cap: 2,
        includeLondon: true,
      },
      render: AllConfigControl,
      changePolicy: "ifRunning",
    })

    const nyc = addStep(getTemperature(14, "900 millis"), { label: "nyc" })
    const berlin = addStep(getTemperature(11, "500 millis"), { label: "berlin" })
    const tokyo = addStep(getTemperature(18, "650 millis"), { label: "tokyo" })
    const london = addStep(getTemperature(9, "400 millis"), { label: "london" })

    return Effect.gen(function* () {
      const cfg = yield* controls.read(config)
      const effects = cfg.includeLondon ? [nyc, berlin, tokyo, london] : [nyc, berlin, tokyo]

      if (cfg.concurrency === "sequential") {
        return yield* Effect.all(effects)
      }

      if (cfg.concurrency === "unbounded") {
        return yield* Effect.all(effects, { concurrency: "unbounded" })
      }

      return yield* Effect.all(effects, { concurrency: cfg.cap })
    })
  },
})
```

## 10. Validation Rules

Validation happens in `defineExample(...)` during eager build.

Required checks:

1. control ids are unique within one example.
2. `initialValue` successfully decodes against `schema`.
3. every `controls.read(...)` target handle belongs to same example definition.
4. control render component exists and is callable.

Suggested tagged errors:

```ts
export class DuplicateControlIdError extends Schema.TaggedErrorClass<DuplicateControlIdError>()(
  "DuplicateControlIdError",
  {
    exampleLabel: Schema.String,
    controlId: Schema.String,
  },
) {}

export class InvalidControlInitialValueError extends Schema.TaggedErrorClass<InvalidControlInitialValueError>()(
  "InvalidControlInitialValueError",
  {
    exampleLabel: Schema.String,
    controlId: Schema.String,
    reason: Schema.String,
  },
) {}
```

## 11. Snippet Integration

Phase 1 keeps snippet API stable (`code` static metadata).

Optional follow-up for control-driven snippets:

- add `codeAtom?: Atom.Atom<ExampleCodeSnippetInput>` to `ExampleDefinition`.
- allow `build(...)` to register a snippet atom derived from control atoms.
- keep selector resolution deterministic by requiring either:
  - static snippet, or
  - finite, declared variant set compiled at definition time.

## 12. File-Level Change Plan

- `src/lib/examples/constructors.ts`
  - add `ExampleControlHandle`, `RegisterControlInput`, `controls.register`, `controls.read`
  - collect controls into `ExampleDefinition.controls`
  - add definition-time validation and tagged errors

- `src/services/VisualEffectManager.ts`
  - capture control atom snapshot on `start`
  - provide `ExampleControlSnapshot` service into `example.program`

- `src/components/landing/examples/VisualEffectProvider.tsx`
  - export control helper hooks (`useControlWrite`, `useExampleControlsPanel`)
  - preserve existing run/stop/reset hooks

- `src/components/landing/examples/VisualEffect.tsx`
  - render `VisualEffectConfigPanel` between header controls and nodes

- `src/components/landing/examples/VisualEffectConfigPanel.tsx` (new)
  - generic renderer for custom control components

- `src/lib/examples/catalog/effect-all.tsx`
  - migrate to atom-backed custom control as reference

## 13. Migration Plan

### Phase 1

1. Introduce control types and `BuildContext.controls` API.
2. Add runtime snapshot service in manager.
3. Add config panel UI and generic renderer.
4. Keep current examples unchanged (no controls => no panel).

### Phase 2

5. Migrate `effect-all` to atom-backed custom control.
6. Verify behavior parity with legacy concurrency modes.

### Phase 3

7. Migrate more examples requiring custom UI controls.
8. Add optional helper constructors for common controls if needed.

## 14. Testing Strategy

Unit tests:

- duplicate control id fails.
- invalid initial value fails schema decode.
- `controls.read` resolves typed values from snapshot service.
- unknown control id in snapshot fails with `UnknownControlReferenceError`.

Integration tests:

- controls render from `example.controls`.
- control writes update atom state in UI.
- control change obeys `changePolicy` (`never` / `ifRunning` / `always`).
- run uses captured snapshot, not live updates.
- `effect-all` concurrency control changes runtime behavior.

Build checks:

- `pnpm check`
- `pnpm lint`
- `pnpm build`

## 15. Acceptance Criteria

Feature is complete when all are true:

1. Example authors can register fully custom controls in `build(...)`.
2. Control UI renders from control atoms with no ad-hoc per-example wiring outside `build(...)`.
3. Programs can read control values via `controls.read(...)`.
4. Runs are deterministic via snapshot semantics.
5. Existing no-control examples continue to work unchanged.
6. `Effect.all` concurrency parity is restored with atom-backed controls.

## 16. Fresh-Session Checklist

1. Update constructor/build context types and control registration internals.
2. Add control snapshot service + manager `start` integration.
3. Implement config panel renderer in landing example UI.
4. Migrate `effect-all` as first consumer.
5. Run `pnpm check`, `pnpm lint`, `pnpm build`.

## 17. Unresolved Questions

- Should control atom state persist across full page reload (local storage) or stay session-only?
- Should `VisualEffectConfigPanel` disable controls while running by default, or keep writes enabled and rely only on `changePolicy`?
