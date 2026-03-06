import { useAtomValue } from "@effect/atom-react"
import type * as AtomRegistry from "effect/unstable/reactivity/AtomRegistry"
import * as Effect from "effect/Effect"
import * as Equal from "effect/Equal"
import { dual } from "effect/Function"
import * as ServiceMap from "effect/ServiceMap"
import * as Atom from "effect/unstable/reactivity/Atom"
import * as React from "react"
import type { RenderableResult } from "./domain"
import {
  normalizeSelectorInput,
  resolveExampleCodeSnippet,
  snippetResultTargetKey,
  toStepSnippetTargetKey,
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
  readonly highlight?: SnippetSelectorDefinition
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
  readonly snippet: {
    readonly setCode: (input: ExampleCodeDefinitionInput) => void
    readonly setResultHighlight: (input: SnippetSelectorDefinition) => void
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
  readonly currentValueRef: {
    current: A
  }
  readonly render: React.ComponentType<ExampleControlRenderProps<A>>
  readonly changePolicy: ControlChangePolicy
}

export interface ExampleControlValues {
  readonly get: <A>(control: ExampleControlHandle<A>) => A
}

export interface ExampleControlDefinition {
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
  readonly code: ExampleCodeDefinition
}

export interface ExampleCodeDefinition {
  readonly resolve: (controls: ExampleControlValues) => ExampleCodeSnippet
}

export type ExampleCodeDefinitionInput =
  | ExampleCodeSnippetInput
  | ((controls: ExampleControlValues) => ExampleCodeSnippetInput)

export type SnippetSelectorInput =
  | SnippetHighlightSelector
  | ReadonlyArray<SnippetHighlightSelector>

export type SnippetSelectorDefinition =
  | SnippetSelectorInput
  | ((controls: ExampleControlValues) => SnippetSelectorInput)

export class ExampleControlSnapshot extends ServiceMap.Service<
  ExampleControlSnapshot,
  { readonly get: <A>(atom: Atom.Atom<A>) => A }
>()("ExampleControlSnapshot") {}

export const defineExample = (input: DefineExampleInput): ExampleDefinition => {
  const steps: Array<StepDefinition> = []
  const controls: Array<ExampleControlDefinition> = []
  const selectorsByTarget: Record<string, SnippetSelectorDefinition> = {}
  let codeDefinition: ExampleCodeDefinitionInput = input.code
  let resultHighlightDefinition: SnippetSelectorDefinition | undefined = input.resultHighlight

  const registerStep = (options: AddStepOptions): StepDefinition => {
    const step: StepDefinition = {
      id: `step-${steps.length.toString()}`,
      label: options.label,
    }
    steps.push(step)
    Equal.byReferenceUnsafe(step)

    if (options.highlight !== undefined) {
      const targetKey = toStepSnippetTargetKey(step.id)
      selectorsByTarget[targetKey] = options.highlight
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
    const currentValueRef = { current: control.initialValue }

    const handle: ExampleControlHandle<A> = {
      id: control.id,
      label: control.label,
      description: control.description,
      atom,
      currentValueRef,
      render: control.render,
      changePolicy: control.changePolicy ?? "ifRunning",
    }

    const ControlObserver = ({ onValueChange }: { readonly onValueChange: () => void }) => {
      const value = useAtomValue(handle.atom)

      React.useEffect(() => {
        currentValueRef.current = value
        onValueChange()
      }, [onValueChange, value])

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
    control: ExampleControlHandle<A>,
  ): Effect.Effect<A, never, ExampleControlSnapshot> => {
    return ExampleControlSnapshot.useSync((snapshot) => snapshot.get(control.atom))
  }

  const program = input.build({
    addStep,
    controls: {
      register: registerControl,
      read: readControl,
    },
    snippet: {
      setCode: (next) => {
        codeDefinition = next
      },
      setResultHighlight: (next) => {
        resultHighlightDefinition = next
      },
    },
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
      resolve: (controlValues) => {
        const resolvedSelectorsByTarget: Record<
          string,
          ReadonlyArray<SnippetHighlightSelector>
        > = {}

        for (const targetKey of Object.keys(selectorsByTarget)) {
          const selectorDefinition = selectorsByTarget[targetKey]

          if (selectorDefinition === undefined) {
            continue
          }

          resolvedSelectorsByTarget[targetKey] = normalizeSelectorInput(
            resolveSnippetSelectors(selectorDefinition, controlValues),
            {
              exampleLabel: input.label,
              targetKey,
            },
          )
        }

        if (resultHighlightDefinition !== undefined) {
          resolvedSelectorsByTarget[snippetResultTargetKey] = normalizeSelectorInput(
            resolveSnippetSelectors(resultHighlightDefinition, controlValues),
            {
              exampleLabel: input.label,
              targetKey: snippetResultTargetKey,
            },
          )
        }

        return resolveExampleCodeSnippet({
          code: resolveCodeDefinition(codeDefinition, controlValues),
          selectorsByTarget: resolvedSelectorsByTarget,
          exampleLabel: input.label,
        })
      },
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

const resolveCodeDefinition = (
  definition: ExampleCodeDefinitionInput,
  controls: ExampleControlValues,
): ExampleCodeSnippetInput => {
  if (typeof definition === "function") {
    return definition(controls)
  }

  return definition
}

const resolveSnippetSelectors = (
  definition: SnippetSelectorDefinition,
  controls: ExampleControlValues,
): SnippetSelectorInput => {
  if (typeof definition === "function") {
    return definition(controls)
  }

  return definition
}
