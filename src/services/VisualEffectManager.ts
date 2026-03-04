import * as Cause from "effect/Cause"
import * as DateTime from "effect/DateTime"
import * as Duration from "effect/Duration"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import * as Layer from "effect/Layer"
import * as Option from "effect/Option"
import * as PubSub from "effect/PubSub"
import * as Schema from "effect/Schema"
import * as ServiceMap from "effect/ServiceMap"
import * as Stream from "effect/Stream"
import * as Tracer from "effect/Tracer"
import {
  PROGRAM_KIND,
  STEP_KIND,
  ATTR_KIND,
  ATTR_EXAMPLE_KEY,
  ATTR_STEP_LABEL,
} from "@/lib/examples/constants"
import { Event, ExampleKey, ProgramLabel, StepLabel } from "@/lib/examples/domain"

const EVENT_CAPACITY = 2_048

const ProgramSpanAttributes = Schema.Struct({
  kind: Schema.Literal(PROGRAM_KIND),
  key: ExampleKey,
  timestamp: Schema.DateTimeUtcFromMillis,
})
type ProgramSpanAttributes = typeof ProgramSpanAttributes.Type

const StepSpanAttributes = Schema.Struct({
  kind: Schema.Literal(STEP_KIND),
  key: ExampleKey,
  label: StepLabel,
  timestamp: Schema.DateTimeUtcFromMillis,
})
type StepSpanAttributes = typeof StepSpanAttributes.Type

const ExampleSpanAttributes = Schema.Union([ProgramSpanAttributes, StepSpanAttributes])
type ExampleSpanAttributes = typeof ExampleSpanAttributes.Type

const decodeSpanAttributes = Schema.decodeUnknownOption(ExampleSpanAttributes)

interface PendingSpanAttributes {
  kind?: typeof PROGRAM_KIND | typeof STEP_KIND | undefined
  key?: ExampleKey | undefined
  label?: StepLabel | undefined
  timestamp?: number | undefined
  started: boolean
}

export class VisualEffectManager extends ServiceMap.Service<
  VisualEffectManager,
  {
    readonly events: Stream.Stream<Event>
  }
>()("VisualEffectManager") {}

const make = Effect.gen(function* () {
  const tracer = yield* Effect.tracer
  const pubsub = yield* PubSub.sliding<Event>(EVENT_CAPACITY)

  const pendingSpanAttributes = new Map<string, PendingSpanAttributes>()

  const emitUnsafe = (event: Event): void => {
    PubSub.publishUnsafe(pubsub, event)
  }

  const addSpanAttribute = (span: Tracer.Span, key: string, value: unknown): void => {
    let pending = pendingSpanAttributes.get(span.spanId)

    if (!pending) {
      pending = { started: false }
      pendingSpanAttributes.set(span.spanId, pending)
    }

    if (pending.started) {
      return
    }

    pending.timestamp = getSpanStartTime(span)

    if (key === ATTR_KIND) {
      pending.kind = value as any
    }

    if (key === ATTR_EXAMPLE_KEY) {
      pending.key = value as any
    }

    if (key === ATTR_STEP_LABEL) {
      pending.label = value as any
    }

    startVisualSpan(span, pending)
  }

  const startVisualSpan = (span: Tracer.Span, pending: PendingSpanAttributes): void => {
    if (pending.started) {
      return
    }

    const option = decodeSpanAttributes(pending)

    if (Option.isSome(option)) {
      pending.started = true

      const attributes = option.value

      switch (attributes.kind) {
        case PROGRAM_KIND: {
          emitUnsafe({
            _tag: "ProgramStarted",
            key: attributes.key,
            label: ProgramLabel.makeUnsafe(span.name, { disableValidation: true }),
            timestamp: attributes.timestamp,
          })

          break
        }

        case STEP_KIND: {
          emitUnsafe({
            _tag: "StepStarted",
            key: attributes.key,
            label: attributes.label,
            timestamp: attributes.timestamp,
          })

          break
        }
      }
    }
  }

  const endVisualSpan = (
    span: Tracer.Span,
    endTime: bigint,
    exit: Exit.Exit<unknown, unknown>,
  ): void => {
    const pending = pendingSpanAttributes.get(span.spanId)

    if (!pending || !pending.timestamp) {
      return
    }

    const option = decodeSpanAttributes(pending)

    if (Option.isSome(option)) {
      pendingSpanAttributes.delete(span.spanId)

      const attributes = option.value
      const startTimestamp = pending.timestamp
      const endTimestamp = getSpanEndTime(endTime)
      const elapsed = endTimestamp - startTimestamp
      const duration = Duration.millis(Math.max(0, elapsed))

      switch (attributes.kind) {
        case PROGRAM_KIND: {
          const commonFields = {
            key: attributes.key,
            label: ProgramLabel.makeUnsafe(span.name, { disableValidation: true }),
            timestamp: DateTime.makeUnsafe(endTimestamp),
            duration,
          }
          if (Exit.isSuccess(exit)) {
            emitUnsafe({
              ...commonFields,
              _tag: "ProgramSucceeded",
              value: exit.value,
            })
          } else if (Cause.hasInterruptsOnly(exit.cause)) {
            emitUnsafe({
              ...commonFields,
              _tag: "ProgramInterrupted",
            })
          } else if (Cause.hasDies(exit.cause)) {
            const reason = exit.cause.reasons.find(Cause.isDieReason)!
            emitUnsafe({
              ...commonFields,
              _tag: "ProgramDied",
              defect: reason.defect,
            })
          } else {
            emitUnsafe({
              ...commonFields,
              _tag: "ProgramFailed",
              error: Cause.squash(exit.cause),
            })
          }
          break
        }
        case STEP_KIND: {
          const commonFields = {
            key: attributes.key,
            label: attributes.label,
            timestamp: DateTime.makeUnsafe(endTimestamp),
            duration,
          }
          if (Exit.isSuccess(exit)) {
            emitUnsafe({
              ...commonFields,
              _tag: "StepSucceeded",
              value: exit.value,
            })
          } else if (Cause.hasInterruptsOnly(exit.cause)) {
            emitUnsafe({
              ...commonFields,
              _tag: "StepInterrupted",
            })
          } else if (Cause.hasDies(exit.cause)) {
            const reason = exit.cause.reasons.find(Cause.isDieReason)!
            emitUnsafe({
              ...commonFields,
              _tag: "StepDied",
              defect: reason.defect,
            })
          } else {
            emitUnsafe({
              ...commonFields,
              _tag: "StepFailed",
              error: Cause.squash(exit.cause),
            })
          }

          break
        }
      }
    }
  }

  const visualEffectTracer = Tracer.make({
    span(options) {
      const span = tracer.span(options)
      return {
        _tag: span._tag,
        name: span.name,
        spanId: span.spanId,
        traceId: span.traceId,
        parent: span.parent,
        annotations: span.annotations,
        get status() {
          return span.status
        },
        get attributes() {
          return span.attributes
        },
        links: span.links,
        sampled: span.sampled,
        kind: span.kind,
        end(endTime, exit) {
          span.end(endTime, exit)
          endVisualSpan(span, endTime, exit)
        },
        attribute(key, value) {
          span.attribute(key, value)
          addSpanAttribute(span, key, value)
        },
        event(name, startTime, attributes) {
          span.event(name, startTime, attributes)
        },
        addLinks(links) {
          span.addLinks(links)
        },
      }
    },
    context: tracer.context,
  })

  return ServiceMap.make(VisualEffectManager, { events: Stream.fromPubSub(pubsub) }).pipe(
    ServiceMap.add(Tracer.Tracer, visualEffectTracer),
  )
})

export const layer = Layer.effectServices(make)

const getSpanStartTime = (span: Tracer.Span): number => {
  const startTime = span.status.startTime
  if (startTime === 0n) {
    return Date.now()
  }
  return nanosToMilliseconds(startTime)
}

const getSpanEndTime = (endTime: bigint): number => {
  if (endTime === 0n) {
    return Date.now()
  }
  return nanosToMilliseconds(endTime)
}

const nanosToMilliseconds = (nanos: bigint): number => Number(nanos / 1_000_000n)
