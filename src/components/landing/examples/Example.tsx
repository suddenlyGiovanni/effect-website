import * as React from "react"
import { Play, RotateCcw, Square } from "lucide-react"
import { AnimatePresence, motion, useAnimate, useTransform } from "motion/react"
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult"
import { useAtomSet, useAtomValue } from "@effect/atom-react"
import {
  currentExampleAtom,
  startExampleAtom,
  stopExampleAtom,
  programStateAtom,
  stepStateAtom,
  InitialState,
  VisualEffectState,
} from "@/atoms/visual-effect"
import { useEffectMotion, type EffectMotionValues } from "@/hooks/animation/useEffectMotion"
import type { StepDefinition } from "@/lib/examples/constructors"
import { cn } from "@/lib/utils"
import { COLORS, SHADOW_COLORS, SPRINGS, TIMINGS, VFX } from "@/lib/animation"

export function Example() {
  return (
    <div className="w-fit min-w-full flex flex-col border shadow-2xl">
      <ExampleHeader />
      <ExampleEffects />
    </div>
  )
}

function ExampleHeader() {
  const [isHovering, setIsHovering] = React.useState(false)
  const [isRunning, setIsRunning] = React.useState(false)
  const example = useAtomValue(currentExampleAtom)
  const startExample = useAtomSet(startExampleAtom)
  const stopExample = useAtomSet(stopExampleAtom)

  const handleMouseEnter = () => {
    setIsHovering(true)
  }

  const handleMouseLeave = () => {
    setIsHovering(false)
  }

  const handleClick = () => {
    if (isRunning) {
      stopExample()
    } else {
      startExample()
    }
    setIsRunning((running) => !running)
  }

  const title = example.label.title
  const subtitle = example.label.subtitle

  return (
    <div className="flex px-6 py-4 bg-zinc-800 border-b">
      <motion.button
        className="flex items-start gap-3 flex-1 -m-2 p-2 bg-zinc-950 rounded-lg whitespace-nowrap cursor-pointer"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        initial={{ backgroundColor: "rgb(255, 255, 255, 0)" }}
        whileHover={{
          backgroundColor: "rgb(255, 255, 255, 0.05)",
          transition: { backgroundColor: { duration: 0.15, ease: "easeInOut" } },
        }}
        aria-label="Play"
      >
        <ExampleStatusIcon isHovering={isHovering} />

        <span className="flex flex-1 justify-between gap-4 text-neutral-400">
          <span className="flex flex-col gap-1">
            <span className="flex items-baseline gap-2 text-base font-mono font-semibold leading-tighter">
              <span className="text-white">{title}</span>
              {subtitle && <span className="font-medium">{subtitle}</span>}
            </span>
            <span className="text-sm leading-4">{example.description}</span>
          </span>
          <span className="-mt-1 text-xs font-mono">Click to run an Effect</span>
        </span>
      </motion.button>
    </div>
  )
}

function ExampleStatusIcon({ isHovering }: { readonly isHovering: boolean }) {
  const state = useAtomValue(programStateAtom).pipe(AsyncResult.getOrElse(() => InitialState))

  const getBackgroundColor = VisualEffectState.$match({
    Idle: () => "bg-green-500",
    Running: () => "bg-blue-600",
    Succeeded: () => "bg-green-600",
    Failed: () => "bg-red-500",
    Died: () => "bg-red-500",
    Interrupted: () => "bg-orange-500",
  })

  const getIcon = (state: VisualEffectState): React.ReactNode => {
    switch (state._tag) {
      case "Running": {
        return <StopIcon />
      }
      case "Succeeded":
      case "Failed":
      case "Died":
      case "Interrupted": {
        return isHovering ? <ResetIcon /> : <PlayIcon />
      }
      default: {
        return <PlayIcon />
      }
    }
  }

  return (
    <AnimatePresence mode="popLayout">
      <span
        className={cn(
          "size-10 shrink-0 flex justify-center items-center border border-zinc-500 text-white rounded-md",
          getBackgroundColor(state),
        )}
      >
        {getIcon(state)}
      </span>
    </AnimatePresence>
  )
}

function PlayIcon() {
  return (
    <motion.span
      key="play"
      className="flex items-center -mr-px"
      initial={{ scale: 0.8, opacity: 0, filter: "blur(4px)" }}
      animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
      exit={{ scale: 0.8, opacity: 0, filter: "blur(4px)" }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <Play className="size-5 stroke-1" fill="currentColor" />
    </motion.span>
  )
}

function StopIcon() {
  return (
    <motion.span
      key="stop"
      className="flex items-center"
      initial={{ scale: 0, rotate: -180, filter: "blur(10px)" }}
      animate={{ scale: 1, rotate: 0, filter: "blur(0px)" }}
      exit={{ scale: 0, opacity: 180, filter: "blur(10px)" }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Square className="size-5" fill="currentColor" />
    </motion.span>
  )
}

function ResetIcon() {
  return (
    <motion.span
      key="reset"
      className="flex items-center"
      initial={{ scale: 0, rotate: -180, filter: "blur(10px)" }}
      animate={{ scale: 1, rotate: 0, filter: "blur(0px)" }}
      exit={{ scale: 0, opacity: 180, filter: "blur(10px)" }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <RotateCcw className="size-5 -mr-px stroke-3" />
    </motion.span>
  )
}

function ExampleEffects() {
  const example = useAtomValue(currentExampleAtom)
  return (
    <div className="p-6 border-b">
      <div className="flex justify-start items-center gap-6">
        <div className="flex flex-wrap justify-center gap-6">
          {example.steps.map((step) => (
            <EffectNode key={step.label} definition={step} />
          ))}
        </div>
      </div>
    </div>
  )
}

function EffectNode({ definition }: { readonly definition: StepDefinition }) {
  const [scope, animate] = useAnimate()
  const state = useAtomValue(stepStateAtom(definition.label)).pipe(
    AsyncResult.getOrElse(() => InitialState),
  )

  const motionValues = useEffectMotion()

  React.useEffect(() => {
    if (state._tag === "Running") {
      animate(motionValues.glowIntensity, [...TIMINGS.borderPulse.values], {
        duration: TIMINGS.borderPulse.duration,
        ease: "easeInOut",
        repeat: Infinity,
      })
    }
  }, [state])

  return (
    <div>
      <motion.div
        ref={scope}
        className="h-14 flex justify-center items-center border"
        style={{
          width: motionValues.nodeWidth,
          boxShadow: useTransform([motionValues.glowIntensity], ([glow = 0]: Array<number>) => {
            const cappedGlow = Math.min(glow, 8)
            const baseGlow =
              state._tag === "Running"
                ? "0 0 24px rgba(59, 130, 246, 0.2)"
                : "0 2px 4px rgba(0,0,0,0.4)"

            if (state._tag === "Died") {
              return cappedGlow > 0
                ? `${baseGlow}, 0 0 ${cappedGlow * 2}px ${COLORS.glow.death}`
                : baseGlow
            }

            return cappedGlow > 0
              ? `${baseGlow}, 0 0 ${cappedGlow}px ${COLORS.glow.running}`
              : baseGlow
          }),
        }}
      >
        <EffectContainer motionValues={motionValues} state={state}>
          {VisualEffectState.$is("Succeeded")(state) && <span>{JSON.stringify(state.value)}</span>}
          {/*<EffectOverlay />*/}
          {/*<EffectContent>a</EffectContent>*/}
        </EffectContainer>
      </motion.div>
      <EffectLabel label={definition.label} />
    </div>
  )
}

export const EFFECT_CONTAINER_VARIANTS: Record<VisualEffectState["_tag"], any> = {
  Idle: {
    scale: 1,
    opacity: 0.6,
    backgroundColor: COLORS.task.idle,
    transition: {
      // Fast color change to match original
      backgroundColor: { duration: 0.1, ease: "easeInOut" },
      // Keep spring for scale/opacity
      scale: SPRINGS.default,
      opacity: SPRINGS.default,
    },
  },

  Running: {
    scale: 0.95,
    opacity: 1,
    backgroundColor: COLORS.task.running,
    transition: {
      backgroundColor: { duration: 0.1, ease: "easeInOut" },
      scale: SPRINGS.default,
      opacity: SPRINGS.default,
    },
  },

  Succeeded: {
    scale: 1,
    opacity: 1,
    backgroundColor: COLORS.task.success,
    transition: {
      backgroundColor: { duration: 0.1, ease: "easeInOut" },
      scale: SPRINGS.contentScale,
      opacity: SPRINGS.contentScale,
    },
  },

  Failed: {
    backgroundColor: COLORS.task.error,
    scale: 1,
    opacity: 1,
    transition: {
      backgroundColor: { duration: 0.1, ease: "easeInOut" },
      scale: SPRINGS.contentScale,
      opacity: SPRINGS.contentScale,
    },
  },

  Died: {
    backgroundColor: COLORS.task.death,
    scale: 1,
    opacity: 1,
    transition: {
      backgroundColor: { duration: 0.1, ease: "easeInOut" },
      scale: SPRINGS.contentScale,
      opacity: SPRINGS.contentScale,
    },
  },

  Interrupted: {
    backgroundColor: COLORS.task.interrupted,
    opacity: 1,
    scale: 1,
    transition: {
      backgroundColor: { duration: 0.1, ease: "easeInOut" },
      scale: SPRINGS.default,
      opacity: SPRINGS.default,
    },
  },
} as const

function EffectContainer({
  children,
  motionValues,
  state,
}: React.PropsWithChildren<{
  readonly motionValues: EffectMotionValues
  readonly state: VisualEffectState
}>) {
  return (
    <motion.div
      variants={EFFECT_CONTAINER_VARIANTS}
      animate={state._tag}
      initial={false}
      style={{
        width: motionValues.nodeWidth,
        height: motionValues.nodeHeight,
        borderRadius: motionValues.borderRadius,
        rotate: motionValues.rotation,
        x: motionValues.shakeX,
        y: motionValues.shakeY,
        filter: useTransform(motionValues.blurAmount, (blur = 0) => {
          const cappedBlur = Math.min(blur, 2)
          return VisualEffectState.$is("Died")(state)
            ? `blur(${cappedBlur}px) contrast(${VFX.contrast.death}) brightness(${VFX.brightness.death})`
            : `blur(${cappedBlur}px)`
        }),
        boxShadow: useTransform(motionValues.glowIntensity, (glow = 0) => {
          const baseGlow = VisualEffectState.$is("Running")(state)
            ? SHADOW_COLORS.task.running
            : SHADOW_COLORS.small

          const cappedGlow = Math.min(glow, 8)

          if (VisualEffectState.$is("Died")(state)) {
            return cappedGlow > 0
              ? `${baseGlow}, 0 0 ${cappedGlow * 2}px ${COLORS.glow.death}`
              : baseGlow
          }

          return cappedGlow > 0
            ? `${baseGlow}, 0 0 ${cappedGlow}px ${COLORS.glow.running}`
            : baseGlow
        }),
      }}
      className={cn(
        "absolute cursor-auto overflow-hidden",
        "contain-layout will-change-[transform,filter] translate-z-0",
        VisualEffectState.$is("Died")(state)
          ? `2px solid ${COLORS.border.death}`
          : `1px solid ${COLORS.border.default}`,
      )}
    >
      {children}
    </motion.div>
  )
}

function EffectOverlay() {
  return null
}

function EffectContent() {
  return null
}

function EffectLabel({ label }: { readonly label: string }) {
  return (
    <motion.div className="mt-2 text-xs text-center font-semibold text-muted-foreground">
      <span>{label}</span>
    </motion.div>
  )
}
