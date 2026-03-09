import * as Array from "effect/Array"
import * as Cause from "effect/Cause"
import * as Clock from "effect/Clock"
import * as DateTime from "effect/DateTime"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import * as Fiber from "effect/Fiber"
import * as FiberMap from "effect/FiberMap"
import * as Layer from "effect/Layer"
import * as Option from "effect/Option"
import * as Result from "effect/Result"
import * as ServiceMap from "effect/ServiceMap"
import * as Tracer from "effect/Tracer"
import * as Atom from "effect/unstable/reactivity/Atom"
import * as AtomRegistry from "effect/unstable/reactivity/AtomRegistry"
import {
  ExampleControlSnapshot,
  ExampleStep,
  type ExampleDefinition,
  type StepDefinition,
} from "@/lib/examples/constructors"
import {
  makeTimelineSegment,
  InitialState,
  RenderableResult,
  VisualEffectState,
  type VisualEffectScheduleTimeline,
} from "@/lib/examples/domain"
import { visualEffectExampleCueStepId } from "@/lib/examples/sound"
import { SoundManager } from "@/services/SoundManager"

export const exampleStateAtom = Atom.family((_definition: ExampleDefinition) =>
  Atom.make<VisualEffectState>(InitialState),
)

export const stepStateAtom = Atom.family((_definition: StepDefinition) =>
  Atom.make<VisualEffectState>(InitialState),
)

export const scheduleTimeAtom = Atom.family((_definition: ExampleDefinition) => Atom.make(0))

export const scheduleTimelineAtom = Atom.family((_definition: ExampleDefinition) =>
  Atom.make<VisualEffectScheduleTimeline>([]),
)

export class VisualEffectManager extends ServiceMap.Service<
  VisualEffectManager,
  {
    start: (example: ExampleDefinition) => Effect.Effect<void>
    stop: (example: ExampleDefinition) => Effect.Effect<void>
    reset: (example: ExampleDefinition) => Effect.Effect<void>
  }
>()("VisualEffectManager") {
  static readonly layer = Layer.effectServices(
    Effect.gen(function* () {
      const registry = yield* AtomRegistry.AtomRegistry
      const soundManager = yield* SoundManager
      const tracer = yield* Effect.tracer
      const fiberMap = yield* FiberMap.make<ExampleDefinition>()
      const services = Effect.services()
      const runSync = Effect.runSyncWith(services)

      const playExampleTransition = (
        example: ExampleDefinition,
        previous: VisualEffectState,
        current: VisualEffectState,
      ): Effect.Effect<void> => {
        if (previous._tag === current._tag) {
          return Effect.void
        }

        if (previous._tag === "Idle" && current._tag === "Running") {
          return soundManager.play({
            _tag: "StepRunning",
            exampleKey: example.key,
            stepId: visualEffectExampleCueStepId,
          })
        }

        if (example.steps.length > 0 || previous._tag !== "Running") {
          return Effect.void
        }

        switch (current._tag) {
          case "Succeeded":
            return soundManager.play({
              _tag: "StepSucceeded",
              exampleKey: example.key,
              stepId: visualEffectExampleCueStepId,
            })
          case "Failed":
            return soundManager.play({
              _tag: "StepFailed",
              exampleKey: example.key,
              stepId: visualEffectExampleCueStepId,
            })
          case "Interrupted":
            return soundManager.play({
              _tag: "StepInterrupted",
              exampleKey: example.key,
              stepId: visualEffectExampleCueStepId,
            })
          case "Died":
            return soundManager.play({
              _tag: "StepDied",
              exampleKey: example.key,
              stepId: visualEffectExampleCueStepId,
            })
          default:
            return Effect.void
        }
      }

      const playStepTransition = (
        details: ExampleStep["Service"],
        previous: VisualEffectState,
        current: VisualEffectState,
      ): Effect.Effect<void> => {
        if (previous._tag === current._tag) {
          return Effect.void
        }

        if (current._tag === "Running") {
          return soundManager.play({
            _tag: "StepRunning",
            exampleKey: details.definition.key,
            stepId: details.step.id,
          })
        }

        if (previous._tag !== "Running") {
          return Effect.void
        }

        switch (current._tag) {
          case "Succeeded":
            return soundManager.play({
              _tag: "StepSucceeded",
              exampleKey: details.definition.key,
              stepId: details.step.id,
            })
          case "Failed":
            return soundManager.play({
              _tag: "StepFailed",
              exampleKey: details.definition.key,
              stepId: details.step.id,
            })
          case "Interrupted":
            return soundManager.play({
              _tag: "StepInterrupted",
              exampleKey: details.definition.key,
              stepId: details.step.id,
            })
          case "Died":
            return soundManager.play({
              _tag: "StepDied",
              exampleKey: details.definition.key,
              stepId: details.step.id,
            })
          default:
            return Effect.void
        }
      }

      const setExampleState = (
        example: ExampleDefinition,
        current: VisualEffectState,
      ): Effect.Effect<void> => {
        const atom = exampleStateAtom(example)
        const previous = registry.get(atom)
        registry.set(atom, current)
        return playExampleTransition(example, previous, current)
      }

      const setStepState = (details: ExampleStep["Service"], state: VisualEffectState): void => {
        const atom = stepStateAtom(details.step)
        const previous = registry.get(atom)
        registry.set(atom, state)

        runSync(playStepTransition(details, previous, state))

        // Update the schedule timeline when working with a schedule step
        if (details.step.type === "schedule") {
          updateScheduleTimeline(details, state)
        }
      }

      const runningNotificationMatches = (state: VisualEffectState, message: string): boolean => {
        return (
          state._tag === "Running" &&
          Option.isSome(state.notification) &&
          state.notification.value === message
        )
      }

      const setStepNotification = (details: ExampleStep["Service"], message: string): void => {
        const atom = stepStateAtom(details.step)
        const previous = registry.get(atom)

        if (previous._tag !== "Running" || runningNotificationMatches(previous, message)) {
          return
        }

        const state = VisualEffectState.Running({
          startedAt: previous.startedAt,
          notification: Option.some(message),
        })

        registry.set(atom, state)
      }

      const updateScheduleTimeline = (
        details: ExampleStep["Service"],
        state: VisualEffectState,
      ): void => {
        const exampleState = registry.get(exampleStateAtom(details.definition))

        // Don't attempt to update the timeline if the example is not currently
        // running, or if receiving a state update for a step that is idle
        if (exampleState._tag !== "Running" || state._tag === "Idle") {
          return
        }

        registry.update(scheduleTimelineAtom(details.definition), (segments) => {
          if (Array.isReadonlyArrayNonEmpty(segments)) {
            const previousSegment = Array.lastNonEmpty(segments)
            const nextSegmentKind = state._tag === "Running" ? "Running" : "Waiting"

            // Don't update the timeline if the previous and next segments are
            // the same kind
            if (previousSegment.kind === nextSegmentKind) {
              return segments
            }

            const transitionTime = state._tag === "Running" ? state.startedAt : state.endedAt
            const nextSegment = makeTimelineSegment(nextSegmentKind, transitionTime)
            previousSegment.endedAt = transitionTime

            return Array.append(segments, nextSegment)
          } else {
            const kind = state._tag === "Running" ? "Running" : "Waiting"
            return Array.of(makeTimelineSegment(kind, exampleState.startedAt))
          }
        })
      }

      const startVisualSpan = (details: ExampleStep["Service"], startedAt: DateTime.Utc): void => {
        const state = VisualEffectState.Running({
          notification: Option.none(),
          startedAt,
        })
        setStepState(details, state)
      }

      const endVisualSpan = (
        details: ExampleStep["Service"],
        startedAt: DateTime.Utc,
        endedAt: DateTime.Utc,
        exit: Exit.Exit<unknown, unknown>,
      ): void => {
        setStepState(details, exitToState(exit, startedAt, endedAt))
      }

      const visualEffectTracer = Tracer.make({
        span(options) {
          const span = tracer.span(options)
          const details = ServiceMap.getOrUndefined(span.annotations, ExampleStep)
          if (!details) return span
          const startTime = dateTimeFromNanos(options.startTime)
          startVisualSpan(details, startTime)
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
              const endedAt = dateTimeFromNanos(endTime)
              endVisualSpan(details, startTime, endedAt, exit)
            },
            attribute(key, value) {
              span.attribute(key, value)
            },
            event(name, startTime, attributes) {
              span.event(name, startTime, attributes)
              setStepNotification(details, name)
            },
            addLinks(links) {
              span.addLinks(links)
            },
          }
        },
        context: tracer.context,
      })

      const clock = yield* Clock.Clock
      const newClock: Clock.Clock = {
        currentTimeMillis: clock.currentTimeMillis,
        currentTimeNanos: clock.currentTimeNanos,
        sleep(duration) {
          return Effect.withFiber((fiber) => {
            const span = fiber.currentSpan
            const effect = clock.sleep(duration)
            if (!span) return effect
            if (span._tag !== "Span") return effect

            const details = ServiceMap.getOrUndefined(span.annotations, ExampleStep)
            if (!details) return effect

            setStepNotification(details, "😴")

            return effect
          })
        },
        currentTimeMillisUnsafe() {
          return clock.currentTimeMillisUnsafe()
        },
        currentTimeNanosUnsafe() {
          return clock.currentTimeNanosUnsafe()
        },
      }

      const scheduleTimer = (example: ExampleDefinition) =>
        Effect.callback((_resume) => {
          let frame = 0
          const tickScheduleTimer = () => {
            registry.set(scheduleTimeAtom(example), clock.currentTimeMillisUnsafe())
            frame = globalThis.requestAnimationFrame(tickScheduleTimer)
          }
          tickScheduleTimer()
          return Effect.sync(() => {
            globalThis.cancelAnimationFrame(frame)
            registry.set(scheduleTimeAtom(example), 0)
          })
        })

      const manager = VisualEffectManager.of({
        start: Effect.fnUntraced(function* (example) {
          const startedAt = yield* DateTime.now
          const startedAtMillis = DateTime.toEpochMillis(startedAt)
          const snapshotRegistry = AtomRegistry.make({
            initialValues: example.controls.map(
              (control) => [control.atom, control.get(registry)] as const,
            ),
          })

          const snapshot = ExampleControlSnapshot.of({
            get: (atom) => snapshotRegistry.get(atom),
          })

          const program = Effect.gen(function* () {
            const startState = VisualEffectState.Running({
              startedAt,
              notification: Option.none(),
            })

            if (example.type === "schedule") {
              registry.set(scheduleTimeAtom(example), startedAtMillis)
            }

            yield* setExampleState(example, startState)

            const fiber = yield* example.program.pipe(
              Effect.provideService(ExampleControlSnapshot, snapshot),
              Effect.onExit(
                Effect.fnUntraced(function* (exit) {
                  const endedAt = yield* DateTime.now
                  const endState = exitToState(exit, startedAt, endedAt)
                  yield* setExampleState(example, endState)
                }),
              ),
              Effect.forkChild,
            )

            if (example.type === "schedule") {
              yield* Effect.forkChild(scheduleTimer(example))
            }

            return yield* Fiber.join(fiber)
          })

          yield* FiberMap.run(fiberMap, example, program, {
            startImmediately: true,
            onlyIfMissing: true,
          })
        }),
        stop: Effect.fnUntraced(function* (example) {
          yield* FiberMap.remove(fiberMap, example)
        }),
        reset: Effect.fnUntraced(function* (example) {
          yield* FiberMap.remove(fiberMap, example)
          registry.set(exampleStateAtom(example), InitialState)
          for (const step of example.steps) {
            registry.set(stepStateAtom(step), InitialState)
          }
          registry.set(scheduleTimelineAtom(example), [])

          yield* soundManager.play({
            _tag: "ExampleReset",
            exampleKey: example.key,
          })
        }),
      })

      return Tracer.Tracer.serviceMap(visualEffectTracer).pipe(
        ServiceMap.add(Clock.Clock, newClock),
        ServiceMap.add(VisualEffectManager, manager),
      )
    }),
  )
}

const dateTimeFromNanos = (nanos: bigint): DateTime.Utc => {
  return DateTime.makeUnsafe(nanosToMilliseconds(nanos))
}

const nanosToMilliseconds = (nanos: bigint): number => Number(nanos / 1_000_000n)

const exitToState = (
  exit: Exit.Exit<unknown, unknown>,
  startedAt: DateTime.Utc,
  endedAt: DateTime.Utc,
): VisualEffectState => {
  const duration = DateTime.distance(startedAt, endedAt)
  if (Exit.isSuccess(exit)) {
    return VisualEffectState.Succeeded({
      duration,
      endedAt,
      value: exit.value as RenderableResult,
    })
  }
  if (Cause.hasInterruptsOnly(exit.cause)) {
    return VisualEffectState.Interrupted({
      duration,
      endedAt,
    })
  }
  const defect = Cause.findDefect(exit.cause)
  if (Result.isSuccess(defect)) {
    return VisualEffectState.Died({
      defect: defect.success as RenderableResult,
      duration,
      endedAt,
    })
  }
  return VisualEffectState.Failed({
    duration,
    endedAt,
    error: Cause.squash(exit.cause) as RenderableResult,
  })
}
