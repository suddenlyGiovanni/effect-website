import { useAtomSet, useAtomValue } from "@effect/atom-react"
import * as Equal from "effect/Equal"
import * as Atom from "effect/unstable/reactivity/Atom"
import * as React from "react"
import type { ExampleDefinition, StepDefinition } from "@/lib/examples/constructors"
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

export const useExampleDefinition = () => React.useContext(ExampleContext)

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
  const current = useAtomValue(atom)
  const set = useAtomSet(atom)
  const unlockSounds = useAtomSet(unlockSoundAtom)
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

      unlockSounds()

      set(next)

      applyControlWriteSideEffects({
        example,
        controlId: control.id,
      })
    },
    [applyControlWriteSideEffects, control, current, example, set, unlockSounds],
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
