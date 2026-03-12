# Motion Usage Refactor Specification

## Intent

This spec defines a full refactor of Motion usage for effect-node animation, replacing ad-hoc imperative loops with semantic Motion patterns that are deterministic, cancel-safe, and reduced-motion compliant.

Primary target for migration:

- legacy reference: `.repos/landing/src/components/effect/useEffectMotion.ts`
- current integration target: `src/components/landing/examples/Example.tsx` and `src/hooks/animation/useEffectMotion.ts`

This spec is implementation-complete and resolves prior open decisions:

1. Jitter becomes deterministic (no random loop).
2. Reduced motion disables all transient effects (flash, shake, glitch, pulse).

## Mandatory references before implementation

If this spec is used in a clean session, implementation must read these first.

### Project files

- `src/components/landing/examples/Example.tsx`
- `src/hooks/animation/useEffectMotion.ts`
- `src/lib/animation.ts`
- `src/atoms/visual-effect.ts`

### Legacy reference

- `.repos/landing/src/components/effect/useEffectMotion.ts`
- `.repos/landing/src/components/effect/EffectNode.tsx`
- `.repos/landing/src/components/effect/EffectContainer.tsx`
- `.repos/landing/src/components/effect/EffectContent.tsx`
- `.repos/landing/src/components/effect/EffectOverlay.tsx`
- `.repos/landing/src/hooks/useStateTransition.ts`

### Motion docs reference

- https://motion.dev/docs/react
- specifically: `useReducedMotion`, `MotionConfig`, variants, `useAnimate`, keyframes, animation controls

## Problem statement

Current and legacy pattern has these defects:

- multiple hooks write same channels (`rotation`, `shakeX`, `shakeY`, `glowIntensity`) -> race/tug-of-war.
- async `.finished` chains not centrally cancellable.
- reduced-motion policy fragmented and not globally enforced.
- random RAF jitter loop is non-deterministic and hard to test.
- effects often keyed to broad objects, not semantic transitions.

## Goals

- One owner per motion channel.
- Explicit tag-driven animation model (`state._tag`).
- Motion-native reduced motion behavior (`MotionConfig` + `useReducedMotion`).
- Deterministic, testable transient effects.
- Keep base state visuals declarative via variants.
- Keep transient effects imperative via `useAnimate` sequences only where needed.
- Zero `any`, zero type assertions, zero non-null assertions.

## Non-goals

- redesigning visual language/colors.
- introducing custom animation engine.
- replacing Motion library.
- changing event/runtime state model in `VisualEffectManager`.

## High-level architecture

Two-layer design:

### 1) Declarative base layer (variants)

State-owned properties:

- `backgroundColor`
- baseline `opacity`
- baseline `scale`
- baseline border style

Use variants keyed by `VisualEffectState["_tag"]`.

### 2) Transient orchestration layer (controller)

Transition-only properties:

- flash burst
- completion pop
- running pulse
- failure/death shake
- death glitch loop

Use a single controller hook with `useAnimate` and central cleanup registry.

## Semantic state model

Use runtime `state._tag` directly for animation selection, plus transition flags.

```ts
import type { VisualEffectState } from "@/features/visual-effect/state/atoms"

export type NodeTag = VisualEffectState["_tag"]

export interface TransitionFlags {
  readonly justStarted: boolean
  readonly justCompleted: boolean
  readonly justFailed: boolean
  readonly justDied: boolean
}
```

Derivation must depend on primitive tags (`state._tag`), not full state object identity.

## Public API surface (new hooks/utilities)

### `useEffectMotionValues`

`src/hooks/animation/useEffectMotionValues.ts`

```ts
import { MotionValue } from "motion/react"

export interface EffectMotionValues {
  readonly nodeWidth: MotionValue<number>
  readonly nodeHeight: MotionValue<number>
  readonly contentOpacity: MotionValue<number>
  readonly contentScale: MotionValue<number>
  readonly flashOpacity: MotionValue<number>
  readonly flashColor: MotionValue<string>
  readonly borderRadius: MotionValue<number>
  readonly borderOpacity: MotionValue<number>
  readonly glowIntensity: MotionValue<number>
  readonly rotation: MotionValue<number>
  readonly shakeX: MotionValue<number>
  readonly shakeY: MotionValue<number>
  readonly blurAmount: MotionValue<number>
}
```

Behavior:

- returns stable references for lifecycle of component.
- contains no side effects.

### `useNodeTransitionFlags`

`src/hooks/animation/useNodeTransitionFlags.ts`

```ts
export declare function useNodeTransitionFlags(state: VisualEffectState): TransitionFlags
```

Behavior:

- pure derivation from current + previous `VisualEffectState["_tag"]`.

### `useEffectNodeAnimationController`

`src/hooks/animation/useEffectNodeAnimationController.ts`

```ts
import type { AnimationScope } from "motion/react"

export interface NodeAnimationControllerInput {
  readonly scope: AnimationScope
  readonly motion: EffectMotionValues
  readonly tag: VisualEffectState["_tag"]
  readonly transition: TransitionFlags
}
```

Behavior:

- single writer for all transient motion channels.
- starts/stops all controls on tag change.
- no recursive RAF loops.
- no random jitter generation.

### `effectNodeVariants`

`src/components/landing/examples/effectNodeVariants.ts`

```ts
export const effectNodeVariants: Record<VisualEffectState["_tag"], unknown>
```

Behavior:

- own only base visual state, not transient flashes/shakes/glitches.

## Reduced motion policy (resolved)

Required behavior:

- wrap example surface in `MotionConfig reducedMotion="user"`.
- read `useReducedMotion()` in controller.
- if reduced motion is enabled:
  - immediately stop active transient animations.
  - set steady values synchronously.
  - skip starting flash/shake/glitch/pulse sequences.
- keep static state transitions (color/opacity) short and non-oscillatory.

Policy summary:

- transient effects disabled.
- semantic state still visible via color/icon/text changes.

## Deterministic jitter policy (resolved)

Replace random jitter with deterministic keyframes:

- running motion uses fixed keyframe arrays and repeat.
- durations and amplitudes from constants.
- no `Math.random`, no recursive scheduling.

Example:

- `rotation`: `[0, 0.8, -0.7, 0.4, 0]`
- `shakeX`: `[0, 0.7, -0.6, 0.4, 0]`
- `shakeY`: `[0, -0.2, 0.15, -0.1, 0]`

## Ownership and cancellation rules

Hard rules:

- each `MotionValue` has exactly one writer hook.
- each started animation control is stored in registry.
- cleanup stops:
  - all animation controls
  - timers
  - idle callbacks (if any remain)
- stale async completion handlers must check active token before writing.

Implementation pattern:

- `runIdRef` increments each controller run.
- each async segment captures `runId`.
- writes only if `runId === runIdRef.current`.

## Animation channel contracts

### Base channels (variants-owned)

- `backgroundColor`
- `opacity`
- `scale`

### Controller-owned channels

- `flashOpacity`
- `contentScale` burst
- `glowIntensity` pulse/glitch
- `rotation`, `shakeX`, `shakeY`
- `borderOpacity` pulse
- `nodeWidth`, `nodeHeight`, `borderRadius` transition effects
- `blurAmount` -> `filter` mapping on container
- `glowIntensity` -> `boxShadow` mapping on container

No other module may mutate controller-owned channels.

## Constants contract

`src/lib/animation.ts` must expose normalized timing constants:

- all Motion durations in seconds.
- no mixed unit fields in same object.
- each sequence has named constants:
  - `runningBorderPulseDurationSec`
  - `runningGlowPulseDurationSec`
  - `runningJitterDurationSec`
  - `failureShakeDurationSec`
  - `flashInDurationSec`
  - `flashOutDurationSec`

## Implementation output file plan

- `specs/motion-usage-refactor-spec.md` (this spec)
- `src/hooks/animation/useEffectMotionValues.ts` (new; from current `useEffectMotion`)
- `src/hooks/animation/useNodeTransitionFlags.ts` (new)
- `src/hooks/animation/useEffectNodeAnimationController.ts` (new)
- `src/components/landing/examples/effectNodeVariants.ts` (new)
- `src/components/landing/examples/Example.tsx` (update to consume new controller + variants + MotionConfig)
- `src/lib/animation.ts` (normalize + expand constants)
- `src/hooks/animation/useEffectMotion.ts` (delete or make compatibility shim, then remove)
- `src/hooks/animation/__tests__/useNodeTransitionFlags.test.ts` (new)
- `src/hooks/animation/__tests__/useEffectNodeAnimationController.test.ts` (new)
- `src/components/landing/examples/__tests__/Example.motion.test.tsx` (new)

If naming differs, separation of concerns must remain.

## Required behavior by tag

### Idle

- reset transient channels to neutral.
- no pulse, no shake.

### Running

- start deterministic border/glow pulse.
- start deterministic low-amplitude motion (if not reduced).
- hide content payload if design requires (from existing behavior).

### Succeeded (entry)

- run one completion pop.
- optional flash burst (disabled in reduced mode).
- settle to neutral transforms after completion.

### Failed / Died (entry)

- run bounded deterministic shake burst.
- `Died` may run deterministic glitch glow loop (disabled in reduced mode).
- always return to stable end values.

### Interrupted

- stop all transients quickly.
- settle to neutral transforms.

## Reference implementation snippets

These are concrete starter snippets for implementation (copy/adapt).

### `src/hooks/animation/useEffectMotionValues.ts`

```ts
import * as React from "react"
import { MotionValue, useMotionValue, useSpring, useTransform, useVelocity } from "motion/react"
import { COLORS, SPRINGS } from "@/lib/animation"

export interface EffectMotionValues {
  readonly nodeWidth: MotionValue<number>
  readonly nodeHeight: MotionValue<number>
  readonly contentOpacity: MotionValue<number>
  readonly contentScale: MotionValue<number>
  readonly flashOpacity: MotionValue<number>
  readonly flashColor: MotionValue<string>
  readonly borderRadius: MotionValue<number>
  readonly borderOpacity: MotionValue<number>
  readonly glowIntensity: MotionValue<number>
  readonly rotation: MotionValue<number>
  readonly shakeX: MotionValue<number>
  readonly shakeY: MotionValue<number>
  readonly blurAmount: MotionValue<number>
}

export function useEffectMotionValues(): EffectMotionValues {
  const nodeWidth = useSpring(56, SPRINGS.nodeWidth)
  const nodeHeight = useSpring(56, SPRINGS.default)
  const contentOpacity = useSpring(1, SPRINGS.default)
  const contentScale = useSpring(1, SPRINGS.default)

  const flashOpacity = useMotionValue(0)
  const flashColor = useMotionValue(COLORS.flash)

  const borderRadius = useSpring(8, SPRINGS.default)
  const borderOpacity = useSpring(1, SPRINGS.default)
  const glowIntensity = useSpring(0, SPRINGS.default)

  const rotation = useMotionValue(0)
  const shakeX = useMotionValue(0)
  const shakeY = useMotionValue(0)

  const rotationVelocity = useVelocity(rotation)
  const blurAmount = useTransform(rotationVelocity, [-100, 0, 100], [1, 0, 1], {
    clamp: true,
  })

  return React.useMemo(
    () => ({
      nodeWidth,
      nodeHeight,
      contentOpacity,
      contentScale,
      flashOpacity,
      flashColor,
      borderRadius,
      borderOpacity,
      glowIntensity,
      rotation,
      shakeX,
      shakeY,
      blurAmount,
    }),
    [],
  )
}
```

### `src/hooks/animation/useNodeTransitionFlags.ts`

```ts
import * as React from "react"
import type { VisualEffectState } from "@/features/visual-effect/state/atoms"

export interface TransitionFlags {
  readonly justStarted: boolean
  readonly justCompleted: boolean
  readonly justFailed: boolean
  readonly justDied: boolean
}

export function deriveTransitionFlags(
  previousTag: VisualEffectState["_tag"],
  currentTag: VisualEffectState["_tag"],
): TransitionFlags {
  return {
    justStarted: previousTag !== "Running" && currentTag === "Running",
    justCompleted: previousTag !== "Succeeded" && currentTag === "Succeeded",
    justFailed: previousTag !== "Failed" && currentTag === "Failed",
    justDied: previousTag !== "Died" && currentTag === "Died",
  }
}

export function useNodeTransitionFlags(state: VisualEffectState): TransitionFlags {
  const previousTagRef = React.useRef<VisualEffectState["_tag"]>(state._tag)

  const transition = React.useMemo(
    () => deriveTransitionFlags(previousTagRef.current, state._tag),
    [state._tag],
  )

  React.useEffect(() => {
    previousTagRef.current = state._tag
  }, [state._tag])

  return transition
}
```

### `src/hooks/animation/useEffectNodeAnimationController.ts`

```ts
import * as React from "react"
import {
  animate,
  type AnimationPlaybackControls,
  type AnimationScope,
  useReducedMotion,
} from "motion/react"
import type { EffectMotionValues } from "./useEffectMotionValues"
import type { TransitionFlags } from "./useNodeTransitionFlags"
import type { VisualEffectState } from "@/features/visual-effect/state/atoms"
import { SPRINGS, TIMINGS } from "@/lib/animation"

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

export function useEffectNodeAnimationController(input: NodeAnimationControllerInput): void {
  const { motion, tag, transition } = input
  const prefersReducedMotion = useReducedMotion() === true

  const controlsRef = React.useRef<Array<AnimationPlaybackControls>>([])
  const runIdRef = React.useRef(0)

  const stopAll = React.useCallback(() => {
    for (const control of controlsRef.current) {
      control.stop()
    }
    controlsRef.current = []
  }, [])

  React.useEffect(() => {
    runIdRef.current += 1
    const runId = runIdRef.current
    const isActive = () => runIdRef.current === runId

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

    const controls: Array<AnimationPlaybackControls> = []

    if (tag === "Running") {
      controls.push(
        animate(motion.borderOpacity, [1, 0.3, 1], {
          duration: TIMINGS.runningBorderPulseDurationSec,
          ease: "easeInOut",
          repeat: Infinity,
        }),
      )
      controls.push(
        animate(motion.glowIntensity, [0, 3, 0], {
          duration: TIMINGS.runningGlowPulseDurationSec,
          ease: "easeInOut",
          repeat: Infinity,
        }),
      )
      controls.push(
        animate(motion.rotation, RUNNING_ROTATION, {
          duration: TIMINGS.runningJitterDurationSec,
          ease: "easeInOut",
          repeat: Infinity,
        }),
      )
      controls.push(
        animate(motion.shakeX, RUNNING_X, {
          duration: TIMINGS.runningJitterDurationSec,
          ease: "easeInOut",
          repeat: Infinity,
        }),
      )
      controls.push(
        animate(motion.shakeY, RUNNING_Y, {
          duration: TIMINGS.runningJitterDurationSec,
          ease: "easeInOut",
          repeat: Infinity,
        }),
      )
    }

    if (transition.justCompleted) {
      motion.contentScale.set(0)
      controls.push(animate(motion.contentScale, [1.3, 1], SPRINGS.contentScale))

      const flashIn = animate(motion.flashOpacity, 0.6, {
        duration: TIMINGS.flashInDurationSec,
        ease: "circOut",
      })

      void flashIn.finished.then(() => {
        if (!isActive()) return
        controls.push(
          animate(motion.flashOpacity, 0, {
            duration: TIMINGS.flashOutDurationSec,
            ease: "linear",
          }),
        )
      })

      controls.push(flashIn)
    }

    if (transition.justFailed || transition.justDied) {
      controls.push(
        animate(motion.rotation, FAILURE_ROTATION, {
          duration: TIMINGS.failureShakeDurationSec,
          ease: "easeInOut",
        }),
      )
      controls.push(
        animate(motion.shakeX, FAILURE_X, {
          duration: TIMINGS.failureShakeDurationSec,
          ease: "easeInOut",
        }),
      )
      controls.push(
        animate(motion.shakeY, FAILURE_Y, {
          duration: TIMINGS.failureShakeDurationSec,
          ease: "easeInOut",
        }),
      )
    }

    controlsRef.current = controls

    return () => {
      runIdRef.current += 1
      stopAll()
      motion.rotation.set(0)
      motion.shakeX.set(0)
      motion.shakeY.set(0)
    }
  }, [
    tag,
    prefersReducedMotion,
    stopAll,
    transition.justCompleted,
    transition.justDied,
    transition.justFailed,
    motion,
  ])
}
```

### `src/components/landing/examples/effectNodeVariants.ts`

```ts
import type { Variants } from "motion/react"
import { COLORS, SPRINGS } from "@/lib/animation"
import type { VisualEffectState } from "@/features/visual-effect/state/atoms"

export const effectNodeVariants: Record<VisualEffectState["_tag"], Variants[string]> = {
  Idle: {
    backgroundColor: COLORS.task.idle,
    opacity: 0.6,
    scale: 1,
    transition: {
      backgroundColor: { duration: 0.1 },
      opacity: SPRINGS.default,
      scale: SPRINGS.default,
    },
  },
  Running: {
    backgroundColor: COLORS.task.running,
    opacity: 1,
    scale: 0.95,
    transition: {
      backgroundColor: { duration: 0.1 },
      opacity: SPRINGS.default,
      scale: SPRINGS.default,
    },
  },
  Succeeded: {
    backgroundColor: COLORS.task.success,
    opacity: 1,
    scale: 1,
    transition: {
      backgroundColor: { duration: 0.1 },
      opacity: SPRINGS.contentScale,
      scale: SPRINGS.contentScale,
    },
  },
  Failed: {
    backgroundColor: COLORS.task.error,
    opacity: 1,
    scale: 1,
    transition: {
      backgroundColor: { duration: 0.1 },
      opacity: SPRINGS.default,
      scale: SPRINGS.default,
    },
  },
  Interrupted: {
    backgroundColor: COLORS.task.interrupted,
    opacity: 1,
    scale: 1,
    transition: {
      backgroundColor: { duration: 0.1 },
      opacity: SPRINGS.default,
      scale: SPRINGS.default,
    },
  },
  Died: {
    backgroundColor: COLORS.task.death,
    opacity: 1,
    scale: 1,
    transition: {
      backgroundColor: { duration: 0.1 },
      opacity: SPRINGS.default,
      scale: SPRINGS.default,
    },
  },
}
```

### `src/components/landing/examples/Example.tsx` integration slice (split node + container)

```tsx
import { motion, useAnimate, useTransform, type AnimationScope } from "motion/react"
import { cn } from "@/lib/utils"
import { COLORS, SHADOW_COLORS, VFX } from "@/lib/animation"

function EffectNode({ definition }: { readonly definition: StepDefinition }) {
  const state = useAtomValue(stepStateAtom(definition.label)).pipe(
    AsyncResult.getOrElse(() => InitialState),
  )
  const motion = useEffectMotionValues()
  const transition = useNodeTransitionFlags(state)
  const [scope] = useAnimate()

  useEffectNodeAnimationController({
    scope,
    motion,
    tag: state._tag,
    transition,
  })

  return (
    <div className="relative h-14" style={{ width: motion.nodeWidth }}>
      <EffectContainer scope={scope} motion={motion} tag={state._tag}>
        <EffectOverlay tag={state._tag} motion={motion} />
        <EffectContent state={state} motion={motion} />
      </EffectContainer>
    </div>
  )
}

function EffectContainer({
  scope,
  motion,
  tag,
  children,
}: React.PropsWithChildren<{
  readonly scope: AnimationScope
  readonly motion: EffectMotionValues
  readonly tag: VisualEffectState["_tag"]
}>) {
  const isDied = tag === "Died"

  const filter = useTransform(motion.blurAmount, (blur = 0) => {
    const cappedBlur = Math.min(blur, 2)
    return isDied
      ? `blur(${cappedBlur}px) contrast(${VFX.contrast.death}) brightness(${VFX.brightness.death})`
      : `blur(${cappedBlur}px)`
  })

  const boxShadow = useTransform(motion.glowIntensity, (glow = 0) => {
    const cappedGlow = Math.min(glow, 8)
    const baseGlow = tag === "Running" ? SHADOW_COLORS.task.running : SHADOW_COLORS.small

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
        width: motion.nodeWidth,
        height: motion.nodeHeight,
        borderRadius: motion.borderRadius,
        rotate: motion.rotation,
        x: motion.shakeX,
        y: motion.shakeY,
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
  tag,
  motion,
}: {
  readonly tag: VisualEffectState["_tag"]
  readonly motion: EffectMotionValues
}) {
  const isRunning = tag === "Running"
  return (
    <>
      {isRunning && (
        <motion.div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: motion.borderRadius,
            boxShadow: "inset 0 0 0 1px rgba(100, 200, 255, 0.8)",
            opacity: motion.borderOpacity,
            pointerEvents: "none",
          }}
        />
      )}

      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          background: motion.flashColor,
          opacity: motion.flashOpacity,
          mixBlendMode: "overlay",
          pointerEvents: "none",
        }}
      />
    </>
  )
}
```

### Timing constants shape in `src/lib/animation.ts`

```ts
export const TIMINGS = {
  runningBorderPulseDurationSec: 1.5,
  runningGlowPulseDurationSec: 0.6,
  runningJitterDurationSec: 0.4,
  failureShakeDurationSec: 0.36,
  flashInDurationSec: 0.02,
  flashOutDurationSec: 0.8,
} as const
```

## Usage examples

### Example A: Top-level MotionConfig + node render

```tsx
import { MotionConfig } from "motion/react"

export function ExampleEffectsSurface() {
  return (
    <MotionConfig reducedMotion="user">
      <ExampleEffects />
    </MotionConfig>
  )
}
```

### Example B: Node wiring with single controller

```tsx
function EffectNode({ state }: { readonly state: VisualEffectState }) {
  const [scope] = useAnimate()
  const motion = useEffectMotionValues()
  const transition = useNodeTransitionFlags(state)

  useEffectNodeAnimationController({
    scope,
    motion,
    tag: state._tag,
    transition,
  })

  return (
    <EffectContainer scope={scope} motion={motion} tag={state._tag}>
      {/* content */}
    </EffectContainer>
  )
}
```

### Example C: Deterministic running pulse sequence

```ts
animate(motion.glowIntensity, [0, 3, 0], {
  duration: TIMINGS.runningGlowPulseDurationSec,
  ease: "easeInOut",
  repeat: Infinity,
})
```

### Example D: Reduced motion short-circuit

```ts
if (prefersReducedMotion) {
  stopAll()
  motion.flashOpacity.set(0)
  motion.rotation.set(0)
  motion.shakeX.set(0)
  motion.shakeY.set(0)
  motion.glowIntensity.set(0)
  return
}
```

## Validation rules

- No random generators in animation controller.
- No recursive RAF loops for node animations.
- No channel written by more than one hook.
- Reduced motion path must avoid starting transient controls.
- Transition-flag derivation must be pure and deterministic.
- Example surface must compile with strict TS.

## Testing requirements

- [ ] `useNodeTransitionFlags` transition flags correct for all tag transitions.
- [ ] controller starts running pulse only in `Running`.
- [ ] controller stops previous controls on tag change.
- [ ] reduced-motion mode never starts transient animations.
- [ ] deterministic keyframes are stable across reruns.
- [ ] completion pop only triggers on `justCompleted`.
- [ ] failure/died burst only triggers on entry transitions.
- [ ] no unhandled promise warnings from cancelled sequences.
- [ ] `Example.tsx` renders and animates with new controller contract.

## Implementation checklist

### Phase 1: extract primitives

- [ ] split `useEffectMotion` into pure `useEffectMotionValues`.
- [ ] add transition-flags helper.
- [ ] add `effectNodeVariants` module.

### Phase 2: controller

- [ ] implement single controller hook.
- [ ] add control registry + cleanup token model.
- [ ] implement deterministic running/failure/death sequences.

### Phase 3: reduced motion

- [ ] add `MotionConfig reducedMotion="user"` at surface.
- [ ] add controller short-circuit behavior.
- [ ] verify no transient animation starts in reduced mode.

### Phase 4: integrate Example UI

- [ ] update `Example.tsx` to use new modules.
- [ ] remove direct ad-hoc `animate(...)` calls outside controller.
- [ ] remove old hook or keep temporary shim, then delete.

### Phase 5: verify

- [ ] run typecheck.
- [ ] run tests.
- [ ] run build.
- [ ] manual verify state transitions: idle -> running -> success/fail/interrupted.

## Acceptance criteria

This spec is complete when:

- motion code uses semantic variant + controller split,
- transient effects are deterministic and cancel-safe,
- reduced motion disables all transient effects consistently,
- no multi-writer motion channel conflicts remain,
- tests cover transition logic and controller cleanup semantics.

## Unresolved questions

None.
