import * as Array from "effect/Array"
import * as Cause from "effect/Cause"
import * as Clock from "effect/Clock"
import * as DateTime from "effect/DateTime"
import * as Duration from "effect/Duration"
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
  ControlSnapshot,
  ExampleStep,
  Notifications,
  VisualFinalizers,
  type ExampleDefinition,
  type StepDefinition,
} from "@/lib/examples/constructors"
import {
  InitialFinalizerPanelState,
  makeTimelineSegment,
  InitialState,
  RenderableResult,
  reduceFinalizerPanel,
  VisualEffectState,
  type VisualFinalizerEvent,
  type VisualFinalizerState,
  type VisualEffectNotification,
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

export const finalizersAtom = Atom.family((_definition: ExampleDefinition) =>
  Atom.make<VisualFinalizerState>(InitialFinalizerPanelState),
)

export interface ResetOptions {
  readonly silent?: boolean | undefined
}

export class VisualEffectManager extends ServiceMap.Service<
  VisualEffectManager,
  {
    start: (example: ExampleDefinition) => Effect.Effect<void>
    stop: (example: ExampleDefinition) => Effect.Effect<void>
    reset: (example: ExampleDefinition, options?: ResetOptions) => Effect.Effect<void>
  }
>()("VisualEffectManager") {
  static readonly layer = Layer.effectServices(
    Effect.gen(function* () {
      const clock = yield* Clock.Clock
      const tracer = yield* Effect.tracer
      const registry = yield* AtomRegistry.AtomRegistry
      const soundManager = yield* SoundManager
      const fiberMap = yield* FiberMap.make<ExampleDefinition>()
      const services = yield* Effect.services()
      const runSync = Effect.runSyncWith(services)
      const resettingExamples = new Set<string>()
      const exampleRunIds = new Map<string, number>()

      const playExampleTransition = (
        example: ExampleDefinition,
        previous: VisualEffectState,
        current: VisualEffectState,
      ): Effect.Effect<void> => {
        if (previous._tag === current._tag) {
          return Effect.void
        }

        if (resettingExamples.has(example.key)) {
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

        if (resettingExamples.has(details.definition.key)) {
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
        if (details.step.addToTimeline) {
          updateScheduleTimeline(details, state)
        }
      }

      const setStepNotification = (
        details: ExampleStep["Service"],
        message: string,
        attributes: Record<string, unknown> | undefined,
      ): void => {
        const atom = stepStateAtom(details.step)
        const previous = registry.get(atom)
        const state = setStateNotification(previous, message, attributes)
        registry.set(atom, state)
      }

      const setExampleNotification = (
        example: ExampleDefinition,
        message: string,
        attributes: Record<string, unknown> | undefined,
      ): void => {
        const atom = exampleStateAtom(example)
        const previous = registry.get(atom)
        const state = setStateNotification(previous, message, attributes)
        registry.set(atom, state)
      }

      const nextRunId = (example: ExampleDefinition): number => {
        const previous = exampleRunIds.get(example.key) ?? 0
        const next = previous + 1
        exampleRunIds.set(example.key, next)
        return next
      }

      const dispatchFinalizerEvent = (
        example: ExampleDefinition,
        event: VisualFinalizerEvent,
      ): void => {
        registry.update(finalizersAtom(example), (state) => reduceFinalizerPanel(state, event))
      }

      const makeVisualFinalizers = (
        example: ExampleDefinition,
        runId: number,
      ): VisualFinalizers["Service"] => {
        let registrationIndex = 0

        return {
          register: Effect.fn(function* (label: string) {
            const id = crypto.randomUUID()
            const at = yield* DateTime.now
            const currentIndex = registrationIndex
            registrationIndex += 1

            dispatchFinalizerEvent(example, {
              _tag: "Registered",
              runId,
              id,
              label,
              registrationIndex: currentIndex,
              at,
            })

            return id
          }),
          run: Effect.fn(function* <A, E, R>(id: string, effect: Effect.Effect<A, E, R>) {
            const startedAt = yield* DateTime.now

            dispatchFinalizerEvent(example, {
              _tag: "Started",
              runId,
              id,
              at: startedAt,
            })

            const exit = yield* Effect.exit(effect)
            const endedAt = yield* DateTime.now

            dispatchFinalizerEvent(example, {
              _tag: "Finished",
              runId,
              id,
              at: endedAt,
              phase: classifyFinalizerExit(exit),
            })

            if (Exit.isSuccess(exit)) {
              return exit.value
            }

            return yield* Effect.failCause(exit.cause)
          }),
        }
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
        const previous = registry.get(stepStateAtom(details.step))
        setStepState(details, exitToState(exit, startedAt, endedAt, previous))
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
              setStepNotification(details, name, attributes)
            },
            addLinks(links) {
              span.addLinks(links)
            },
          }
        },
        context: tracer.context,
      })

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

      const DEFAULT_NOTIFICATION_DURATION = Duration.seconds(2)

      const notifyForExample =
        (example: ExampleDefinition): (typeof Notifications.Service)["notify"] =>
        (message, options) =>
          Effect.withFiber((fiber) => {
            const span = fiber.currentSpan

            const duration = options?.duration
              ? (Duration.fromInput(options.duration) ?? DEFAULT_NOTIFICATION_DURATION)
              : DEFAULT_NOTIFICATION_DURATION

            const attributes = {
              duration,
              showOnHover: options?.showOnHover ?? false,
            } satisfies Record<string, unknown>

            if (!span || span._tag !== "Span") {
              setExampleNotification(example, message, attributes)
              return Effect.void
            }

            const details = ServiceMap.getOrUndefined(span.annotations, ExampleStep)
            if (details === undefined) {
              setExampleNotification(example, message, attributes)
              return Effect.void
            }

            span.event(message, clock.currentTimeNanosUnsafe(), {
              duration,
              showOnHover: options?.showOnHover ?? false,
            })

            return Effect.void
          })

      const manager = VisualEffectManager.of({
        start: Effect.fnUntraced(function* (example) {
          const startedAt = yield* DateTime.now
          const startedAtMillis = DateTime.toEpochMillis(startedAt)
          const snapshotRegistry = AtomRegistry.make({
            initialValues: example.controls.map(
              (control) => [control.atom, registry.get(control.atom)] as const,
            ),
          })

          const snapshot = ControlSnapshot.of({
            get: (atom) => snapshotRegistry.get(atom),
          })

          const notify = notifyForExample(example)

          const program = Effect.gen(function* () {
            const runId = nextRunId(example)
            const startState = VisualEffectState.Running({
              startedAt,
              notification: Option.none(),
            })

            dispatchFinalizerEvent(example, {
              _tag: "RunStarted",
              runId,
            })

            if (example.type === "schedule") {
              registry.set(scheduleTimeAtom(example), startedAtMillis)
            }

            yield* setExampleState(example, startState)

            const services = ServiceMap.make(ControlSnapshot, snapshot).pipe(
              ServiceMap.add(Notifications, { notify }),
              ServiceMap.add(VisualFinalizers, makeVisualFinalizers(example, runId)),
            )

            const fiber = yield* example.program.pipe(
              Effect.provide(services),
              Effect.onExit(
                Effect.fnUntraced(function* (exit) {
                  const endedAt = yield* DateTime.now
                  const currentState = registry.get(exampleStateAtom(example))
                  const endState = exitToState(exit, startedAt, endedAt, currentState)
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
        reset: (example, options) =>
          Effect.acquireUseRelease(
            Effect.sync(() => resettingExamples.add(example.key)),
            Effect.fnUntraced(function* () {
              yield* FiberMap.remove(fiberMap, example)
              registry.set(exampleStateAtom(example), InitialState)
              for (const step of example.steps) {
                registry.set(stepStateAtom(step), InitialState)
              }
              registry.set(scheduleTimelineAtom(example), [])
              dispatchFinalizerEvent(example, {
                _tag: "Reset",
                runId: nextRunId(example),
              })
              if (options?.silent !== true) {
                yield* soundManager.play({
                  _tag: "ExampleReset",
                  exampleKey: example.key,
                })
              }
            }),
            () => Effect.sync(() => resettingExamples.delete(example.key)),
          ),
      })

      return Tracer.Tracer.serviceMap(visualEffectTracer).pipe(
        ServiceMap.add(VisualEffectManager, manager),
      )
    }),
  )
}

const classifyFinalizerExit = <A, E>(
  exit: Exit.Exit<A, E>,
): "Succeeded" | "Failed" | "Interrupted" => {
  if (Exit.isSuccess(exit)) {
    return "Succeeded"
  }

  return Cause.hasInterruptsOnly(exit.cause) ? "Interrupted" : "Failed"
}

const dateTimeFromNanos = (nanos: bigint): DateTime.Utc => {
  return DateTime.makeUnsafe(nanosToMilliseconds(nanos))
}

const nanosToMilliseconds = (nanos: bigint): number => Number(nanos / 1_000_000n)

const getNotificationDuration = (
  attributes: Record<string, unknown> | undefined,
): Duration.Duration => {
  const duration = attributes?.duration
  return Duration.isDuration(duration) ? duration : Duration.seconds(2)
}

const getNotificationShowOnHover = (attributes: Record<string, unknown> | undefined): boolean => {
  return attributes?.showOnHover === true
}

const makeNotification = (
  message: string,
  attributes: Record<string, unknown> | undefined,
): VisualEffectNotification => ({
  id: crypto.randomUUID(),
  message,
  duration: getNotificationDuration(attributes),
  showOnHover: getNotificationShowOnHover(attributes),
})

const setStateNotification = (
  state: VisualEffectState,
  message: string,
  attributes: Record<string, unknown> | undefined,
): VisualEffectState => {
  const notification = Option.some(makeNotification(message, attributes))

  switch (state._tag) {
    case "Running":
      return VisualEffectState.Running({
        startedAt: state.startedAt,
        notification,
      })
    case "Succeeded":
      return VisualEffectState.Succeeded({
        duration: state.duration,
        endedAt: state.endedAt,
        value: state.value,
        notification,
      })
    case "Failed":
      return VisualEffectState.Failed({
        duration: state.duration,
        endedAt: state.endedAt,
        error: state.error,
        notification,
      })
    case "Interrupted":
      return VisualEffectState.Interrupted({
        duration: state.duration,
        endedAt: state.endedAt,
        notification,
      })
    case "Died":
      return VisualEffectState.Died({
        defect: state.defect,
        duration: state.duration,
        endedAt: state.endedAt,
        notification,
      })
    case "Idle":
      return state
  }
}

const getStateNotification = (
  state: VisualEffectState,
): Option.Option<VisualEffectNotification> => {
  switch (state._tag) {
    case "Running":
    case "Succeeded":
    case "Failed":
    case "Interrupted":
    case "Died":
      return state.notification
    case "Idle":
      return Option.none()
  }
}

const exitToState = (
  exit: Exit.Exit<unknown, unknown>,
  startedAt: DateTime.Utc,
  endedAt: DateTime.Utc,
  previous: VisualEffectState,
): VisualEffectState => {
  const duration = DateTime.distance(startedAt, endedAt)
  const notification = getStateNotification(previous)
  if (Exit.isSuccess(exit)) {
    return VisualEffectState.Succeeded({
      duration,
      endedAt,
      value: exit.value as RenderableResult,
      notification,
    })
  }
  if (Cause.hasInterruptsOnly(exit.cause)) {
    return VisualEffectState.Interrupted({
      duration,
      endedAt,
      notification,
    })
  }
  const defect = Cause.findDefect(exit.cause)
  if (Result.isSuccess(defect)) {
    return VisualEffectState.Died({
      defect: defect.success as RenderableResult,
      duration,
      endedAt,
      notification,
    })
  }
  const error = Cause.squash(exit.cause) as RenderableResult
  return VisualEffectState.Failed({
    duration,
    endedAt,
    error,
    notification,
  })
}
