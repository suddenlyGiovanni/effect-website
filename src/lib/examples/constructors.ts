import * as Effect from "effect/Effect"
import * as Equal from "effect/Equal"
import { dual } from "effect/Function"
import * as ServiceMap from "effect/ServiceMap"

export interface AddStepOptions {
  readonly id?: string
  readonly label: string
}

export interface BuildContext {
  readonly addStep: {
    <A, E, R>(self: Effect.Effect<A, E, R>, options: AddStepOptions): Effect.Effect<A, E, R>
    (options: AddStepOptions): <A, E, R>(self: Effect.Effect<A, E, R>) => Effect.Effect<A, E, R>
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
  readonly program: Effect.Effect<unknown, unknown>
}

export const defineExample = (input: {
  readonly label: string
  readonly subtitle?: string | undefined
  readonly description?: string | undefined
  readonly build: (ctx: BuildContext) => Effect.Effect<unknown, unknown>
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
    <A, E>(self: Effect.Effect<A, E>, options: AddStepOptions): Effect.Effect<A, E> => {
      const step = registerStep(options)
      return Effect.suspend(() =>
        self.pipe(
          Effect.withSpan(step.label, {
            annotations: ExampleStep.serviceMap({
              definition,
              step,
            }),
          }),
        ),
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
