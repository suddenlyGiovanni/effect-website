import { Data, DateTime, Duration } from "effect"
import { constFalse, constTrue } from "effect/Function"
import * as Option from "effect/Option"

export type VisualEffectState = Data.TaggedEnum<{
  readonly Idle: {}
  readonly Running: {
    readonly startedAt: DateTime.Utc
    readonly notification: Option.Option<string>
  }
  readonly Succeeded: {
    readonly value: unknown
    readonly endedAt: DateTime.Utc
    readonly duration: Duration.Duration
  }
  readonly Failed: {
    readonly error: unknown
    readonly endedAt: DateTime.Utc
    readonly duration: Duration.Duration
  }
  readonly Interrupted: {
    readonly endedAt: DateTime.Utc
    readonly duration: Duration.Duration
  }
  readonly Died: {
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
