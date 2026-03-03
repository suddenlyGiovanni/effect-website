import * as DateTime from "effect/DateTime"
import * as Duration from "effect/Duration"
import * as Effect from "effect/Effect"
import * as Stream from "effect/Stream"
import * as Atom from "effect/unstable/reactivity/Atom"
import { EXAMPLES_CATALOG, type ExampleCategory } from "@/lib/examples/catalog"
import type { ExampleDefinition } from "@/lib/examples/constructors"
import type { Event, StepLabel } from "@/lib/examples/domain"
import { VisualEffectManager } from "@/services/VisualEffectManager"
import * as Data from "effect/Data"

export const currentExampleCategoryAtom = Atom.make("concurrency" as ExampleCategory)

export const currentExampleAtom = Atom.writable<ExampleDefinition, ExampleDefinition>(
  (get) => {
    const category = get(currentExampleCategoryAtom)
    return EXAMPLES_CATALOG[category].examples[0]
  },
  (ctx, definition) => ctx.setSelf(definition),
)

const runtime = Atom.runtime(VisualEffectManager.layer)

export const startExampleAtom = runtime.fn(
  Effect.fnUntraced(function* (_: void, get: Atom.FnContext) {
    const example = get(currentExampleAtom)
    yield* example.effect
  }),
)

export const stopExampleAtom = runtime.fn(
  Effect.fnUntraced(function* () {
    const manager = yield* VisualEffectManager
    yield* manager.cancel
  }),
)

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

export const programStateAtom = runtime.atom(
  Effect.gen(function* () {
    const manager = yield* VisualEffectManager
    return manager.events.pipe(
      Stream.filter((event) => {
        console.log(event)
        return event._tag.startsWith("Program")
      }),
      Stream.map(eventToState),
    )
  }).pipe(Stream.unwrap),
)

export const stepStateAtom = Atom.family((label: StepLabel) =>
  runtime.atom(
    Effect.gen(function* () {
      const manager = yield* VisualEffectManager
      return manager.events.pipe(
        Stream.filter((event) => "label" in event && event.label === label),
        Stream.map(eventToState),
      )
    }).pipe(Stream.unwrap),
  ),
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
