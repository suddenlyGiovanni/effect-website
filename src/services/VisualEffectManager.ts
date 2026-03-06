import * as Cause from "effect/Cause"
import * as Clock from "effect/Clock"
import * as DateTime from "effect/DateTime"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
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
import { InitialState, RenderableResult, VisualEffectState } from "@/lib/examples/domain"

export const exampleStateAtom = Atom.family((_definition: ExampleDefinition) =>
  Atom.make<VisualEffectState>(InitialState),
)

export const stepStateAtom = Atom.family((_definition: StepDefinition) =>
  Atom.make<VisualEffectState>(InitialState),
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
      const tracer = yield* Effect.tracer
      const fiberMap = yield* FiberMap.make<ExampleDefinition>()

      const startVisualSpan = (details: ExampleStep["Service"], startedAt: DateTime.Utc): void => {
        registry.set(
          stepStateAtom(details.step),
          VisualEffectState.Running({
            notification: Option.none(),
            startedAt,
          }),
        )
      }

      const endVisualSpan = (
        details: ExampleStep["Service"],
        startedAt: DateTime.Utc,
        endedAt: DateTime.Utc,
        exit: Exit.Exit<RenderableResult, RenderableResult>,
      ): void => {
        registry.set(stepStateAtom(details.step), exitToState(exit, startedAt, endedAt))
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
              endVisualSpan(
                details,
                startTime,
                endedAt,
                exit as Exit.Exit<RenderableResult, RenderableResult>,
              )
            },
            attribute(key, value) {
              span.attribute(key, value)
            },
            event(name, startTime, attributes) {
              span.event(name, startTime, attributes)
              registry.update(stepStateAtom(details.step), (state) => {
                if (state._tag !== "Running") return state
                return VisualEffectState.Running({
                  startedAt: state.startedAt,
                  notification: Option.some(name),
                })
              })
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
            const eff = clock.sleep(duration)
            if (!span) return eff
            if (span._tag !== "Span") return eff

            const details = ServiceMap.getOrUndefined(span.annotations, ExampleStep)
            if (!details) return eff

            registry.update(stepStateAtom(details.step), (state) => {
              if (state._tag !== "Running") return state
              return VisualEffectState.Running({
                startedAt: state.startedAt,
                notification: Option.some(`😴`),
              })
            })

            return eff
          })
        },
        currentTimeMillisUnsafe() {
          return clock.currentTimeMillisUnsafe()
        },
        currentTimeNanosUnsafe() {
          return clock.currentTimeNanosUnsafe()
        },
      }

      const manager = VisualEffectManager.of({
        start: Effect.fnUntraced(function* (example) {
          const atom = exampleStateAtom(example)
          const startedAt = yield* DateTime.now
          const snapshotRegistry = AtomRegistry.make({
            initialValues: example.controls.map(
              (control) => [control.atom, control.get(registry)] as const,
            ),
          })

          const snapshot = ExampleControlSnapshot.of({
            get: (atom) => snapshotRegistry.get(atom),
          })

          yield* FiberMap.run(
            fiberMap,
            example,
            Effect.suspend(() => {
              const startState = VisualEffectState.Running({
                startedAt,
                notification: Option.none(),
              })
              registry.set(atom, startState)
              return example.program.pipe(
                Effect.provideService(ExampleControlSnapshot, snapshot),
                Effect.onExit(
                  Effect.fnUntraced(function* (exit) {
                    const endedAt = yield* DateTime.now
                    const endState = exitToState(exit, startedAt, endedAt)
                    registry.set(atom, endState)
                  }),
                ),
              )
            }),
            { startImmediately: true, onlyIfMissing: true },
          )
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

const exitToState = <E extends RenderableResult, A extends RenderableResult>(
  exit: Exit.Exit<E, A>,
  startedAt: DateTime.Utc,
  endedAt: DateTime.Utc,
): VisualEffectState => {
  const duration = DateTime.distance(startedAt, endedAt)
  if (Exit.isSuccess(exit)) {
    return VisualEffectState.Succeeded({
      duration,
      endedAt,
      value: exit.value,
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
