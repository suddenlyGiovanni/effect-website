import * as React from "react"
import * as Atom from "effect/unstable/reactivity/Atom"
import type * as AtomRegistry from "effect/unstable/reactivity/AtomRegistry"
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
  R = never,
> = Effect.Effect<A, E, R>

export interface AddStepOptions {
  readonly label: string
  readonly highlight?: SnippetHighlightSelector | ReadonlyArray<SnippetHighlightSelector>
}

export interface BuildContext {
  readonly addStep: {
    <A extends RenderableResult, E extends RenderableResult>(
      self: RenderableEffect<A, E, ExampleControlSnapshot>,
      options: AddStepOptions,
    ): RenderableEffect<A, E, ExampleControlSnapshot>
    (
      options: AddStepOptions,
    ): <A extends RenderableResult, E extends RenderableResult>(
      self: RenderableEffect<A, E, ExampleControlSnapshot>,
    ) => RenderableEffect<A, E, ExampleControlSnapshot>
  }
  readonly controls: {
    readonly register: <A>(input: RegisterControlInput<A>) => ExampleControlHandle<A>
    readonly read: <A>(
      control: ExampleControlHandle<A>,
    ) => Effect.Effect<A, never, ExampleControlSnapshot>
  }
}

export interface StepDefinition {
  readonly id: string
  readonly label: string
}

export type { ExampleCodeSnippetInput, SnippetHighlightSelector }

export type ControlChangePolicy = "never" | "ifRunning" | "always"

export interface ExampleControlRenderProps<A> {
  readonly atom: Atom.Writable<A>
  readonly disabled: boolean
}

export interface RegisterControlInput<A> {
  readonly id: string
  readonly label: string
  readonly description?: string | undefined
  readonly initialValue: A
  readonly render: React.ComponentType<ExampleControlRenderProps<A>>
  readonly changePolicy?: ControlChangePolicy | undefined
}

export interface ExampleControlHandle<A> {
  readonly id: string
  readonly label: string
  readonly description: string | undefined
  readonly atom: Atom.Writable<A>
  readonly render: React.ComponentType<ExampleControlRenderProps<A>>
  readonly changePolicy: ControlChangePolicy
}

export interface ExampleControlDefinition {
  readonly id: string
  readonly label: string
  readonly description: string | undefined
  readonly atom: Atom.Atom<unknown>
  readonly changePolicy: ControlChangePolicy
  readonly get: (registry: AtomRegistry.AtomRegistry) => unknown
  readonly matches: <A>(atom: Atom.Atom<A>) => boolean
  readonly render: (props: { readonly disabled: boolean }) => React.ReactNode
}

export interface DefineExampleInput {
  readonly label: string
  readonly subtitle?: string | undefined
  readonly description?: string | undefined
  readonly code: ExampleCodeSnippetInput
  readonly resultHighlight?: SnippetHighlightSelector | ReadonlyArray<SnippetHighlightSelector>
  readonly build: (
    ctx: BuildContext,
  ) => RenderableEffect<RenderableResult, RenderableResult, ExampleControlSnapshot>
}

export interface ExampleDefinition {
  readonly key: string
  readonly title: string
  readonly subtitle: string | undefined
  readonly description: string | undefined
  readonly steps: ReadonlyArray<StepDefinition>
  readonly controls: ReadonlyArray<ExampleControlDefinition>
  readonly program: RenderableEffect<RenderableResult, RenderableResult, ExampleControlSnapshot>
  readonly code: ExampleCodeSnippet
}

export class ExampleControlSnapshot extends ServiceMap.Service<
  ExampleControlSnapshot,
  { readonly get: <A>(atom: Atom.Atom<A>) => A }
>()("ExampleControlSnapshot") {}

export const defineExample = (input: DefineExampleInput): ExampleDefinition => {
  const steps: Array<StepDefinition> = []
  const controls: Array<ExampleControlDefinition> = []
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
      self: RenderableEffect<A, E, ExampleControlSnapshot>,
      options: AddStepOptions,
    ): RenderableEffect<A, E, ExampleControlSnapshot> => {
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

  const registerControl = <A>(control: RegisterControlInput<A>): ExampleControlHandle<A> => {
    const atom = Atom.make(control.initialValue).pipe(
      Atom.withLabel(`${input.label}:control:${control.id}`),
    )
    const readableAtom: Atom.Atom<A> = atom

    const handle: ExampleControlHandle<A> = {
      id: control.id,
      label: control.label,
      description: control.description,
      atom,
      render: control.render,
      changePolicy: control.changePolicy ?? "ifRunning",
    }

    controls.push({
      id: handle.id,
      label: handle.label,
      description: handle.description,
      atom: readableAtom,
      changePolicy: handle.changePolicy,
      get: (registry) => registry.get(handle.atom),
      matches: (atom) => Object.is(atom, readableAtom),
      render: ({ disabled }) => React.createElement(handle.render, { atom: handle.atom, disabled }),
    })
    Equal.byReferenceUnsafe(handle)
    return handle
  }

  const readControl = <A>(
    control: ExampleControlHandle<A>,
  ): Effect.Effect<A, never, ExampleControlSnapshot> => {
    return ExampleControlSnapshot.useSync((snapshot) => snapshot.get(control.atom))
  }

  if (input.resultHighlight !== undefined) {
    selectorsByTarget[snippetResultTargetKey] = normalizeSelectorInput(input.resultHighlight, {
      exampleLabel: input.label,
      targetKey: snippetResultTargetKey,
    })
  }

  const program = input.build({
    addStep,
    controls: {
      register: registerControl,
      read: readControl,
    },
  })

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
    controls,
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
