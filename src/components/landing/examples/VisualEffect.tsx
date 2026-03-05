import { ArrowRight } from "lucide-react"
import { MotionConfig, useAnimate } from "motion/react"
import type { ExampleDefinition } from "@/lib/examples/constructors"
import { useEffectMotionValues } from "@/hooks/animation/useEffectMotionValues"
import { useNodeTransitionFlags } from "@/hooks/animation/useNodeTransitionFlags"
import { useEffectNodeAnimationController } from "@/hooks/animation/useEffectNodeAnimationController"
import { VisualEffectControls } from "./VisualEffectControls"
import { VisualEffectNode } from "./VisualEffectNode"
import {
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
      <div className="flex w-fit min-w-full flex-col border shadow-2xl">
        <MotionConfig reducedMotion="user">
          <VisualEffectControls />
          <VisualEffectNodes />
        </MotionConfig>
      </div>
    </ExampleContext.Provider>
  )
}

function VisualEffectNodes() {
  const example = useExampleDefinition()
  return (
    <div className="border-b p-6">
      <div className="flex items-center justify-start gap-6">
        <div className="flex flex-wrap justify-center gap-6">
          {example.steps.map((step) => (
            <StepContext.Provider key={step.label} value={step}>
              <VisualEffectStepNode />
            </StepContext.Provider>
          ))}
        </div>

        <div className="flex items-center mb-6 text-neutral-500">
          <ArrowRight className="size-6" fill="currentColor" />
        </div>

        <VisualEffectResultNode />
      </div>
    </div>
  )
}

export function VisualEffectStepNode() {
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
    <VisualEffectNode
      label={definition.label}
      motionValues={motionValues}
      state={stepState}
      scope={scope}
    />
  )
}

export function VisualEffectResultNode() {
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
      state={exampleState}
      scope={scope}
    />
  )
}
