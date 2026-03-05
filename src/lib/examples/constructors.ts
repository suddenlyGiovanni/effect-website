import * as Effect from "effect/Effect"
import * as Equal from "effect/Equal"
import { dual } from "effect/Function"
import * as ServiceMap from "effect/ServiceMap"
import type { RenderableResult } from "./domain"

export type RenderableEffect<
  A extends RenderableResult,
  E extends RenderableResult,
> = Effect.Effect<A, E>

export interface AddStepOptions {
  readonly label: string
}

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
}

export interface StepDefinition {
  readonly label: string
}

export interface ExampleDefinition {
  readonly key: string
  readonly title: string
  readonly subtitle: string | undefined
  readonly description: string | undefined
  readonly steps: ReadonlyArray<StepDefinition>
  readonly program: RenderableEffect<RenderableResult, RenderableResult>
}

export const defineExample = (input: {
  readonly label: string
  readonly subtitle?: string | undefined
  readonly description?: string | undefined
  readonly build: (ctx: BuildContext) => RenderableEffect<RenderableResult, RenderableResult>
}): ExampleDefinition => {
  const steps: Array<StepDefinition> = []

  const registerStep = (options: AddStepOptions): StepDefinition => {
    const step: StepDefinition = { label: options.label }
    steps.push(step)
    Equal.byReferenceUnsafe(step)
    return step
  }

  const addStep: BuildContext["addStep"] = dual(
    2,
    <A extends RenderableResult, E extends RenderableResult>(
      self: RenderableEffect<A, E>,
      options: AddStepOptions,
    ): RenderableEffect<A, E> => {
      const step = registerStep(options)
      // Suspend the renderable Effect here to avoid eagerly accessing the
      // example definition when calling `addStep`
      return Effect.suspend(() =>
        Effect.withSpan(self, step.label, {
          annotations: ExampleStep.serviceMap({
            definition,
            step,
          }),
        }),
      )
    },
  )

  const program = input.build({ addStep })

  const definition: ExampleDefinition = {
    key: crypto.randomUUID(),
    title: input.label,
    subtitle: input.subtitle,
    description: input.description,
    steps,
    program,
  }
  Equal.byReferenceUnsafe(definition)

  return definition
}

export class ExampleStep extends ServiceMap.Service<
  ExampleStep,
  {
    readonly definition: ExampleDefinition
    readonly step: StepDefinition
  }
>()("ExampleStep") {}
