import * as Effect from "effect/Effect"
import * as Equal from "effect/Equal"
import { dual } from "effect/Function"
import * as ServiceMap from "effect/ServiceMap"
import type { RenderableResult } from "./domain"
import {
  normalizeSelectorInput,
  normalizeSnippetSource,
  resolveAllSelectors,
  snippetResultTargetKey,
  toStepSnippetTargetKey,
  validateSnippetLanguage,
  type ExampleCodeSnippet,
  type ExampleCodeSnippetInput,
  type SnippetHighlightSelector,
} from "./snippet-highlights"

export type RenderableEffect<
  A extends RenderableResult,
  E extends RenderableResult,
> = Effect.Effect<A, E>

export interface AddStepOptions {
  readonly label: string
  readonly highlight?: SnippetHighlightSelector | ReadonlyArray<SnippetHighlightSelector>
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
  readonly id: string
  readonly label: string
}

export type { ExampleCodeSnippetInput, SnippetHighlightSelector }

export interface DefineExampleInput {
  readonly label: string
  readonly subtitle?: string | undefined
  readonly description?: string | undefined
  readonly code: ExampleCodeSnippetInput
  readonly resultHighlight?: SnippetHighlightSelector | ReadonlyArray<SnippetHighlightSelector>
  readonly build: (ctx: BuildContext) => RenderableEffect<RenderableResult, RenderableResult>
}

export interface ExampleDefinition {
  readonly key: string
  readonly title: string
  readonly subtitle: string | undefined
  readonly description: string | undefined
  readonly steps: ReadonlyArray<StepDefinition>
  readonly program: RenderableEffect<RenderableResult, RenderableResult>
  readonly code: ExampleCodeSnippet
}

export const defineExample = (input: DefineExampleInput): ExampleDefinition => {
  const steps: Array<StepDefinition> = []
  const selectorsByTarget: Record<string, ReadonlyArray<SnippetHighlightSelector>> = {}

  const registerStep = (options: AddStepOptions): StepDefinition => {
    const step: StepDefinition = {
      id: `step-${steps.length.toString()}`,
      label: options.label,
    }
    steps.push(step)
    Equal.byReferenceUnsafe(step)

    if (options.highlight !== undefined) {
      const targetKey = toStepSnippetTargetKey(step.id)
      selectorsByTarget[targetKey] = normalizeSelectorInput(options.highlight, {
        exampleLabel: input.label,
        targetKey,
      })
    }

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

  if (input.resultHighlight !== undefined) {
    selectorsByTarget[snippetResultTargetKey] = normalizeSelectorInput(input.resultHighlight, {
      exampleLabel: input.label,
      targetKey: snippetResultTargetKey,
    })
  }

  const program = input.build({ addStep })

  const normalizedCodeSource = normalizeSnippetSource(input.code.source)

  const highlightsByTarget = resolveAllSelectors({
    source: normalizedCodeSource,
    selectorsByTarget,
    exampleLabel: input.label,
  })

  const language = validateSnippetLanguage(input.code.language, {
    exampleLabel: input.label,
  })

  const definition: ExampleDefinition = {
    key: crypto.randomUUID(),
    title: input.label,
    subtitle: input.subtitle,
    description: input.description,
    steps,
    program,
    code: {
      language,
      source: normalizedCodeSource,
      highlightsByTarget,
    },
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
