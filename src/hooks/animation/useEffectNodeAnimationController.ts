import {
  animate,
  type AnimationPlaybackControls,
  type AnimationScope,
  useReducedMotion,
} from "motion/react"
import { useCallback, useEffect, useRef } from "react"
import { SPRINGS, TIMINGS } from "@/lib/animation"
import type { VisualEffectState } from "@/lib/examples/domain"
import type { EffectMotionValues } from "./useEffectMotionValues"
import type { TransitionFlags } from "./useNodeTransitionFlags"

interface NodeAnimationControllerInput {
  readonly scope: AnimationScope
  readonly motion: EffectMotionValues
  readonly tag: VisualEffectState["_tag"]
  readonly transition: TransitionFlags
}

const RUNNING_ROTATION = [0, 0.8, -0.7, 0.4, 0]
const RUNNING_X = [0, 0.7, -0.6, 0.4, 0]
const RUNNING_Y = [0, -0.2, 0.15, -0.1, 0]

const FAILURE_ROTATION = [0, 5, -5, 4, -4, 0]
const FAILURE_X = [0, 4, -4, 3, -3, 0]
const FAILURE_Y = [0, -2, 2, -1, 1, 0]

export const useEffectNodeAnimationController = ({
  motion,
  tag,
  transition,
}: NodeAnimationControllerInput): void => {
  const prefersReducedMotion = useReducedMotion() === true

  const controlsRef = useRef<Array<AnimationPlaybackControls>>([])
  const runIdRef = useRef(0)

  const stopAll = useCallback(() => {
    for (const control of controlsRef.current) {
      control.stop()
    }
    controlsRef.current = []
  }, [])

  useEffect(() => {
    runIdRef.current += 1
    const runId = runIdRef.current

    const isActive = (): boolean => runIdRef.current === runId

    const registerControl = (control: AnimationPlaybackControls) => {
      controlsRef.current.push(control)
      return control
    }

    stopAll()

    if (prefersReducedMotion) {
      motion.flashOpacity.set(0)
      motion.contentScale.set(1)
      motion.borderOpacity.set(1)
      motion.glowIntensity.set(0)
      motion.rotation.set(0)
      motion.shakeX.set(0)
      motion.shakeY.set(0)

      return () => {
        runIdRef.current += 1
        stopAll()
      }
    }

    if (tag !== "Running") {
      registerControl(
        animate(motion.borderOpacity, 1, {
          duration: TIMINGS.resetDurationSec,
          ease: "easeOut",
        }),
      )
      registerControl(
        animate(motion.glowIntensity, 0, {
          duration: TIMINGS.resetDurationSec,
          ease: "easeOut",
        }),
      )
    }

    if (tag === "Running") {
      registerControl(
        animate(motion.borderOpacity, [1, 0.3, 1], {
          duration: TIMINGS.runningBorderPulseDurationSec,
          ease: "easeInOut",
          repeat: Infinity,
        }),
      )
      registerControl(
        animate(motion.glowIntensity, [0, 3, 0], {
          duration: TIMINGS.runningGlowPulseDurationSec,
          ease: "easeInOut",
          repeat: Infinity,
        }),
      )
      registerControl(
        animate(motion.rotation, RUNNING_ROTATION, {
          duration: TIMINGS.runningJitterDurationSec,
          ease: "easeInOut",
          repeat: Infinity,
        }),
      )
      registerControl(
        animate(motion.shakeX, RUNNING_X, {
          duration: TIMINGS.runningJitterDurationSec,
          ease: "easeInOut",
          repeat: Infinity,
        }),
      )
      registerControl(
        animate(motion.shakeY, RUNNING_Y, {
          duration: TIMINGS.runningJitterDurationSec,
          ease: "easeInOut",
          repeat: Infinity,
        }),
      )
    }

    if (transition.justCompleted) {
      motion.contentScale.set(0)
      registerControl(animate(motion.contentScale, [1.3, 1], SPRINGS.contentScale))

      const flashIn = registerControl(
        animate(motion.flashOpacity, 0.6, {
          duration: TIMINGS.flashInDurationSec,
          ease: "circOut",
        }),
      )

      void flashIn.finished
        .then(() => {
          if (!isActive()) return
          registerControl(
            animate(motion.flashOpacity, 0, {
              duration: TIMINGS.flashOutDurationSec,
              ease: "linear",
            }),
          )
        })
        .catch(() => {})
    }

    if (transition.justFailed || transition.justDied) {
      registerControl(
        animate(motion.rotation, FAILURE_ROTATION, {
          duration: TIMINGS.failureShakeDurationSec,
          ease: "easeInOut",
        }),
      )
      registerControl(
        animate(motion.shakeX, FAILURE_X, {
          duration: TIMINGS.failureShakeDurationSec,
          ease: "easeInOut",
        }),
      )
      registerControl(
        animate(motion.shakeY, FAILURE_Y, {
          duration: TIMINGS.failureShakeDurationSec,
          ease: "easeInOut",
        }),
      )
    }

    if (tag === "Interrupted") {
      registerControl(
        animate(motion.rotation, 0, {
          duration: TIMINGS.resetDurationSec,
          ease: "easeOut",
        }),
      )
      registerControl(
        animate(motion.shakeX, 0, {
          duration: TIMINGS.resetDurationSec,
          ease: "easeOut",
        }),
      )
      registerControl(
        animate(motion.shakeY, 0, {
          duration: TIMINGS.resetDurationSec,
          ease: "easeOut",
        }),
      )
    }

    return () => {
      runIdRef.current += 1
      stopAll()
      motion.rotation.set(0)
      motion.shakeX.set(0)
      motion.shakeY.set(0)
    }
  }, [
    motion,
    prefersReducedMotion,
    stopAll,
    tag,
    transition.justCompleted,
    transition.justDied,
    transition.justFailed,
  ])
}
