import * as Effect from "effect/Effect"
import { dual } from "effect/Function"
import { STEP_KIND, ATTR_KIND, ATTR_EXAMPLE_KEY, ATTR_STEP_LABEL } from "@/lib/examples/constants"
import { type ExampleKey, DuplicateStepNodeId, StepLabel } from "@/lib/examples/domain"

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
  readonly label: StepLabel
}

export interface ExampleDefinition {
  readonly key: ExampleKey
  readonly label: ExampleLabel
  readonly description?: string | undefined
  readonly steps: ReadonlyArray<StepDefinition>
  readonly program: Effect.Effect<unknown, unknown>
}

export interface ExampleLabel {
  readonly title: string
  readonly subtitle?: string | undefined
}

export const defineExample = (input: {
  readonly key: ExampleKey
  readonly label: ExampleLabel
  readonly description?: string | undefined
  readonly build: (ctx: BuildContext) => Effect.Effect<unknown, unknown>
}): ExampleDefinition => {
  const steps: Array<StepDefinition> = []
  const seenLabels = new Set<StepLabel>()

  const registerStep = (options: AddStepOptions): StepDefinition => {
    const label = options.id
      ? StepLabel.makeUnsafe(options.id, { disableValidation: true })
      : StepLabel.makeUnsafe(options.label, { disableValidation: true })
    if (seenLabels.has(label)) {
      throw new DuplicateStepNodeId({
        key: input.key,
        nodeId: label,
      })
    }
    const step: StepDefinition = { label: label }
    seenLabels.add(label)
    steps.push(step)
    return step
  }

  const addStep: BuildContext["addStep"] = dual(
    2,
    <A, E>(self: Effect.Effect<A, E>, options: AddStepOptions): Effect.Effect<A, E> => {
      const step = registerStep(options)
      return self.pipe(
        Effect.withSpan(step.label, {
          attributes: {
            [ATTR_KIND]: STEP_KIND,
            [ATTR_EXAMPLE_KEY]: input.key,
            [ATTR_STEP_LABEL]: step.label,
          },
        }),
      )
    },
  )

  const program = input.build({ addStep })

  return {
    key: input.key,
    label: input.label,
    description: input.description,
    steps,
    program,
  }
}
