import { useAtomSet, useAtomValue } from "@effect/atom-react"
import * as Equal from "effect/Equal"
import * as Atom from "effect/unstable/reactivity/Atom"
import * as React from "react"
import type {
  ExampleControlValues,
  ExampleDefinition,
  StepDefinition,
} from "@/lib/examples/constructors"
import type { SoundPreference } from "@/lib/examples/sound"
import {
  controlWriteSideEffectsAtom,
  resetExampleAtom,
  soundPreferenceAtom,
  soundSettingsAtom,
  startExampleAtom,
  stopExampleAtom,
  unlockSoundAtom,
} from "@/atoms/visual-effect"
import {
  exampleStateAtom,
  stepStateAtom,
  scheduleTimelineAtom,
  scheduleTimeAtom,
} from "@/services/VisualEffectManager"

// =============================================================================
// Example Definition Context
// =============================================================================

export const ExampleContext = React.createContext<ExampleDefinition>(null as any)
const ExampleControlValuesContext = React.createContext<ExampleControlValues>(null as any)
const ExampleControlVersionContext = React.createContext(0)

export const useExampleDefinition = () => React.useContext(ExampleContext)

export function ExampleControlRuntimeProvider({
  children,
}: {
  readonly children: React.ReactNode
}) {
  const example = useExampleDefinition()
  const [version, setVersion] = React.useState(0)

  const controlValues = React.useMemo<ExampleControlValues>(
    () => ({
      get: (control) => control.currentValueRef.current,
    }),
    [],
  )

  const onValueChange = React.useCallback(() => {
    setVersion((version) => version + 1)
  }, [])

  return (
    <ExampleControlValuesContext.Provider value={controlValues}>
      <ExampleControlVersionContext.Provider value={version}>
        {example.controls.map((control) => (
          <React.Fragment key={`${control.id}-observer`}>
            {control.observe({ onValueChange })}
          </React.Fragment>
        ))}
        {children}
      </ExampleControlVersionContext.Provider>
    </ExampleControlValuesContext.Provider>
  )
}

export const useExampleControlValues = () => React.useContext(ExampleControlValuesContext)

export const useExampleControlVersion = () => React.useContext(ExampleControlVersionContext)

export const useExampleControls = () => {
  const example = useExampleDefinition()

  const start = useAtomSet(startExampleAtom)
  const stop = useAtomSet(stopExampleAtom)
  const reset = useAtomSet(resetExampleAtom)

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

// =============================================================================
// Step Definition Context
// =============================================================================

export const StepContext = React.createContext<StepDefinition>(null as any)

export const useStepDefinition = () => React.useContext(StepContext)

export const useStepState = () => {
  const step = useStepDefinition()
  return useAtomValue(stepStateAtom(step))
}

// =============================================================================
// Schedule Timeline
// =============================================================================

export const useScheduleTime = () => {
  const example = useExampleDefinition()
  return useAtomValue(scheduleTimeAtom(example))
}
export const useScheduleTimeline = () => {
  const example = useExampleDefinition()
  return useAtomValue(scheduleTimelineAtom(example))
}

// =============================================================================
// Example Controls
// =============================================================================

export const useControlWrite = <A,>(atom: Atom.Writable<A>) => {
  const example = useExampleDefinition()
  const state = useExampleState()
  const current = useAtomValue(atom)
  const set = useAtomSet(atom)
  const applyControlWriteSideEffects = useAtomSet(controlWriteSideEffectsAtom)

  const control = React.useMemo(
    () => example.controls.find((control) => control.matches(atom)),
    [atom, example.controls],
  )

  return React.useCallback(
    (next: A) => {
      if (control === undefined) {
        throw new Error("Unknown example control atom")
      }

      if (Equal.equals(current, next)) {
        return
      }

      const isRunning = state._tag === "Running"
      const shouldReset =
        control.changePolicy === "always" || (control.changePolicy === "ifRunning" && isRunning)

      set(next)

      applyControlWriteSideEffects({
        example,
        controlId: control.id,
        shouldReset,
      })
    },
    [applyControlWriteSideEffects, control, current, example, set, state._tag],
  )
}

// =============================================================================
// Sound Settings / Controls
// =============================================================================

export const useSoundSettings = () => useAtomValue(soundSettingsAtom)

export const useSoundControls = () => {
  const unlockSounds = useAtomSet(unlockSoundAtom)
  const setSoundPreference = useAtomSet(soundPreferenceAtom)

  return {
    unlockSounds() {
      unlockSounds(void 0)
    },
    setSoundPreference(preference: SoundPreference) {
      setSoundPreference(preference)
    },
  } as const
}
