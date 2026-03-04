import { useAtomSet, useAtomValue } from "@effect/atom-react"
import * as Atom from "effect/unstable/reactivity/Atom"
import * as React from "react"
import type { ExampleDefinition, StepDefinition } from "@/lib/examples/constructors"
import {
  exampleStateAtom,
  stepStateAtom,
  VisualEffectManager,
} from "@/services/VisualEffectManager"

export const ExampleContext = React.createContext<ExampleDefinition>(null as any)

export const useExampleDefinition = () => React.useContext(ExampleContext)

const runtime = Atom.runtime(VisualEffectManager.layer)

const startAtom = runtime.fn<ExampleDefinition>()(
  (example) => VisualEffectManager.use((_) => _.start(example)),
  { concurrent: true },
)
const stopAtom = runtime.fn<ExampleDefinition>()(
  (example) => VisualEffectManager.use((_) => _.stop(example)),
  { concurrent: true },
)
const resetAtom = runtime.fn<ExampleDefinition>()(
  (example) => VisualEffectManager.use((_) => _.reset(example)),
  { concurrent: true },
)

export const useExampleControls = () => {
  const example = useExampleDefinition()

  const start = useAtomSet(startAtom)
  const stop = useAtomSet(stopAtom)
  const reset = useAtomSet(resetAtom)

  return {
    start() {
      start(example)
    },
    stop() {
      stop(example)
    },
    reset() {
      reset(example)
    },
  } as const
}

export const useExampleState = () => {
  const example = useExampleDefinition()
  return useAtomValue(exampleStateAtom(example))
}

export const StepContext = React.createContext<StepDefinition>(null as any)

export const useStepDefinition = () => React.useContext(StepContext)

export const useStepState = () => {
  const step = useStepDefinition()
  return useAtomValue(stepStateAtom(step))
}
