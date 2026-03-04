import * as React from "react"
import { MotionConfig, motion, useAnimate, useTransform, type AnimationScope } from "motion/react"
import { useAtomValue } from "@effect/atom-react"
import { currentExampleAtom, VisualEffectState } from "@/atoms/visual-effect"
import {
  useEffectMotionValues,
  type EffectMotionValues,
} from "@/hooks/animation/useEffectMotionValues"
import { useEffectNodeAnimationController } from "@/hooks/animation/useEffectNodeAnimationController"
import { useNodeTransitionFlags } from "@/hooks/animation/useNodeTransitionFlags"
import type { StepDefinition } from "@/lib/examples/constructors"
import { cn } from "@/lib/utils"
import { COLORS, SHADOW_COLORS, VFX } from "@/lib/animation"
import { effectNodeVariants } from "./effectNodeVariants"
import { VisualEffectControls } from "./VisualEffectControls"
import { useStepState, VisualEffectProvider } from "./VisualEffectProvider"

export function VisualEffect() {
  return (
    <React.Suspense>
      <VisualEffectProvider>
        <div className="w-fit min-w-full flex flex-col border shadow-2xl">
          <MotionConfig reducedMotion="user">
            <VisualEffectControls />
            <ExampleEffects />
          </MotionConfig>
        </div>
      </VisualEffectProvider>
    </React.Suspense>
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
  const [scope] = useAnimate()
  const stepState = useStepState(definition.label)
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
        className="h-14 relative"
        style={{
          width: motionValues.nodeWidth,
          height: motionValues.nodeHeight,
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
      className={cn("absolute inset-0 cursor-auto overflow-hidden")}
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
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: motionValues.borderRadius,
            boxShadow: "inset 0 0 0 1px rgba(100, 200, 255, 0.8)",
            opacity: motionValues.borderOpacity,
            pointerEvents: "none",
          }}
        />
      )}

      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          background: motionValues.flashColor,
          opacity: motionValues.flashOpacity,
          mixBlendMode: "overlay",
          pointerEvents: "none",
        }}
      />
    </>
  )
}

function EffectContent({
  motionValues,
  state,
}: {
  readonly motionValues: EffectMotionValues
  readonly state: VisualEffectState
}) {
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
      }}
    >
      {VisualEffectState.$is("Succeeded")(state) ? <span>{state.value as any}</span> : null}
    </motion.div>
  )
}

function EffectLabel({ label }: { readonly label: string }) {
  return (
    <motion.div className="mt-2 text-xs text-center font-semibold text-muted-foreground">
      <span>{label}</span>
    </motion.div>
  )
}
