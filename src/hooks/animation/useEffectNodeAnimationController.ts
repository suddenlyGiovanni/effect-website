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

const RUNNING_ANGLE_RANGE = 4
const RUNNING_ANGLE_BASE = 0.5
const RUNNING_OFFSET_X_RANGE = 1.5
const RUNNING_OFFSET_X_BASE = 0.5
const RUNNING_OFFSET_Y_RANGE = 0.6
const RUNNING_OFFSET_Y_BASE = 0.1
const RUNNING_DURATION_MIN_SEC = 0.1
const RUNNING_DURATION_MAX_SEC = 0.2

const FAILURE_ROTATION = [0, 5, -5, 4, -4, 0]
const FAILURE_X = [0, 4, -4, 3, -3, 0]
const FAILURE_Y = [0, -2, 2, -1, 1, 0]

const BASE_NODE_SIZE = 56
const RUNNING_NODE_HEIGHT = BASE_NODE_SIZE * 0.4
const BASE_BORDER_RADIUS = 8

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

    let runningJitterCancelled = false
    let runningJitterFrame: number | null = null
    let runningJitterControls: Array<AnimationPlaybackControls> = []

    const stopRunningJitter = () => {
      runningJitterCancelled = true
      if (runningJitterFrame !== null) {
        cancelAnimationFrame(runningJitterFrame)
        runningJitterFrame = null
      }

      for (const control of runningJitterControls) {
        control.stop()
      }
      runningJitterControls = []
    }

    stopAll()

    const isRunning = tag === "Running"
    const hasResult = tag === "Succeeded"

    motion.borderRadius.set(isRunning ? 15 : BASE_BORDER_RADIUS)

    registerControl(
      animate(motion.nodeHeight, isRunning ? RUNNING_NODE_HEIGHT : BASE_NODE_SIZE, {
        duration: 0.4,
        bounce: isRunning ? 0.3 : 0.5,
        type: "spring",
      }),
    )

    if (!hasResult) {
      motion.nodeWidth.set(BASE_NODE_SIZE)
    }

    motion.contentOpacity.set(isRunning ? 0 : 1)

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
        stopRunningJitter()
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
        animate(motion.glowIntensity, [1, 5, 1], {
          duration: TIMINGS.runningGlowPulseDurationSec,
          ease: "easeInOut",
          repeat: Infinity,
        }),
      )

      const runRunningJitter = () => {
        if (runningJitterCancelled || !isActive()) return

        const angle =
          (Math.random() * RUNNING_ANGLE_RANGE + RUNNING_ANGLE_BASE) *
          (Math.random() < 0.5 ? 1 : -1)

        const offsetX =
          (Math.random() * RUNNING_OFFSET_X_RANGE + RUNNING_OFFSET_X_BASE) *
          (Math.random() < 0.5 ? -1 : 1)

        const offsetY =
          (Math.random() * RUNNING_OFFSET_Y_RANGE + RUNNING_OFFSET_Y_BASE) *
          (Math.random() < 0.5 ? -1 : 1)

        const duration =
          RUNNING_DURATION_MIN_SEC +
          Math.random() * (RUNNING_DURATION_MAX_SEC - RUNNING_DURATION_MIN_SEC)

        const rotationControl = animate(motion.rotation, angle, {
          duration,
          ease: "circInOut",
        })

        const shakeXControl = animate(motion.shakeX, offsetX, {
          duration,
          ease: "easeInOut",
        })

        const shakeYControl = animate(motion.shakeY, offsetY, {
          duration,
          ease: "easeInOut",
        })

        runningJitterControls = [rotationControl, shakeXControl, shakeYControl]

        void Promise.all([
          rotationControl.finished.catch(() => undefined),
          shakeXControl.finished.catch(() => undefined),
          shakeYControl.finished.catch(() => undefined),
        ]).then(() => {
          if (runningJitterCancelled || !isActive()) return
          runningJitterFrame = requestAnimationFrame(runRunningJitter)
        })
      }

      runningJitterFrame = requestAnimationFrame(runRunningJitter)
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
      stopRunningJitter()
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
