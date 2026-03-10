import type * as AtomRegistry from "effect/unstable/reactivity/AtomRegistry"
import * as Duration from "effect/Duration"
import * as Effect from "effect/Effect"
import * as Equal from "effect/Equal"
import { dual } from "effect/Function"
import * as ServiceMap from "effect/ServiceMap"
import * as Types from "effect/Types"
import * as Atom from "effect/unstable/reactivity/Atom"
import * as React from "react"
import type { RenderableResult } from "./domain"
import {
  normalizeSelectorInput,
  resolveExampleCodeSnippet,
  snippetResultTargetKey,
  toStepSnippetTargetKey,
  type CodeSnippet,
  type CodeSnippetConfig,
  HighlightSelector,
} from "./snippet-highlights"

export { type CodeSnippetConfig, HighlightSelector }

// =============================================================================
// Renderable Effect
// =============================================================================

export type RenderableEffect<
  A extends RenderableResult,
  E extends RenderableResult,
  R = never,
> = Effect.Effect<A, E, R>

// =============================================================================
// Example Definition
// =============================================================================

export type ExampleType = "default" | "schedule"

export type ExampleEnvironment = ControlSnapshot | Notifications

export interface ExampleDefinition {
  readonly type: ExampleType
  readonly key: string
  readonly title: string
  readonly subtitle: string | undefined
  readonly description: string | undefined
  readonly steps: ReadonlyArray<StepDefinition>
  readonly controls: ReadonlyArray<AnyExampleControl>
  readonly program: RenderableEffect<RenderableResult, RenderableResult, ExampleEnvironment>
  readonly code: CodeSnippetDefinition
}

export interface ExampleDefinitionOptions<Type extends ExampleType> {
  readonly type?: Type | undefined
  readonly label: string
  readonly subtitle?: string | undefined
  readonly description?: string | undefined
  readonly code: CodeSnippetConfig
  readonly resultHighlight?: HighlightSelector | ReadonlyArray<HighlightSelector>
  readonly build: (
    ctx: BuildContext<Type>,
  ) => RenderableEffect<RenderableResult, RenderableResult, ExampleEnvironment>
}

// =============================================================================
// Step Definition
// =============================================================================

export interface StepDefinition {
  readonly id: string
  readonly label: string
  readonly addToTimeline?: boolean
}

export class ExampleStep extends ServiceMap.Service<
  ExampleStep,
  {
    readonly definition: ExampleDefinition
    readonly step: StepDefinition
  }
>()("ExampleStep") {}

// =============================================================================
// Controls
// =============================================================================

export interface AnyExampleControl {
  readonly id: string
  readonly label: string
  readonly description: string | undefined
  readonly initialValue: unknown
  readonly atom: Atom.Atom<unknown>
  readonly get: (registry: AtomRegistry.AtomRegistry) => unknown
  readonly matches: <A>(atom: Atom.Atom<A>) => boolean
  readonly render: () => React.ReactNode
}

export interface ExampleControl<A> extends AnyExampleControl {
  readonly initialValue: A
  readonly atom: Atom.Writable<A>
  readonly get: (registry: AtomRegistry.AtomRegistry) => A
}

export interface RegisterControlOptions<A> {
  readonly id: string
  readonly label: string
  readonly description?: string | undefined
  readonly initialValue: A
  readonly render: React.ComponentType<ControlRenderProps<A>>
}

export interface ControlRenderProps<A> {
  readonly atom: Atom.Writable<A>
}

export interface ControlValues {
  readonly get: <A>(control: ExampleControl<A>) => A
}

export class ControlSnapshot extends ServiceMap.Service<
  ControlSnapshot,
  { readonly get: <A>(atom: Atom.Atom<A>) => A }
>()("ControlSnapshot") {}

// =============================================================================
// Code Snippets
// =============================================================================

export interface CodeSnippetDefinition {
  readonly atom: Atom.Atom<CodeSnippet>
}

export type CodeDefinitionOptions =
  | CodeSnippetConfig
  | ((controls: ControlValues) => CodeSnippetConfig)

export type CodeSnippetSelectorOptions =
  | CodeSnippetSelectorConfig
  | ((controls: ControlValues) => CodeSnippetSelectorConfig)

export type CodeSnippetSelectorConfig = HighlightSelector | ReadonlyArray<HighlightSelector>

// =============================================================================
// Notifications
// =============================================================================

export interface NotificationOptions {
  readonly duration?: Duration.Input | undefined
  readonly showOnHover?: boolean | undefined
}

export class Notifications extends ServiceMap.Service<
  Notifications,
  {
    readonly notify: (
      message: string,
      options?: NotificationOptions | undefined,
    ) => Effect.Effect<void>
  }
>()("Notifications") {}

// =============================================================================
// Build Context
// =============================================================================

export interface BuildContext<Type extends ExampleType> {
  readonly addStep: {
    <A extends RenderableResult, E extends RenderableResult, R>(
      self: RenderableEffect<A, E, R>,
      options: AddStepOptions<Type>,
    ): RenderableEffect<A, E, R>
    (
      options: AddStepOptions<Type>,
    ): <A extends RenderableResult, E extends RenderableResult, R>(
      self: RenderableEffect<A, E, R>,
    ) => RenderableEffect<A, E, R>
  }
  readonly controls: {
    readonly register: <A>(input: RegisterControlOptions<A>) => ExampleControl<A>
    readonly read: <A>(control: ExampleControl<A>) => Effect.Effect<A, never, ExampleEnvironment>
  }
  readonly snippet: {
    readonly setCode: (input: CodeDefinitionOptions) => void
    readonly setResultHighlight: (input: CodeSnippetSelectorOptions) => void
  }
}

export type AddStepOptions<Type extends ExampleType> = {
  readonly label: string
  readonly highlight?: CodeSnippetSelectorOptions | undefined
} & (Type extends "schedule"
  ? {
      readonly addToTimeline?: boolean | undefined
    }
  : never)

// =============================================================================
// Example Definition Constructor
// =============================================================================

export const defineExample = <Type extends ExampleType>(
  options: ExampleDefinitionOptions<Type>,
): ExampleDefinition => {
  const steps: Array<StepDefinition> = []
  const controls: Array<AnyExampleControl> = []
  const selectorsByTarget: Record<string, CodeSnippetSelectorOptions> = {}
  let codeDefinitionOptions: CodeDefinitionOptions = options.code
  let resultHighlightDefinition: CodeSnippetSelectorOptions | undefined = options.resultHighlight

  const registerStep = (options: AddStepOptions<Type>): StepDefinition => {
    const step: Types.Mutable<StepDefinition> = {
      id: crypto.randomUUID(),
      label: options.label,
    }

    if (options.addToTimeline) {
      step.addToTimeline = true
    }

    Equal.byReferenceUnsafe(step)

    steps.push(step)

    if (options.highlight !== undefined) {
      const targetKey = toStepSnippetTargetKey(step.id)
      selectorsByTarget[targetKey] = options.highlight
    }

    return step
  }

  const addStep: BuildContext<Type>["addStep"] = dual(
    2,
    <A extends RenderableResult, E extends RenderableResult, R>(
      self: RenderableEffect<A, E, R>,
      options: AddStepOptions<Type>,
    ): RenderableEffect<A, E, R> => {
      const step = registerStep(options)
      // Suspend to ensure that the renderable effect is not evaluated eagerly
      // to prevent accessing the example definition before it is initialized
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

  const registerControl = <A>(control: RegisterControlOptions<A>): ExampleControl<A> => {
    const atom = Atom.make(control.initialValue).pipe(
      Atom.withLabel(`${options.label}:control:${control.id}`),
    )

    const registeredControl: ExampleControl<A> = {
      id: control.id,
      label: control.label,
      description: control.description,
      initialValue: control.initialValue,
      atom,
      get: (registry) => registry.get(atom),
      matches: (candidate) => Object.is(candidate, atom),
      render: () => React.createElement(control.render, { atom }),
    }

    controls.push(registeredControl)

    Equal.byReferenceUnsafe(registeredControl)

    return registeredControl
  }

  const readControl = <A>(
    control: ExampleControl<A>,
  ): Effect.Effect<A, never, ExampleEnvironment> => {
    return ControlSnapshot.useSync((snapshot) => snapshot.get(control.atom))
  }

  const program = options.build({
    addStep,
    controls: {
      register: registerControl,
      read: readControl,
    },
    snippet: {
      setCode: (next) => {
        codeDefinitionOptions = next
      },
      setResultHighlight: (next) => {
        resultHighlightDefinition = next
      },
    },
  })

  const codeAtom = Atom.make((get) => {
    const controlValues: ControlValues = {
      get: (control) => get(control.atom),
    }

    const resolvedSelectorsByTarget: Record<string, ReadonlyArray<HighlightSelector>> = {}

    for (const targetKey of Object.keys(selectorsByTarget)) {
      const selectorDefinition = selectorsByTarget[targetKey]

      if (selectorDefinition === undefined) {
        continue
      }

      resolvedSelectorsByTarget[targetKey] = normalizeSelectorInput(
        resolveSnippetSelectors(selectorDefinition, controlValues),
        {
          exampleLabel: options.label,
          targetKey,
        },
      )
    }

    if (resultHighlightDefinition !== undefined) {
      resolvedSelectorsByTarget[snippetResultTargetKey] = normalizeSelectorInput(
        resolveSnippetSelectors(resultHighlightDefinition, controlValues),
        {
          exampleLabel: options.label,
          targetKey: snippetResultTargetKey,
        },
      )
    }

    return resolveExampleCodeSnippet({
      code: resolveCodeDefinition(codeDefinitionOptions, controlValues),
      selectorsByTarget: resolvedSelectorsByTarget,
      exampleLabel: options.label,
    })
  })

  const definition: ExampleDefinition = {
    type: options.type ?? "default",
    key: crypto.randomUUID(),
    title: options.label,
    subtitle: options.subtitle,
    description: options.description,
    steps,
    controls,
    program,
    code: {
      atom: codeAtom,
    },
  }

  Equal.byReferenceUnsafe(definition)

  return definition
}

const resolveCodeDefinition = (
  definition: CodeDefinitionOptions,
  controls: ControlValues,
): CodeSnippetConfig => {
  if (typeof definition === "function") {
    return definition(controls)
  }

  return definition
}

const resolveSnippetSelectors = (
  definition: CodeSnippetSelectorOptions,
  controls: ControlValues,
): CodeSnippetSelectorConfig => {
  if (typeof definition === "function") {
    return definition(controls)
  }

  return definition
}
