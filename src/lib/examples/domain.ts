import type * as React from "react"
import * as Data from "effect/Data"
import * as DateTime from "effect/DateTime"
import * as Duration from "effect/Duration"
import { constFalse, constTrue } from "effect/Function"
import * as Option from "effect/Option"
import * as Predicate from "effect/Predicate"

const RenderableResultSymbol = Symbol.for("renderable-result")

export abstract class RenderableResult {
  readonly [RenderableResultSymbol] = RenderableResultSymbol

  static is(u: unknown): u is RenderableResult {
    return Predicate.hasProperty(u, RenderableResultSymbol)
  }

  abstract render(): React.ReactNode
}

export type VisualEffectState = Data.TaggedEnum<{
  readonly Idle: {}
  readonly Running: {
    readonly startedAt: DateTime.Utc
    readonly notification: Option.Option<string>
  }
  readonly Succeeded: {
    readonly value: RenderableResult
    readonly endedAt: DateTime.Utc
    readonly duration: Duration.Duration
  }
  readonly Failed: {
    readonly error: RenderableResult
    readonly endedAt: DateTime.Utc
    readonly duration: Duration.Duration
  }
  readonly Interrupted: {
    readonly endedAt: DateTime.Utc
    readonly duration: Duration.Duration
  }
  readonly Died: {
    readonly defect: RenderableResult
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

export type VisualEffectScheduleTimeline = ReadonlyArray<TimelineSegment>

export type TimelineSegmentKind = "Running" | "Waiting"

export type TimelineSegment = {
  readonly id: string
  readonly kind: TimelineSegmentKind
  readonly startedAt: DateTime.Utc
  endedAt: DateTime.Utc | undefined
}

export const makeTimelineSegment = (
  kind: TimelineSegmentKind,
  startedAt: DateTime.Utc,
): TimelineSegment => ({
  id: crypto.randomUUID(),
  kind,
  startedAt,
  endedAt: undefined,
})
