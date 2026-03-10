import type * as AtomRegistry from "effect/unstable/reactivity/AtomRegistry"
import { useAtomSubscribe } from "@effect/atom-react"
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
  type CodeSnippetHighlightSelector,
} from "./snippet-highlights"

export type { CodeSnippetConfig, CodeSnippetHighlightSelector }

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
  readonly controls: ReadonlyArray<ControlDefinition>
  readonly program: RenderableEffect<RenderableResult, RenderableResult, ExampleEnvironment>
  readonly code: CodeSnippetDefinition
}

export interface ExampleDefinitionOptions<Type extends ExampleType> {
  readonly type?: Type | undefined
  readonly label: string
  readonly subtitle?: string | undefined
  readonly description?: string | undefined
  readonly code: CodeSnippetConfig
  readonly resultHighlight?:
    | CodeSnippetHighlightSelector
    | ReadonlyArray<CodeSnippetHighlightSelector>
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

export interface ControlDefinition {
  readonly id: string
  readonly label: string
  readonly description: string | undefined
  readonly initialValue: unknown
  readonly atom: Atom.Atom<unknown>
  readonly changePolicy: ControlChangePolicy
  readonly get: (registry: AtomRegistry.AtomRegistry) => unknown
  readonly matches: <A>(atom: Atom.Atom<A>) => boolean
  readonly render: (props: { readonly disabled: boolean }) => React.ReactNode
  readonly observe: (props: { readonly onValueChange: () => void }) => React.ReactNode
}

export type ControlChangePolicy = "never" | "ifRunning" | "always"

export interface RegisterControlOptions<A> {
  readonly id: string
  readonly label: string
  readonly description?: string | undefined
  readonly initialValue: A
  readonly render: React.ComponentType<ControlRenderProps<A>>
  readonly changePolicy?: ControlChangePolicy | undefined
}

export interface ControlRenderProps<A> {
  readonly atom: Atom.Writable<A>
  readonly disabled: boolean
}

export interface ControlHandle<A> {
  readonly id: string
  readonly label: string
  readonly description: string | undefined
  readonly atom: Atom.Writable<A>
  readonly currentValueRef: { current: A }
  readonly render: React.ComponentType<ControlRenderProps<A>>
  readonly changePolicy: ControlChangePolicy
}

export interface ControlValues {
  readonly get: <A>(control: ControlHandle<A>) => A
}

export class ControlSnapshot extends ServiceMap.Service<
  ControlSnapshot,
  { readonly get: <A>(atom: Atom.Atom<A>) => A }
>()("ControlSnapshot") {}

// =============================================================================
// Code Snippets
// =============================================================================

export interface CodeSnippetDefinition {
  readonly resolve: (controls: ControlValues) => CodeSnippet
}

export type CodeDefinitionOptions =
  | CodeSnippetConfig
  | ((controls: ControlValues) => CodeSnippetConfig)

export type CodeSnippetSelectorOptions =
  | CodeSnippetSelectorConfig
  | ((controls: ControlValues) => CodeSnippetSelectorConfig)

export type CodeSnippetSelectorConfig =
  | CodeSnippetHighlightSelector
  | ReadonlyArray<CodeSnippetHighlightSelector>

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
    <A extends RenderableResult, E extends RenderableResult>(
      self: RenderableEffect<A, E, ExampleEnvironment>,
      options: AddStepOptions<Type>,
    ): RenderableEffect<A, E, ExampleEnvironment>
    (
      options: AddStepOptions<Type>,
    ): <A extends RenderableResult, E extends RenderableResult>(
      self: RenderableEffect<A, E, ExampleEnvironment>,
    ) => RenderableEffect<A, E, ExampleEnvironment>
  }
  readonly controls: {
    readonly register: <A>(input: RegisterControlOptions<A>) => ControlHandle<A>
    readonly read: <A>(control: ControlHandle<A>) => Effect.Effect<A, never, ExampleEnvironment>
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
  const controls: Array<ControlDefinition> = []
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
    <A extends RenderableResult, E extends RenderableResult>(
      self: RenderableEffect<A, E, ExampleEnvironment>,
      options: AddStepOptions<Type>,
    ): RenderableEffect<A, E, ExampleEnvironment> => {
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

  const registerControl = <A>(control: RegisterControlOptions<A>): ControlHandle<A> => {
    const atom = Atom.make(control.initialValue).pipe(
      Atom.withLabel(`${options.label}:control:${control.id}`),
    )
    const readableAtom: Atom.Atom<A> = atom
    const currentValueRef = { current: control.initialValue }

    const handle: ControlHandle<A> = {
      id: control.id,
      label: control.label,
      description: control.description,
      atom,
      currentValueRef,
      render: control.render,
      changePolicy: control.changePolicy ?? "ifRunning",
    }

    const ControlObserver = ({ onValueChange }: { readonly onValueChange: () => void }) => {
      useAtomSubscribe(handle.atom, onValueChange, { immediate: true })
      return null
    }

    controls.push({
      id: handle.id,
      label: handle.label,
      description: handle.description,
      initialValue: control.initialValue,
      atom: readableAtom,
      changePolicy: handle.changePolicy,
      get: (registry) => registry.get(handle.atom),
      matches: (atom) => Object.is(atom, readableAtom),
      render: ({ disabled }) => React.createElement(handle.render, { atom: handle.atom, disabled }),
      observe: ({ onValueChange }) => React.createElement(ControlObserver, { onValueChange }),
    })

    Equal.byReferenceUnsafe(handle)

    return handle
  }

  const readControl = <A>(
    control: ControlHandle<A>,
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
      resolve: (controlValues) => {
        const resolvedSelectorsByTarget: Record<
          string,
          ReadonlyArray<CodeSnippetHighlightSelector>
        > = {}

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
      },
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
