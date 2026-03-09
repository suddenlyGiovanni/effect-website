# Visual Effect Schedule Visualization Specification

## 1. Intent

This specification defines the smallest framework change set that adds schedule-based visualizations to the landing-page Visual Effect system in `website-v4`.

The goal is not to model every internal detail of `Schedule`. The goal is to restore the old website's schedule timeline experience with the new architecture's existing strengths:

1. `defineExample(...)` remains the authoring entry point.
2. `VisualEffectManager` remains the only execution authority.
3. Step and example atoms remain the runtime source of truth.
4. React remains responsible for presentation-only history such as the on-screen timeline trail.

The recommended design intentionally avoids schedule introspection, new runtime event streams, and schedule-specific manager logic. The old website already proved that visual parity only requires observing when the repeated body is running and when the outer effect is still alive.

## 2. Background

### 2.1 Old website behavior

The old website rendered schedule examples through `.repos/landing/src/components/display/EffectExample.tsx` and `.repos/landing/src/components/ScheduleTimeline.tsx`.

That implementation had one important property: it did not inspect schedule internals. It watched two pieces of runtime state instead.

1. The base effect state told the timeline when work was actively running.
2. The outer repeated or retried effect state told the timeline when the whole schedule session was still active.

From those two signals it drew:

- blue running segments,
- muted gap segments,
- a moving cursor,
- duration labels for visible gaps,
- and a short clear animation on reset.

That is the parity target for `website-v4`.

### 2.2 Current new-site state

The new site already has most of the required infrastructure.

- `src/lib/examples/constructors.ts` creates static `ExampleDefinition` objects with stable `steps`.
- `src/services/VisualEffectManager.ts` writes `exampleStateAtom(...)` and `stepStateAtom(...)` from traced Effect execution.
- `src/components/landing/examples/VisualEffect.tsx` already owns the card layout for controls, nodes, and code.
- `src/lib/examples/catalog.ts` already has an empty `schedule` category waiting for examples.

What is missing is an explicit way for an example to say, "render a schedule timeline for this example, and track this step as the repeated attempt body."

## 3. Scope

### 3.1 In scope

- A first-class schedule timeline panel for landing-page Visual Effect examples.
- A small authoring API that lets an example opt into the panel.
- A way to mark exactly one step as the tracked schedule attempt.
- React-local timeline history derived from existing example and step state.
- Migration of an initial set of schedule examples into the `schedule` category.

### 3.2 Out of scope

- Introspecting `Schedule` internals or exposing schedule AST details to the UI.
- Showing schedule outputs, jitter values, recurrence counts, or termination reasons on the timeline.
- Tracking more than one repeated attempt step in the first iteration.
- Persisting timeline history across unmounts, page reloads, or tab switches.
- Refactoring `VisualEffectEventBus` into a generic visualization telemetry system.
- Adding schedule-specific logic to `VisualEffectManager`.

## 4. Design Principles

1. The timeline should reuse existing runtime state instead of inventing a second execution channel.
2. Schedule authorship should stay close to `addStep(...)`, because the tracked attempt is a property of the step being visualized.
3. Validation should happen during `defineExample(...)`, not during render.
4. The first version should support one tracked attempt step only.
5. Visual parity matters more than schedule internals.
6. The timeline should be opt-in and invisible for non-schedule examples.

## 5. Recommended API

### 5.1 Public authoring API

The smallest useful API adds one optional field to `AddStepOptions` and one optional field to `DefineExampleInput`.

```ts
export interface AddStepOptions {
  readonly label: string
  readonly highlight?: SnippetSelectorDefinition
  readonly isScheduleTrackedStep?: boolean
}

export interface DefineExampleInput {
  readonly label: string
  readonly subtitle?: string | undefined
  readonly description?: string | undefined
  readonly code: ExampleCodeSnippetInput
  readonly resultHighlight?: SnippetHighlightSelector | ReadonlyArray<SnippetHighlightSelector>
  readonly build: (
    ctx: BuildContext,
  ) => RenderableEffect<RenderableResult, RenderableResult, ExampleControlSnapshot>
}
```

This API is small for three reasons.

First, `isScheduleTrackedStep` keeps schedule intent next to the `addStep(...)` call, so the tracked step does not drift away from the authored effect.

Second, `scheduleTimeline` is example-level opt-in, so the card layout does not need to guess based on category or step count.

Third, all visual tuning stays inside the component so every schedule timeline remains visually consistent.

### 5.2 Resolved example model

`ExampleDefinition` should store the resolved tracked step, not just the original config.

```ts
export interface ExampleScheduleTimelineDefinition {
  readonly attemptStep: StepDefinition
}

export interface ExampleDefinition {
  readonly key: string
  readonly title: string
  readonly subtitle: string | undefined
  readonly description: string | undefined
  readonly steps: ReadonlyArray<StepDefinition>
  readonly controls: ReadonlyArray<ExampleControlDefinition>
  readonly program: RenderableEffect<RenderableResult, RenderableResult, ExampleControlSnapshot>
  readonly code: ExampleCodeDefinition
  readonly scheduleTimeline?: ExampleScheduleTimelineDefinition
}
```

Storing `attemptStep` directly is simpler than storing a string and looking it up later. The existing step objects are already the identity used by `stepStateAtom(...)`, so the UI can consume the resolved value without an extra search step.

### 5.3 Default values

The implementation should keep the same feel as the old site by default.

```ts
export const SCHEDULE_TIMELINE_DEFAULTS = {
  pixelsPerSecond: 100,
  scrollThreshold: 0.8,
  clearDelayMs: 300,
  startOffset: 50,
  height: 50,
  lineThickness: 3,
  dotSize: 12,
  cursorWidth: 3,
  tickMarkSpacing: 50,
} as const
```

All timeline tuning constants should remain component-owned so every schedule example shares one visual language.

## 6. Example Authoring

### 6.1 `Effect.retry` with exponential backoff

The following example shows the intended authoring shape.

```ts
import * as Effect from "effect/Effect"
import * as Schedule from "effect/Schedule"
import { defineExample } from "../constructors"
import { PrimitiveResult } from "../results/primitive"
import { ErrorResult } from "../results/error"

const attemptParallelPark = Effect.gen(function* () {
  yield* Effect.sleep("500 millis")

  const parked = Math.random() > 0.75

  if (parked) {
    return new PrimitiveResult("parked")
  }

  return yield* Effect.fail(new ErrorResult("too close"))
})

export const retryExponentialExample = defineExample({
  label: "Effect.retry",
  subtitle: "exponential",
  description: "Retry a failing effect with exponential backoff.",
  code: {
    language: "typescript",
    source: `const park = attemptParallelPark()
const result = Effect.retry(park, Schedule.exponential("700 millis"))`,
  },
  resultHighlight: {
    _tag: "Text",
    text: 'Effect.retry(park, Schedule.exponential("700 millis"))',
  },
  build: ({ addStep }) => {
    const park = addStep(attemptParallelPark, {
      label: "park",
      highlight: { _tag: "Text", text: "attemptParallelPark()" },
      isScheduleTrackedStep: true,
    })

    return Effect.retry(park, Schedule.exponential("700 millis"))
  },
})
```

This example is important because it demonstrates the whole feature with one tracked step and one outer result node, which is exactly how the legacy site rendered retry timelines.

### 6.2 `Effect.repeat` with spaced repeats

The same API should work for repeating effects.

```ts
import * as Effect from "effect/Effect"
import * as Schedule from "effect/Schedule"
import { defineExample } from "../constructors"
import { PrimitiveResult } from "../results/primitive"

const checkNotifications = Effect.gen(function* () {
  yield* Effect.sleep("500 millis")
  return new PrimitiveResult("ping")
})

export const repeatSpacedExample = defineExample({
  label: "Effect.repeat",
  subtitle: "spaced",
  description: "Repeat an effect using a fixed delay between attempts.",
  code: {
    language: "typescript",
    source: `const phone = checkNotifications()
const checking = Effect.repeat(phone, Schedule.spaced("2 seconds"))`,
  },
  resultHighlight: {
    _tag: "Text",
    text: 'Effect.repeat(phone, Schedule.spaced("2 seconds"))',
  },
  build: ({ addStep }) => {
    const phone = addStep(checkNotifications, {
      label: "phone",
      highlight: { _tag: "Text", text: "checkNotifications()" },
      isScheduleTrackedStep: true,
    })

    return Effect.repeat(phone, Schedule.spaced("2 seconds"))
  },
})
```

### 6.3 `Effect.retry` with explicit attempt limit

The third reference example should mirror the old site's retry-with-limit behavior.

```ts
import * as Effect from "effect/Effect"
import * as Schedule from "effect/Schedule"
import { defineExample } from "../constructors"
import { PrimitiveResult } from "../results/primitive"
import { ErrorResult } from "../results/error"

const wakeUp = Effect.gen(function* () {
  yield* Effect.sleep("500 millis")

  const awake = Math.random() > 0.8

  if (awake) {
    return new PrimitiveResult("awake")
  }

  return yield* Effect.fail(new ErrorResult("snooze"))
})

const snoozeSchedule = Schedule.intersect(
  Schedule.spaced("2 seconds"),
  Schedule.recurs(4),
)

export const retryRecursExample = defineExample({
  label: "Effect.retry",
  subtitle: "recurs",
  description: "Retry an effect while both spacing and retry-count limits allow it.",
  code: {
    language: "typescript",
    source: `const wakeUp = attemptToWakeUp()
const snoozeSchedule = Schedule.intersect(
  Schedule.spaced("2 seconds"),
  Schedule.recurs(4)
)
const result = Effect.retry(wakeUp, snoozeSchedule)`,
  },
  resultHighlight: {
    _tag: "Text",
    text: "Effect.retry(wakeUp, snoozeSchedule)",
  },
  build: ({ addStep }) => {
    const attempt = addStep(wakeUp, {
      label: "wakeUp",
      highlight: { _tag: "Text", text: "attemptToWakeUp()" },
      isScheduleTrackedStep: true,
    })

    return Effect.retry(attempt, snoozeSchedule)
  },
})
```

These three examples are enough to validate the framework support without broadening the scope to every legacy schedule example at once.

## 7. Definition-Time Compilation and Validation

`defineExample(...)` should resolve schedule timeline metadata eagerly, in the same phase that already compiles steps and snippets.

### 7.1 Required behavior

When `scheduleTimeline` is omitted, the constructor should behave exactly as it does today, except that it should still validate obviously invalid schedule-role usage.

When `scheduleTimeline` is present, the constructor should:

1. collect every step marked with `isScheduleTrackedStep: true`,
2. require exactly one such step,
3. merge default config values,
4. store a resolved `ExampleScheduleTimelineDefinition` on the example.

### 7.2 Validation rules

The implementation must fail at definition time in these cases.

1. `scheduleTimeline` is enabled and no step is tagged as the attempt step.
2. `scheduleTimeline` is enabled and more than one step is tagged as the attempt step.
3. More than one step is marked as the tracked schedule step.
### 7.3 Suggested tagged errors

```ts
import * as Schema from "effect/Schema"

export class MissingScheduleAttemptStepError extends Schema.TaggedErrorClass<MissingScheduleAttemptStepError>()(
  "MissingScheduleAttemptStepError",
  {
    exampleLabel: Schema.String,
  },
) {}

export class DuplicateScheduleAttemptStepError extends Schema.TaggedErrorClass<DuplicateScheduleAttemptStepError>()(
  "DuplicateScheduleAttemptStepError",
  {
    exampleLabel: Schema.String,
    count: Schema.Number,
  },
) {}

export class OrphanedScheduleRoleError extends Schema.TaggedErrorClass<OrphanedScheduleRoleError>()(
  "OrphanedScheduleRoleError",
  {
    exampleLabel: Schema.String,
    stepLabel: Schema.String,
  },
) {}

```

### 7.4 Constructor pseudocode

The control flow should be explicit so a fresh implementation pass does not need to reverse-engineer the feature.

```ts
const attemptSteps: Array<StepDefinition> = []

const registerStep = (options: AddStepOptions): StepDefinition => {
  const step = makeStep(options.label)
  steps.push(step)

  if (options.isScheduleTrackedStep === true) {
    attemptSteps.push(step)
  }

  return step
}

const program = input.build({ addStep, controls, snippet })

const resolvedScheduleTimeline = (() => {
  if (input.scheduleTimeline === undefined) {
    if (attemptSteps.length > 0) {
      throw new OrphanedScheduleRoleError({
        exampleLabel: input.label,
        stepLabel: attemptSteps[0].label,
      })
    }

    return undefined
  }

  if (attemptSteps.length === 0) {
    throw new MissingScheduleAttemptStepError({ exampleLabel: input.label })
  }

  if (attemptSteps.length > 1) {
    throw new DuplicateScheduleAttemptStepError({
      exampleLabel: input.label,
      count: attemptSteps.length,
    })
  }

  return {
    attemptStep: attemptSteps[0],
  }
})()

return {
  ...definition,
  scheduleTimeline: resolvedScheduleTimeline,
}
```

## 8. Runtime Model

### 8.1 No schedule runtime instrumentation in v1

The recommended implementation does not change `VisualEffectManager`, `VisualEffectEventBus`, or the sound subsystem.

The timeline should be derived in React from the runtime state that already exists:

- the tracked attempt step state, and
- the example state.

That is enough because the timeline only needs to answer two visual questions.

1. Is the repeated body actively running right now?
2. Is the outer repeat or retry effect still alive right now?

### 8.2 Why this is enough

If the example is running and the tracked step is running, the timeline is in a blue running segment.

If the example is running and the tracked step is not running, the timeline is in a gray gap segment.

If the example reaches a terminal state, the cursor stops and the active segment closes.

If the example returns to `Idle`, the timeline clears.

That is exactly how the old component worked, and it is all that is required for parity.

## 9. UI Model

### 9.1 Layout placement

The timeline should be rendered inside the same bordered card as the rest of the example.

The required layout order in `src/components/landing/examples/VisualEffect.tsx` is:

1. `VisualEffectControls`
2. `VisualEffectConfigPanel`
3. `VisualEffectNodes`
4. `VisualEffectScheduleTimeline` when `example.scheduleTimeline` exists
5. `VisualEffectCodeSnippet`

This keeps the schedule panel visually grouped with the nodes it is explaining, while preserving the current control and snippet layout.

### 9.2 New component

The implementation should introduce a dedicated component.

```tsx
export function VisualEffectScheduleTimeline({
  config,
}: {
  readonly config: ExampleScheduleTimelineDefinition
}) {
  const example = useExampleDefinition()
  const exampleState = useExampleState()
  const attemptState = useAtomValue(stepStateAtom(config.attemptStep))

  // Local timeline history lives here.
  // The component derives segments from current runtime state.

  return <div>{/* timeline rendering */}</div>
}
```

The timeline component should own its own local segment history. That history is a presentation concern, not shared application state.

## 10. Timeline State Model

### 10.1 Store time, not pixels

The old component stored pixel positions directly. The new implementation should keep the same visual result while using a cleaner internal model based on timestamps.

```ts
export type ScheduleSegmentKind = "running" | "gap"

export interface ScheduleSegment {
  readonly id: string
  readonly kind: ScheduleSegmentKind
  readonly startedAtMs: number
  readonly endedAtMs: number | undefined
}

export interface ScheduleTimelineSession {
  readonly runStartedAtMs: number
  readonly segments: ReadonlyArray<ScheduleSegment>
  readonly scrollOffset: number
  readonly clearing: boolean
}
```

This model is simpler because layout can be derived from time on every render.

- Segment width becomes a pure function of start time, end time, and `pixelsPerSecond`.
- Resizing the container does not require rewriting stored segment positions.
- The component can derive the current cursor position from `Date.now()` while the example is still running.

### 10.2 Required derived values

The renderer should derive these values from the session.

```ts
const toX = (timeMs: number, runStartedAtMs: number, pixelsPerSecond: number) => {
  return 50 + ((timeMs - runStartedAtMs) / 1000) * pixelsPerSecond
}

const segmentStartX = toX(segment.startedAtMs, session.runStartedAtMs, 100)
const segmentEndX = toX(segment.endedAtMs ?? nowMs, session.runStartedAtMs, 100)
const cursorX = toX(nowMs, session.runStartedAtMs, 100)
```

## 11. Timeline Update Algorithm

### 11.1 Session start

When `exampleState` enters `Running`, the component should start a new local session keyed by `exampleState.startedAt`.

If a new run starts before the previous clear animation has finished, the new run should replace the stale session immediately.

### 11.2 Active segment rules

The component should follow these rules.

1. If the example is running and the attempt step enters `Running`, open or continue a `running` segment.
2. If the attempt step leaves `Running` while the example is still running, close the running segment and open a `gap` segment.
3. If the example reaches a terminal state, close the currently active segment at the example end time.
4. If the example becomes `Idle`, begin the clear animation and then remove all local segments.

### 11.3 Initial and trailing gaps

The component should support both of these naturally.

- If the example starts running before the attempt step starts, the timeline should begin with a gap segment.
- If the last attempt ends and the outer effect is still running briefly, the timeline should show a trailing gap until the example terminates.

These cases can occur when an example does setup or cleanup work outside the tracked attempt step.

### 11.4 Zero-width segment suppression

The implementation should drop zero-width segments and very small back-to-back transition artifacts.

That rule matters because many repeat and retry examples transition the step and example terminal state within the same millisecond.

### 11.5 Pseudocode

```ts
const [session, setSession] = React.useState<ScheduleTimelineSession | null>(null)

React.useEffect(() => {
  if (exampleState._tag === "Running") {
    const runStartedAtMs = toEpochMillis(exampleState.startedAt)

    setSession((current) => {
      if (current !== null && current.runStartedAtMs === runStartedAtMs) {
        return current
      }

      return {
        runStartedAtMs,
        segments: [],
        scrollOffset: 0,
        clearing: false,
      }
    })
    return
  }

  if (exampleState._tag === "Idle") {
    beginClearAnimation()
  }
}, [exampleState])

React.useEffect(() => {
  if (session === null) {
    return
  }

  if (exampleState._tag === "Running") {
    if (attemptState._tag === "Running") {
      openSegment("running", toEpochMillis(attemptState.startedAt))
      return
    }

    openSegment("gap", inferGapStartMs(exampleState, attemptState, session))
    return
  }

  if (isTerminal(exampleState)) {
    closeActiveSegment(toEpochMillis(exampleState.endedAt))
  }
}, [attemptState, exampleState, session])
```

The actual implementation may factor this differently, but the observable behavior must match these rules.

## 12. Animation and Visual Parity Requirements

The timeline should look and feel like the old site even if the implementation details are cleaner.

### 12.1 Required visual elements

The component must render:

- a dark background line,
- evenly spaced tick marks,
- blue running segments,
- gray gap segments,
- dots at running-segment boundaries,
- a white active cursor,
- duration labels on visible gap segments,
- and a short fade when the timeline clears.

### 12.2 Required style defaults

The first iteration should preserve these legacy defaults.

- height: `50px`
- running line thickness: `3px`
- dot diameter: `12px`
- cursor width: `3px`
- `pixelsPerSecond = 100`
- `scrollThreshold = 0.8`
- initial left offset: `50px`
- clear delay: `300ms`

### 12.3 Color language

The colors should stay close to the old component.

- running active: bright blue
- running inactive: slightly darker blue
- gap active: medium neutral gray
- gap inactive: darker neutral gray
- background line: zinc-700 range
- cursor active: white
- cursor inactive: neutral-500 range

The exact token names can adapt to the current Tailwind palette, but the relative contrast should remain recognizable.

### 12.4 Motion behavior

The timeline should preserve the old motion language.

- The cursor should move continuously while the example is running.
- Running dots should appear with a small spring.
- Active segments should soften into inactive colors when they complete.
- Reset should fade the whole trail out before clearing.

The component should respect the existing `MotionConfig reducedMotion="user"` wrapper. Reduced-motion users should still see state changes, but springs and fades should be shortened or removed where practical.

### 12.5 Scrolling behavior

The timeline should scroll horizontally once the cursor reaches `scrollThreshold * containerWidth`.

This behavior is required for parity with exponential and recursing schedules because the later gaps otherwise disappear off the right edge.

## 13. Rejected Alternative

The implementation should not add schedule-specific runtime instrumentation in the first pass.

That alternative would require new event types, buffering, run correlation, replay semantics, and likely a broader `VisualEffectEventBus` redesign. None of that work improves the first user-visible result, because the old site achieved the desired visualization without it.

Runtime instrumentation should only be reconsidered if the product later needs one of these capabilities.

1. Exact display of computed delay values.
2. Visualization of schedule outputs or branching decisions.
3. Timeline persistence across unmounts.
4. Multiple tracked schedule steps in one example.

Until then, state-derived React history is the simplest and best option.

## 14. File-Level Change Plan

### Files to modify

- `src/lib/examples/constructors.ts`
  - Add `isScheduleTrackedStep` to `AddStepOptions`.
  - Derive `scheduleTimeline` on `ExampleDefinition` from tracked steps.
  - Resolve and validate the tracked attempt step during `defineExample(...)`.

- `src/components/landing/examples/VisualEffect.tsx`
  - Render the new schedule timeline panel between nodes and code.

- `src/lib/examples/catalog.ts`
  - Populate the `schedule` category with the migrated examples.

### New files

- `src/components/landing/examples/VisualEffectScheduleTimeline.tsx`
  - Render the timeline panel.
  - Own local segment history and cursor animation.

- `src/lib/examples/catalog/effect-repeat-spaced.tsx`
  - First repeat example using the new schedule timeline API.

- `src/lib/examples/catalog/effect-retry-exponential.tsx`
  - First retry example using the new schedule timeline API.

- `src/lib/examples/catalog/effect-retry-recurs.tsx`
  - Retry example with both spacing and attempt limits.

### Files that should stay unchanged in phase one

- `src/services/VisualEffectManager.ts`
- `src/services/VisualEffectEventBus.ts`
- `src/components/landing/examples/VisualEffectProvider.tsx`

Keeping these files unchanged is part of the design. The feature should slot into the current framework, not redesign it.

## 15. Migration Plan

### Phase 1: Framework support

1. Add schedule timeline metadata to constructor types.
2. Validate the tracked attempt step at definition time.
3. Add `VisualEffectScheduleTimeline.tsx`.
4. Insert the panel into `VisualEffect.tsx`.

### Phase 2: Example migration

5. Port `Effect.repeat` with `Schedule.spaced`.
6. Port `Effect.retry` with `Schedule.exponential`.
7. Port `Effect.retry` with `Schedule.intersect(Schedule.spaced, Schedule.recurs(...))`.

### Phase 3: Verification and polish

8. Verify reset, stop, success, failure, and interruption behavior.
9. Verify the cursor scrolls correctly on long schedules.
10. Verify the timeline still looks correct with reduced motion enabled.

## 16. Testing Strategy

### 16.1 Constructor validation tests

Add tests for `defineExample(...)` validation.

- `scheduleTimeline` without an attempt step fails.
- Multiple `isScheduleTrackedStep: true` steps fail.

### 16.2 Timeline behavior tests

The timeline component should be tested either through a small pure helper or through integration tests that simulate state changes.

Required cases:

- Example start creates a new session.
- Step `Running` opens a running segment.
- Step terminal state while example still runs opens a gap segment.
- Example terminal state closes the active segment.
- Example reset fades and then clears the session.
- Zero-width segments are omitted.
- A second run does not reuse stale state from the first run.

### 16.3 Manual verification

Manual checks are still important because this feature is visual.

1. Run the spaced repeat example and confirm alternating running and gap segments.
2. Run the exponential retry example and confirm the gaps visibly widen over time.
3. Stop an in-flight example and confirm the cursor stops and the active segment closes cleanly.
4. Reset a completed example and confirm the timeline fades out before clearing.
5. Confirm the schedule panel only appears for schedule examples.

### 16.4 Build checks

- `pnpm check`
- `pnpm lint`
- `pnpm build`

## 17. Acceptance Criteria

The feature is complete when all of the following are true.

1. Example authors can opt into a schedule timeline with a small, explicit API.
2. Exactly one step can be marked as the tracked schedule attempt in v1.
3. Schedule timeline configuration is validated during `defineExample(...)`.
4. The timeline renders inside the Visual Effect card without affecting non-schedule examples.
5. The timeline visually matches the old site's running segments, gap segments, cursor, gap labels, and clear behavior.
6. The implementation does not require schedule-specific `VisualEffectManager` changes.
7. The `schedule` category is populated with at least one repeat example and two retry examples.

## 18. Final Recommendation

The right implementation is the boring one.

The old website already demonstrated that schedule visual parity does not require schedule introspection. The new website already has better step and example state primitives than the old one had. The simplest successful design is therefore:

- add a tiny opt-in API,
- mark one tracked attempt step,
- render a dedicated timeline panel,
- and derive the trail from existing state transitions in React.

That approach restores the schedule visualization experience while preserving the current framework's clean architecture.

## 19. Open Questions

None.
