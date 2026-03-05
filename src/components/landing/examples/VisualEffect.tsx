import { MotionConfig, motion, useAnimate, useTransform, type AnimationScope } from "motion/react"
import * as React from "react"
import type { ExampleDefinition } from "@/lib/examples/constructors"
import {
  useEffectMotionValues,
  type EffectMotionValues,
} from "@/hooks/animation/useEffectMotionValues"
import { useEffectNodeAnimationController } from "@/hooks/animation/useEffectNodeAnimationController"
import { useNodeTransitionFlags } from "@/hooks/animation/useNodeTransitionFlags"
import { COLORS, SHADOW_COLORS, VFX } from "@/lib/animation"
import { VisualEffectState } from "@/lib/examples/domain"
import { cn } from "@/lib/utils"
import { effectNodeVariants } from "./effectNodeVariants"
import { VisualEffectControls } from "./VisualEffectControls"
import {
  ExampleContext,
  StepContext,
  useExampleDefinition,
  useStepDefinition,
  useStepState,
} from "./VisualEffectProvider"

export function VisualEffect({ example }: { readonly example: ExampleDefinition }) {
  return (
    <ExampleContext.Provider value={example}>
      <div className="flex w-fit min-w-full flex-col border shadow-2xl">
        <MotionConfig reducedMotion="user">
          <VisualEffectControls />
          <ExampleEffects />
        </MotionConfig>
      </div>
    </ExampleContext.Provider>
  )
}

function ExampleEffects() {
  const example = useExampleDefinition()
  return (
    <div className="border-b p-6">
      <div className="flex items-center justify-start gap-6">
        <div className="flex flex-wrap justify-center gap-6">
          {example.steps.map((step) => (
            <StepContext.Provider key={step.label} value={step}>
              <EffectNode key={step.label} />
            </StepContext.Provider>
          ))}
        </div>
      </div>
    </div>
  )
}

function EffectNode() {
  const [scope] = useAnimate()
  const definition = useStepDefinition()
  const stepState = useStepState()
  const motionValues = useEffectMotionValues()
  const transition = useNodeTransitionFlags(stepState)

  useEffectNodeAnimationController({
    scope,
    motion: motionValues,
    tag: stepState._tag,
    transition,
  })

  return (
    <div>
      <motion.div
        className="relative flex h-14 items-center justify-center"
        style={{
          width: motionValues.nodeWidth,
        }}
      >
        <EffectContainer scope={scope} motionValues={motionValues} tag={stepState._tag}>
          <EffectOverlay motionValues={motionValues} tag={stepState._tag} />
          <EffectContent motionValues={motionValues} state={stepState} />
        </EffectContainer>
      </motion.div>
      <EffectLabel label={definition.label} />
    </div>
  )
}

function EffectContainer({
  children,
  scope,
  motionValues,
  tag,
}: React.PropsWithChildren<{
  readonly scope: AnimationScope
  readonly motionValues: EffectMotionValues
  readonly tag: VisualEffectState["_tag"]
}>) {
  const isDied = tag === "Died"

  const filter = useTransform(motionValues.blurAmount, (blur = 0) => {
    const cappedBlur = Math.min(blur, 2)
    return isDied
      ? `blur(${cappedBlur}px) contrast(${VFX.contrast.death}) brightness(${VFX.brightness.death})`
      : `blur(${cappedBlur}px)`
  })

  const boxShadow = useTransform(motionValues.glowIntensity, (glow = 0) => {
    const baseGlow = tag === "Running" ? SHADOW_COLORS.task.running : SHADOW_COLORS.small
    const cappedGlow = Math.min(glow, 8)

    if (isDied) {
      return cappedGlow > 0 ? `${baseGlow}, 0 0 ${cappedGlow * 2}px ${COLORS.glow.death}` : baseGlow
    }

    return cappedGlow > 0 ? `${baseGlow}, 0 0 ${cappedGlow}px ${COLORS.glow.running}` : baseGlow
  })

  return (
    <motion.div
      ref={scope}
      variants={effectNodeVariants}
      animate={tag}
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

function EffectOverlay({
  motionValues,
  tag,
}: {
  readonly motionValues: EffectMotionValues
  readonly tag: VisualEffectState["_tag"]
}) {
  const isRunning = tag === "Running"

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
          <RunningOverlay key={delay.toString()} delay={delay} />
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

function RunningOverlay({ delay }: { readonly delay: number }) {
  return (
    <motion.div
      className={cn(
        "absolute top-0 left-0 bottom-0 w-[200%] blur-xs mix-blend-lighten",
        "bg-[linear-gradient(90deg,transparent_0%,transparent_40%,rgba(255,255,255,0.1)_45%,rgba(255,255,255,0.5)_50%,rgba(255,255,255,0.1)_55%,transparent_60%,transparent_100%)]",
      )}
      animate={{
        x: ["-66.0%"],
      }}
      transition={{
        duration: 0.8,
        delay,
        repeat: Infinity,
        ease: [0.5, 0, 0.1, 1],
      }}
    />
  )
}

function EffectContent({
  motionValues,
  state,
}: {
  readonly motionValues: EffectMotionValues
  readonly state: VisualEffectState
}) {
  const formatSucceededValue = (raw: unknown): string => {
    if (typeof raw === "string") return raw
    if (typeof raw === "number" || typeof raw === "boolean" || typeof raw === "bigint") {
      return String(raw)
    }
    if (raw === null || raw === undefined) return ""

    try {
      return JSON.stringify(raw) ?? String(raw)
    } catch {
      return String(raw)
    }
  }

  const contentRef = React.useRef<HTMLSpanElement>(null)

  const value = state._tag === "Succeeded" ? formatSucceededValue(state.value) : null

  React.useLayoutEffect(() => {
    if (value === null) return

    const content = contentRef.current
    if (content === null) return

    const actualWidth = content.scrollWidth
    if (actualWidth > 40) {
      motionValues.nodeWidth.set(actualWidth + 24)
    }
  }, [motionValues.nodeWidth, value])

  return (
    <motion.div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontWeight: 600,
        opacity: motionValues.contentOpacity,
        scale: motionValues.contentScale,
        padding: "0 8px",
      }}
    >
      {value === null ? null : (
        <span ref={contentRef} style={{ whiteSpace: "nowrap" }}>
          {value}
        </span>
      )}
    </motion.div>
  )
}

function EffectLabel({ label }: { readonly label: string }) {
  return (
    <motion.div className="mt-2 text-center text-xs font-semibold text-muted-foreground">
      <span>{label}</span>
    </motion.div>
  )
}
