import * as Schema from "effect/Schema"
import type { VisualEffectState } from "@/lib/examples/domain"

export const SoundPreference = Schema.Literals(["system", "on", "off"])
export type SoundPreference = typeof SoundPreference.Type

export interface SoundSettings {
  readonly preference: SoundPreference
  readonly unlocked: boolean
  readonly enabled: boolean
}

export type VisualEffectSoundEvent =
  | {
      readonly _tag: "ExampleTransition"
      readonly exampleKey: string
      readonly previous: VisualEffectState["_tag"]
      readonly current: VisualEffectState["_tag"]
      readonly hasSteps: boolean
    }
  | {
      readonly _tag: "StepTransition"
      readonly exampleKey: string
      readonly stepId: string
      readonly stepLabel: string
      readonly previous: VisualEffectState["_tag"]
      readonly current: VisualEffectState["_tag"]
    }
  | {
      readonly _tag: "ExampleReset"
      readonly exampleKey: string
    }
  | {
      readonly _tag: "ControlChanged"
      readonly exampleKey: string
      readonly controlId: string
    }
  | {
      readonly _tag: "NotificationRaised"
      readonly exampleKey: string
      readonly stepId: string
      readonly message: string
    }

export type SoundCue =
  | { readonly _tag: "StepRunning"; readonly exampleKey: string; readonly stepId: string }
  | { readonly _tag: "StepSucceeded"; readonly exampleKey: string; readonly stepId: string }
  | { readonly _tag: "StepFailed"; readonly exampleKey: string; readonly stepId: string }
  | { readonly _tag: "StepInterrupted"; readonly exampleKey: string; readonly stepId: string }
  | { readonly _tag: "StepDied"; readonly exampleKey: string; readonly stepId: string }
  | { readonly _tag: "ExampleReset"; readonly exampleKey: string }
  | { readonly _tag: "ControlChanged"; readonly exampleKey: string; readonly controlId: string }

export const visualEffectExampleCueStepId = "__example__"

export const toSoundCue = (event: VisualEffectSoundEvent): SoundCue | undefined => {
  switch (event._tag) {
    case "ExampleReset":
      return {
        _tag: "ExampleReset",
        exampleKey: event.exampleKey,
      }
    case "ControlChanged":
      return {
        _tag: "ControlChanged",
        exampleKey: event.exampleKey,
        controlId: event.controlId,
      }
    case "NotificationRaised":
      return undefined
    case "StepTransition":
      return transitionToCue({
        exampleKey: event.exampleKey,
        stepId: event.stepId,
        previous: event.previous,
        current: event.current,
      })
    case "ExampleTransition": {
      if (event.previous === "Idle" && event.current === "Running") {
        return {
          _tag: "StepRunning",
          exampleKey: event.exampleKey,
          stepId: visualEffectExampleCueStepId,
        }
      }

      if (event.hasSteps) {
        return undefined
      }

      return transitionToCue({
        exampleKey: event.exampleKey,
        stepId: visualEffectExampleCueStepId,
        previous: event.previous,
        current: event.current,
      })
    }
  }
}

export const soundCueKey = (cue: SoundCue): string => {
  switch (cue._tag) {
    case "ExampleReset":
      return `${cue._tag}:${cue.exampleKey}`
    case "ControlChanged":
      return `${cue._tag}:${cue.exampleKey}:${cue.controlId}`
    case "StepRunning":
    case "StepSucceeded":
    case "StepFailed":
    case "StepInterrupted":
    case "StepDied":
      return `${cue._tag}:${cue.exampleKey}:${cue.stepId}`
  }
}

const transitionToCue = ({
  exampleKey,
  stepId,
  previous,
  current,
}: {
  readonly exampleKey: string
  readonly stepId: string
  readonly previous: VisualEffectState["_tag"]
  readonly current: VisualEffectState["_tag"]
}): SoundCue | undefined => {
  if (previous === current) {
    return undefined
  }

  if (current === "Running") {
    return {
      _tag: "StepRunning",
      exampleKey,
      stepId,
    }
  }

  if (previous !== "Running") {
    return undefined
  }

  switch (current) {
    case "Succeeded":
      return {
        _tag: "StepSucceeded",
        exampleKey,
        stepId,
      }
    case "Failed":
      return {
        _tag: "StepFailed",
        exampleKey,
        stepId,
      }
    case "Interrupted":
      return {
        _tag: "StepInterrupted",
        exampleKey,
        stepId,
      }
    case "Died":
      return {
        _tag: "StepDied",
        exampleKey,
        stepId,
      }
    default:
      return undefined
  }
}
