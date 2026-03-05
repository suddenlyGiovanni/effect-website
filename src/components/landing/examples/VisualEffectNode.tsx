import * as React from "react"
import { OctagonAlert, Skull, Sparkle } from "lucide-react"
import {
  AnimatePresence,
  motion,
  useTransform,
  type AnimationScope,
  type Variants,
} from "motion/react"
import { type EffectMotionValues } from "@/hooks/animation/useEffectMotionValues"
import { COLORS, SHADOW_COLORS, SPRINGS, VFX } from "@/lib/animation"
import type { VisualEffectState } from "@/lib/examples/domain"
import { cn } from "@/lib/utils"

export function VisualEffectNode({
  label,
  motionValues,
  scope,
  state,
}: {
  readonly label: string
  readonly motionValues: EffectMotionValues
  readonly scope: AnimationScope
  readonly state: VisualEffectState
}) {
  return (
    <div>
      <motion.div
        className="relative flex h-14 items-center justify-center"
        style={{ width: motionValues.nodeWidth }}
      >
        <VisualEffectContainer scope={scope} motionValues={motionValues} state={state}>
          <VisualEffectOverlay motionValues={motionValues} state={state} />
          <VisualEffectContent motionValues={motionValues} state={state} />
        </VisualEffectContainer>
      </motion.div>
      <VisualEffectLabel label={label} />
    </div>
  )
}

function VisualEffectContainer({
  children,
  scope,
  motionValues,
  state,
}: React.PropsWithChildren<{
  readonly scope: AnimationScope
  readonly motionValues: EffectMotionValues
  readonly state: VisualEffectState
}>) {
  const isDied = state._tag === "Died"

  const filter = useTransform(motionValues.blurAmount, (blur = 0) => {
    const cappedBlur = Math.min(blur, 2)
    return isDied
      ? `blur(${cappedBlur}px) contrast(${VFX.contrast.death}) brightness(${VFX.brightness.death})`
      : `blur(${cappedBlur}px)`
  })

  const boxShadow = useTransform(motionValues.glowIntensity, (glow = 0) => {
    const baseGlow = state._tag === "Running" ? SHADOW_COLORS.task.running : SHADOW_COLORS.small
    const cappedGlow = Math.min(glow, 8)

    if (isDied) {
      return cappedGlow > 0 ? `${baseGlow}, 0 0 ${cappedGlow * 2}px ${COLORS.glow.death}` : baseGlow
    }

    return cappedGlow > 0 ? `${baseGlow}, 0 0 ${cappedGlow}px ${COLORS.glow.running}` : baseGlow
  })

  return (
    <motion.div
      ref={scope}
      variants={VISUAL_EFFECT_NODE_VARIANTS}
      animate={state._tag}
      initial={false}
      style={{
        width: motionValues.nodeWidth,
        height: motionValues.nodeHeight,
        borderRadius: motionValues.borderRadius,
        rotate: motionValues.rotation,
        x: motionValues.shakeX,
        y: motionValues.shakeY,
        filter,
        boxShadow,
        border: isDied ? `2px solid ${COLORS.border.death}` : `1px solid ${COLORS.border.default}`,
        contain: "layout style paint",
        willChange: "transform, filter",
        transform: "translateZ(0)",
      }}
      className={cn("relative cursor-auto overflow-hidden")}
    >
      {children}
    </motion.div>
  )
}

export const VISUAL_EFFECT_NODE_VARIANTS: Record<VisualEffectState["_tag"], Variants[string]> = {
  Idle: {
    scale: 1,
    opacity: 0.6,
    backgroundColor: COLORS.task.idle,
    transition: {
      backgroundColor: { duration: 0.1, ease: "easeInOut" },
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
}

function VisualEffectOverlay({
  motionValues,
  state,
}: {
  readonly motionValues: EffectMotionValues
  readonly state: VisualEffectState
}) {
  const isRunning = state._tag === "Running"

  return (
    <>
      {isRunning && (
        <motion.div
          className={cn(
            "absolute inset-0 pointer-events-none",
            "ring-1 ring-inset ring-[rgba(100,200,255,0.8)]",
          )}
          style={{
            borderRadius: motionValues.borderRadius,
            opacity: motionValues.borderOpacity,
          }}
        />
      )}

      {isRunning &&
        [0, 0.2, 0.4, 0.6, 0.8, 1].map((delay) => (
          <motion.div
            key={`delay(${delay.toString()})`}
            className={cn(
              "absolute top-0 left-0 bottom-0 w-[200%] blur-xs mix-blend-lighten",
              "bg-[linear-gradient(90deg,transparent_0%,transparent_40%,rgba(255,255,255,0.1)_45%,rgba(255,255,255,0.5)_50%,rgba(255,255,255,0.1)_55%,transparent_60%,transparent_100%)]",
            )}
            animate={{
              x: ["-66.0%", "50%"],
            }}
            transition={{
              duration: 0.8,
              delay,
              repeat: Infinity,
              ease: [0.5, 0, 0.1, 1],
            }}
          />
        ))}

      <motion.div
        className="absolute inset-0 pointer-events-none mix-blend-overlay"
        style={{
          background: motionValues.flashColor,
          opacity: motionValues.flashOpacity,
        }}
      />
    </>
  )
}

function VisualEffectContent({
  motionValues,
  state,
}: {
  readonly motionValues: EffectMotionValues
  readonly state: VisualEffectState
}) {
  const contentRef = React.useRef<HTMLSpanElement>(null)

  const getContent = (state: VisualEffectState): React.ReactNode => {
    switch (state._tag) {
      case "Idle":
        return (
          <motion.div
            key="star"
            className="flex justify-center items-center"
            initial={{ scale: 0, filter: "blur(10px)" }}
            animate={{ scale: 1, filter: "blur(0px)" }}
            exit={{ scale: 0, filter: "blur(10px)" }}
            transition={{ type: "spring", bounce: 0.3, visualDuration: 0.3 }}
          >
            <VisualEffectNodeIcon size={56} state={state} />
          </motion.div>
        )
      case "Running":
        return null
      case "Succeeded": {
        // const { result } = state
        // const content = isRenderableResult(result) ? renderResult(result) : String(result)
        return (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.5, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.5, filter: "blur(10px)" }}
            transition={{
              ...SPRINGS.bouncy,
              stiffness: 260,
              damping: 18,
            }}
          >
            {state.value.render()}
          </motion.div>
        )
      }
      case "Failed":
      case "Interrupted":
      case "Died":
        return (
          <motion.div
            key={state._tag}
            className="flex justify-center items-center"
            initial={{ scale: 0, filter: "blur(10px)" }}
            animate={{ scale: 1, filter: "blur(0px)" }}
            exit={{ scale: 0, filter: "blur(10px)" }}
            transition={{
              type: "spring",
              bounce: state._tag === "Interrupted" ? 0.5 : 0.3,
              visualDuration: 0.3,
            }}
          >
            <VisualEffectNodeIcon size={56} state={state} />
          </motion.div>
        )
    }
  }

  React.useLayoutEffect(() => {
    if (state._tag !== "Succeeded") return

    const content = contentRef.current
    if (!content) return

    const actualWidth = content.scrollWidth
    if (actualWidth > 40) {
      motionValues.nodeWidth.set(actualWidth + 24)
    }
  }, [motionValues.nodeWidth, state])

  return (
    <motion.div
      className="absolute inset-0 flex justify-center items-center font-bold py-2"
      style={{
        color: "white",
        opacity: motionValues.contentOpacity,
        scale: motionValues.contentScale,
      }}
    >
      <span ref={contentRef} className="whitespace-nowrap">
        <AnimatePresence mode="popLayout">{getContent(state)}</AnimatePresence>
      </span>
    </motion.div>
  )
}

function VisualEffectNodeIcon({
  size,
  state,
}: {
  readonly size: number
  readonly state: VisualEffectState
}) {
  const iconSize = size * 0.5
  switch (state._tag) {
    case "Failed":
      return <Skull size={iconSize} />
    case "Died":
      return <Skull size={iconSize} />
    case "Interrupted":
      return <OctagonAlert size={iconSize} />
    default:
      return <Sparkle className="text-neutral-200" size={iconSize} fill="currentColor" />
  }
}

function VisualEffectLabel({ label }: { readonly label: string }) {
  return (
    <motion.div className="mt-2 text-center text-xs font-semibold text-muted-foreground">
      <span>{label}</span>
    </motion.div>
  )
}
