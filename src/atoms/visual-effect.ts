import * as Data from "effect/Data"
import * as DateTime from "effect/DateTime"
import * as Duration from "effect/Duration"
import * as Effect from "effect/Effect"
import * as FiberHandle from "effect/FiberHandle"
import { constFalse, constTrue, identity } from "effect/Function"
import * as Result from "effect/Result"
import * as Stream from "effect/Stream"
import * as SubscriptionRef from "effect/SubscriptionRef"
import * as Atom from "effect/unstable/reactivity/Atom"
import { EXAMPLES_CATALOG, type ExampleCategory } from "@/lib/examples/catalog"
import type { ExampleDefinition } from "@/lib/examples/constructors"
import type { Event, StepLabel } from "@/lib/examples/domain"
import * as VisualEffectManager from "@/services/VisualEffectManager"
import { PROGRAM_KIND, ATTR_KIND, ATTR_EXAMPLE_KEY } from "@/lib/examples/constants"

export const currentExampleCategoryAtom = Atom.make("concurrency" as ExampleCategory)

export const currentExampleAtom = Atom.writable<ExampleDefinition, ExampleDefinition>(
  (get) => {
    const category = get(currentExampleCategoryAtom)
    return EXAMPLES_CATALOG[category].examples[0]
  },
  (ctx, definition) => ctx.setSelf(definition),
)

const runtime = Atom.runtime(VisualEffectManager.layer)

export type VisualEffectState = Data.TaggedEnum<{
  readonly Idle: {}
  readonly Running: {
    readonly id: string
    readonly startedAt: DateTime.Utc
  }
  readonly Succeeded: {
    readonly id: string
    readonly value: unknown
    readonly endedAt: DateTime.Utc
    readonly duration: Duration.Duration
  }
  readonly Failed: {
    readonly id: string
    readonly error: unknown
    readonly endedAt: DateTime.Utc
    readonly duration: Duration.Duration
  }
  readonly Interrupted: {
    readonly id: string
    readonly endedAt: DateTime.Utc
    readonly duration: Duration.Duration
  }
  readonly Died: {
    readonly id: string
    readonly defect: unknown
    readonly endedAt: DateTime.Utc
    readonly duration: Duration.Duration
  }
}>
export const VisualEffectState = Data.taggedEnum<VisualEffectState>()

export const InitialState: VisualEffectState = VisualEffectState.Idle()

export const canReset = VisualEffectState.$match({
  Idle: constFalse,
  Running: constFalse,
  Succeeded: constTrue,
  Interrupted: constTrue,
  Failed: constTrue,
  Died: constTrue,
})

export const visualEffectAtom = runtime.atom(
  Effect.fnUntraced(function* (get) {
    const manager = yield* VisualEffectManager.VisualEffectManager
    const ref = yield* SubscriptionRef.make<Result.Result<Event, void>>(Result.failVoid)
    const handle = yield* FiberHandle.make()

    const example = get(currentExampleAtom)

    yield* manager.events.pipe(
      Stream.runForEach((event) => SubscriptionRef.set(ref, Result.succeed(event))),
      Effect.forkScoped,
    )

    const start = example.program.pipe(
      Effect.withSpan(example.label.title, {
        attributes: {
          [ATTR_KIND]: PROGRAM_KIND,
        },
      }),
      Effect.annotateSpans(ATTR_EXAMPLE_KEY, example.key),
      FiberHandle.run(handle, { startImmediately: true }),
    )

    const stop = FiberHandle.clear(handle)

    const reset = Effect.gen(function* () {
      yield* SubscriptionRef.set(ref, Result.failVoid)
      yield* stop
    })

    const programStateAtom = Atom.make(
      SubscriptionRef.changes(ref).pipe(
        Stream.filterMap(identity),
        Stream.filter((event) => event._tag.startsWith("Program")),
        Stream.map(eventToState),
      ),
    )

    const stepStateAtom = Atom.family((label: StepLabel) =>
      Atom.make(
        SubscriptionRef.changes(ref).pipe(
          Stream.filterMap(identity),
          Stream.filter((event) => "label" in event && event.label === label),
          Stream.map(eventToState),
        ),
      ),
    )

    return {
      programStateAtom,
      stepStateAtom,
      startExampleAtom: runtime.fn(() => start),
      stopExampleAtom: runtime.fn(() => stop),
      resetExampleAtom: runtime.fn(() => reset),
    }
  }),
)

const eventToState = (event: Event): VisualEffectState => {
  switch (event._tag) {
    case "ProgramStarted": {
      return VisualEffectState.Running({
        id: event.label,
        startedAt: event.timestamp,
      })
    }
    case "ProgramSucceeded": {
      return VisualEffectState.Succeeded({
        id: event.label,
        value: event.value,
        endedAt: event.timestamp,
        duration: event.duration,
      })
    }
    case "ProgramFailed": {
      return VisualEffectState.Failed({
        id: event.label,
        error: event.error,
        endedAt: event.timestamp,
        duration: event.duration,
      })
    }
    case "ProgramDied": {
      return VisualEffectState.Died({
        id: event.label,
        defect: event.defect,
        endedAt: event.timestamp,
        duration: event.duration,
      })
    }
    case "ProgramInterrupted": {
      return VisualEffectState.Interrupted({
        id: event.label,
        endedAt: event.timestamp,
        duration: event.duration,
      })
    }
    case "StepStarted": {
      return VisualEffectState.Running({
        id: event.label,
        startedAt: event.timestamp,
      })
    }
    case "StepSucceeded": {
      return VisualEffectState.Succeeded({
        id: event.label,
        value: event.value,
        endedAt: event.timestamp,
        duration: event.duration,
      })
    }
    case "StepFailed": {
      return VisualEffectState.Failed({
        id: event.label,
        error: event.error,
        endedAt: event.timestamp,
        duration: event.duration,
      })
    }
    case "StepDied": {
      return VisualEffectState.Died({
        id: event.label,
        defect: event.defect,
        endedAt: event.timestamp,
        duration: event.duration,
      })
    }
    case "StepInterrupted": {
      return VisualEffectState.Interrupted({
        id: event.label,
        endedAt: event.timestamp,
        duration: event.duration,
      })
    }
  }
}
