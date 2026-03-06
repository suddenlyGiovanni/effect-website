import { ArrowRight } from "lucide-react"
import { MotionConfig, motion, useAnimate } from "motion/react"
import * as React from "react"
import type { ExampleDefinition } from "@/lib/examples/constructors"
import { useEffectMotionValues } from "@/hooks/animation/useEffectMotionValues"
import { useEffectNodeAnimationController } from "@/hooks/animation/useEffectNodeAnimationController"
import { useNodeTransitionFlags } from "@/hooks/animation/useNodeTransitionFlags"
import { useSnippetHoverState } from "@/hooks/examples/useSnippetHoverState"
import { snippetResultTargetKey, toStepSnippetTargetKey } from "@/lib/examples/snippet-highlights"
import { VisualEffectCodeSnippet } from "./VisualEffectCodeSnippet"
import { VisualEffectConfigPanel } from "./VisualEffectConfigPanel"
import { VisualEffectControls } from "./VisualEffectControls"
import { VisualEffectNode } from "./VisualEffectNode"
import { VisualEffectScheduleTimeline } from "./VisualEffectScheduleTimeline"
import {
  ExampleControlRuntimeProvider,
  ExampleContext,
  StepContext,
  useExampleDefinition,
  useExampleState,
  useStepDefinition,
  useStepState,
} from "./VisualEffectProvider"

export function VisualEffect({ example }: { readonly example: ExampleDefinition }) {
  return (
    <ExampleContext.Provider value={example}>
      <ExampleControlRuntimeProvider>
        <VisualEffectSurface />
      </ExampleControlRuntimeProvider>
    </ExampleContext.Provider>
  )
}

function VisualEffectSurface() {
  const exampleState = useExampleState()
  const example = useExampleDefinition()
  const { delayedTarget, onHoverTargetChange } = useSnippetHoverState(example.key, 500)
  const isDied = exampleState._tag === "Died"
  const borderColor = isDied ? "rgba(127, 29, 29, 0.5)" : "#27272a"

  return (
    <motion.div
      className="flex w-fit min-w-full flex-col border shadow-2xl"
      initial={false}
      animate={{
        borderColor,
        boxShadow: isDied ? "0 0 40px rgba(220, 38, 38, 0.3)" : "0 0 0 0 rgba(59, 130, 250, 0)",
      }}
      transition={{
        borderColor: { duration: 0.2, ease: "easeInOut" },
        boxShadow: { duration: 0.2, ease: "easeInOut" },
      }}
    >
      <MotionConfig reducedMotion="user">
        <VisualEffectControls isDied={isDied} />
        <VisualEffectConfigPanel isDied={isDied} />
        <VisualEffectNodes isDied={isDied} onHoverTargetChange={onHoverTargetChange} />
        {example.scheduleTimeline !== undefined && (
          <VisualEffectScheduleTimeline config={example.scheduleTimeline} />
        )}
        <VisualEffectCodeSnippet snippet={example.code} activeTarget={delayedTarget} />
      </MotionConfig>
    </motion.div>
  )
}

function VisualEffectNodes({
  isDied,
  onHoverTargetChange,
}: {
  readonly isDied: boolean
  readonly onHoverTargetChange: (target: string | null) => void
}) {
  const example = useExampleDefinition()
  const borderColor = isDied ? "rgba(127, 29, 29, 0.5)" : "#27272a"

  return (
    <motion.div
      className="border-b bg-background p-6"
      initial={false}
      animate={{ borderColor }}
      transition={{ borderColor: { duration: 0.2, ease: "easeInOut" } }}
    >
      <div className="flex items-center justify-start gap-6">
        {example.steps.length > 0 && (
          <React.Fragment>
            <div className="flex flex-wrap justify-center gap-6">
              {example.steps.map((step) => (
                <StepContext.Provider key={step.id} value={step}>
                  <VisualEffectStepNode onHoverTargetChange={onHoverTargetChange} />
                </StepContext.Provider>
              ))}
            </div>

            <div className="mb-6 flex items-center text-neutral-500">
              <ArrowRight className="size-6" fill="currentColor" />
            </div>
          </React.Fragment>
        )}

        <VisualEffectResultNode onHoverTargetChange={onHoverTargetChange} />
      </div>
    </motion.div>
  )
}

export function VisualEffectStepNode({
  onHoverTargetChange,
}: {
  readonly onHoverTargetChange: (target: string | null) => void
}) {
  const [scope] = useAnimate()
  const definition = useStepDefinition()
  const stepState = useStepState()
  const motionValues = useEffectMotionValues()
  const transition = useNodeTransitionFlags(stepState)
  const target = toStepSnippetTargetKey(definition.id)

  useEffectNodeAnimationController({
    scope,
    motion: motionValues,
    tag: stepState._tag,
    transition,
  })

  return (
    <VisualEffectNode
      label={definition.label}
      motionValues={motionValues}
      onMouseEnter={() => onHoverTargetChange(target)}
      onMouseLeave={() => onHoverTargetChange(null)}
      state={stepState}
      scope={scope}
    />
  )
}

export function VisualEffectResultNode({
  onHoverTargetChange,
}: {
  readonly onHoverTargetChange: (target: string | null) => void
}) {
  const [scope] = useAnimate()
  const exampleState = useExampleState()
  const motionValues = useEffectMotionValues()
  const transition = useNodeTransitionFlags(exampleState)

  useEffectNodeAnimationController({
    scope,
    motion: motionValues,
    tag: exampleState._tag,
    transition,
  })

  return (
    <VisualEffectNode
      label="result"
      motionValues={motionValues}
      onMouseEnter={() => onHoverTargetChange(snippetResultTargetKey)}
      onMouseLeave={() => onHoverTargetChange(null)}
      state={exampleState}
      scope={scope}
    />
  )
}
