import * as React from "react"
import { useAtomSet, useAtomSuspense, useAtomValue } from "@effect/atom-react"
import type * as Atom from "effect/unstable/reactivity/Atom"
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult"
import { InitialState, visualEffectAtom } from "@/atoms/visual-effect"
import type { StepLabel } from "@/lib/examples/domain"

const VisualEffectContext = React.createContext<Atom.Success<typeof visualEffectAtom>>(null as any)

export const useVisualEffect = () => React.useContext(VisualEffectContext)

export const useExampleControls = () => {
  const visualEffect = useVisualEffect()

  const startExample = useAtomSet(visualEffect.startExampleAtom)
  const stopExample = useAtomSet(visualEffect.stopExampleAtom)
  const resetExample = useAtomSet(visualEffect.resetExampleAtom)

  return {
    startExample,
    stopExample,
    resetExample,
  } as const
}

export const useProgramState = () => {
  const visualEffect = useVisualEffect()

  const programState = useAtomValue(visualEffect.programStateAtom).pipe(
    AsyncResult.getOrElse(() => InitialState),
  )

  return programState
}

export const useStepState = (label: StepLabel) => {
  const visualEffect = useVisualEffect()

  const stepState = useAtomValue(visualEffect.stepStateAtom(label)).pipe(
    AsyncResult.getOrElse(() => InitialState),
  )

  return stepState
}

export function VisualEffectProvider({ children }: React.PropsWithChildren) {
  const visualEffect = useAtomSuspense(visualEffectAtom).value
  return (
    <VisualEffectContext.Provider value={visualEffect}>{children}</VisualEffectContext.Provider>
  )
}
