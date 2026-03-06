# Visual Effect Sound Integration Specification

## Intent

This specification defines how sound effects should be integrated into the new home-page interactive Effect visualizations in `website-v4`.

The integration must be purpose-built for the new architecture. It must treat the current `defineExample(...)` model, `VisualEffectManager`, and Effect Atom runtime as the source of truth. It must not port the old website's `TaskSounds` singleton directly.

The implementation should preserve the strengths of the new system:

1. Example definitions stay declarative and eager.
2. Runtime execution stays driven by Effect spans and state transitions.
3. React components remain presentation-focused.
4. Sound behavior is semantic, deterministic, and testable.

## Goals

- Add short, expressive sound cues for example execution.
- Keep the integration idiomatic to Effect v4 and Effect Atom.
- Ensure sounds follow semantic execution events, not visual side effects.
- Support concurrency without glitchy duplication or audio storms.
- Respect browser autoplay rules, reduced-motion preferences, and explicit mute state.
- Make the system extensible for future example categories such as `schedule` and `ref-scope`.

## Non-Goals

- Porting the old `TaskSounds` class as-is.
- Driving audio from React animation hooks or DOM transitions.
- Adding full music composition, looping ambience, or timeline editing.
- Persisting per-example sound mixes.
- Supporting server-side audio rendering.

## Mandatory References Before Implementation

If this specification is implemented from a fresh agent session, the implementation pass must read these files first.

### Current website files

- `src/components/landing/sections/Examples.astro`
- `src/components/landing/examples/VisualEffects.tsx`
- `src/components/landing/examples/VisualEffect.tsx`
- `src/components/landing/examples/VisualEffectProvider.tsx`
- `src/components/landing/examples/VisualEffectControls.tsx`
- `src/components/landing/examples/VisualEffectConfigPanel.tsx`
- `src/components/landing/examples/VisualEffectNode.tsx`
- `src/components/landing/examples/VisualEffectControlsIcon.tsx`
- `src/hooks/animation/useNodeTransitionFlags.ts`
- `src/hooks/animation/useEffectNodeAnimationController.ts`
- `src/atoms/visual-effect.ts`
- `src/lib/examples/catalog.ts`
- `src/lib/examples/catalog/effect-all.tsx`
- `src/lib/examples/catalog/effect-race.tsx`
- `src/lib/examples/catalog/effect-die.tsx`
- `src/lib/examples/constructors.ts`
- `src/lib/examples/domain.ts`
- `src/services/VisualEffectManager.ts`
- `package.json`

### Old website references

- `.repos/landing/src/sounds/TaskSounds.ts`
- `.repos/landing/src/VisualEffect.ts`
- `.repos/landing/src/VisualRef.ts`
- `.repos/landing/src/VisualScope.ts`
- `.repos/landing/src/examples/effect-all.tsx`
- `.repos/landing/src/components/ui/VolumeToggle.tsx`

### Effect v4 / Atom references

- `.repos/effect-smol/LLMS.md`
- `.repos/effect-smol/packages/atom/react/test/index.test.tsx`
- `.repos/effect-smol/packages/effect/test/reactivity/Atom.test.ts`

### Tone references

- `.repos/tone/README.md`
- `.repos/tone/Tone/index.ts`
- `.repos/tone/Tone/core/Global.ts`

These references are mandatory because this spec depends on the current runtime shape, old cue language, Atom runtime patterns, and Tone's unlock semantics.

## Current Invariants

Implementation must preserve these current repo invariants.

1. Landing examples are rendered via `client:load` from `src/components/landing/sections/Examples.astro`, not `client:only`.
2. `defineExample(...)` in `src/lib/examples/constructors.ts` executes eagerly and creates static `steps`, `controls`, and `program`.
3. `ExampleDefinition.key` is currently generated with `crypto.randomUUID()` and is runtime-local, not a stable content id.
4. `VisualEffectManager` is currently the only execution authority and writes Atom state for both example and steps.
5. `useControlWrite(...)` in `src/components/landing/examples/VisualEffectProvider.tsx` is the current control mutation boundary.
6. `useNodeTransitionFlags(...)` and `useEffectNodeAnimationController(...)` are visual derivations only.

The sound integration must fit these invariants instead of redesigning them.

## Current Architecture Summary

The current visual example system already has a clear semantic/runtime boundary.

- `src/lib/examples/constructors.ts` builds `ExampleDefinition` eagerly and wraps steps in tracing spans via `Effect.withSpan(...)`.
- `src/services/VisualEffectManager.ts` is the runtime authority. It updates `exampleStateAtom(...)` and `stepStateAtom(...)` from traced Effect execution.
- `src/components/landing/examples/VisualEffectProvider.tsx` exposes React hooks for starting, stopping, resetting, and reading Atom-backed state through `Atom.runtime(...)`.
- `src/hooks/animation/useNodeTransitionFlags.ts` and `src/hooks/animation/useEffectNodeAnimationController.ts` are visual-only derivations. They are not the runtime source of truth.

This is the right shape for sound integration. Audio should attach to the semantic runtime layer, then flow outward to UI.

## Old Website Reference

The old website is useful for sound design ideas, but not for architecture.

- `.repos/landing/src/sounds/TaskSounds.ts` contains the cue palette, Tone synth setup, harmony window, volume control, and mute behavior.
- `.repos/landing/src/VisualEffect.ts` triggers sounds directly from imperative state transitions inside the visual model.
- `.repos/landing/src/examples/effect-all.tsx` plays configuration-change sounds directly from UI callbacks.
- `.repos/landing/src/components/ui/VolumeToggle.tsx` demonstrates the unlock/mute interaction.

The new site should reuse the old musical intent where it still fits, but not the coupling pattern.

## Tone Constraints

Tone.js has two integration constraints that must shape the design.

1. `Tone.start()` must be called from a real user gesture such as a click or keypress.
2. Tone objects should not be created eagerly at module top level because Astro/Vite will evaluate modules across SSR and client boundaries.

Therefore:

- `tone` must be loaded with a dynamic import from client-only code paths.
- Audio engine allocation must happen lazily after the first unlock gesture.
- The rest of the application must be able to publish sound-worthy events even before audio is unlocked, without crashing or importing Tone.

## Design Principles

1. Sound must be driven by semantic events, not animation state.
2. Tone lifecycle must be owned by an Effect service.
3. User preferences must be represented with atoms so React and services share one source of truth.
4. The audio engine must be global to the interactive examples island, not recreated per example card.
5. Cues must be small and layered enough to survive concurrent example runs.
6. Duplicate-trigger avoidance must be part of the subsystem, not left to individual components.

## High-Level Design

The recommended design adds four new layers:

1. A semantic event ADT for runtime sound-worthy events.
2. A lightweight event bus service for publishing those events.
3. A `SoundManager` service that owns Tone lifecycle, cue mapping, dedupe, and playback.
4. Atom-backed sound preference state and React hooks for the examples UI.

In this model:

- `VisualEffectManager` publishes semantic events.
- `useControlWrite(...)` publishes configuration-change events.
- `SoundManager` subscribes to the event bus and decides whether to play a cue.
- React components only unlock audio and expose user controls.

## Why Event-Driven Instead Of React-Driven

There are three possible trigger sources.

### Option A: React transition flags

This means using `useNodeTransitionFlags(...)` or animation hooks as the sound trigger source.

This is not recommended because:

- React transitions are downstream from runtime state.
- Remounts can replay sounds incorrectly.
- Reduced-motion branches can change visual behavior without changing execution semantics.
- UI-only code cannot easily emit control-change, reset, notification, or future scope/ref events.

### Option B: Call `SoundManager` directly from `VisualEffectManager`

This is better than React-driven sound, but it still couples execution and playback too tightly.

It makes future producers awkward, especially:

- control changes from `useControlWrite(...)`,
- future `Ref` and `Scope` runtime helpers,
- possible analytics or debug tooling that may also want the same event stream.

### Option C: Publish semantic events to a dedicated bus

This is the recommended design.

It keeps responsibilities clean:

- runtime modules publish facts,
- sound modules interpret facts,
- UI modules manage unlock and preference state.

This is the most Effect-idiomatic option because it cleanly separates domain events from side effects.

## Proposed Modules

Implementation should produce or modify at least these modules.

### New files

- `src/lib/examples/sound.ts`
  - Sound ADTs and helpers.
- `src/atoms/visual-effect-sound.ts`
  - Atom-backed sound preference and derived state.
- `src/services/VisualEffectEventBus.ts`
  - PubSub-backed semantic event service.
- `src/services/SoundManager.ts`
  - Tone lifecycle, event consumer, dedupe, cue playback.
- `src/components/landing/examples/VisualEffectSoundToggle.tsx`
  - Header-level sound toggle for the examples island.
- `src/components/landing/examples/visual-effects-runtime.ts`
  - Shared `Atom.runtime(...)` for manager + event bus + sound manager.

### Existing files to modify

- `package.json`
  - Add `tone`.
- `src/services/VisualEffectManager.ts`
  - Publish semantic events from example and step transitions.
- `src/components/landing/examples/VisualEffectProvider.tsx`
  - Switch to the shared runtime and expose sound hooks/actions.
- `src/components/landing/examples/VisualEffectControls.tsx`
  - Unlock audio from the same user gesture as run/stop/reset.
- `src/components/landing/examples/VisualEffects.tsx`
  - Mount and place the sound toggle.
- `src/components/landing/examples/VisualEffectConfigPanel.tsx`
  - No sound logic is required here, but layout may need room for global sound UI.

## Implementation Output File Plan

Implementation should produce or modify at least these files.

- `package.json`
- `src/atoms/visual-effect-sound.ts`
- `src/lib/examples/sound.ts`
- `src/services/VisualEffectEventBus.ts`
- `src/services/SoundManager.ts`
- `src/components/landing/examples/visual-effects-runtime.ts`
- `src/components/landing/examples/VisualEffectProvider.tsx`
- `src/components/landing/examples/VisualEffectControls.tsx`
- `src/components/landing/examples/VisualEffects.tsx`
- `src/services/VisualEffectManager.ts`
- `src/lib/examples/catalog/effect-all.tsx`

If the implementation uses different filenames, it must preserve the same separation of concerns.

## Domain Model

### Sound preference

The preference model should distinguish explicit user intent from system behavior.

```ts
export type SoundPreference = "system" | "on" | "off"

export interface SoundSettings {
  readonly preference: SoundPreference
  readonly unlocked: boolean
  readonly reducedMotion: boolean
  readonly enabled: boolean
}
```

`"system"` means the site follows the conservative default. For this integration, the conservative default is:

- sound stays off until the user has unlocked audio, and
- if reduced motion is enabled, sound remains off unless the user explicitly switches to `"on"`.

This avoids surprising audio for users who already asked the browser for a lower-stimulation experience.

### Visual effect sound events

The sound system should consume semantic events, not raw React state.

```ts
import type { VisualEffectState } from "@/lib/examples/domain"

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
```

This event model is intentionally narrow. It covers current needs and leaves room for future tags such as `RefUpdated`, `FinalizerRegistered`, `FinalizerStarted`, and `FinalizerCompleted` without destabilizing the initial design.

`exampleKey` stays in the runtime event model even if the UI currently allows only one active example at a time. `stepId` values are local to an example today, so the additional identity keeps events unambiguous and makes tests and debug output simpler.

### Sound cues

The mapping layer should translate domain events into cue-level playback instructions.

```ts
export type SoundCue =
  | { readonly _tag: "StepRunning"; readonly exampleKey: string; readonly stepId: string }
  | { readonly _tag: "StepSucceeded"; readonly exampleKey: string; readonly stepId: string }
  | { readonly _tag: "StepFailed"; readonly exampleKey: string; readonly stepId: string }
  | { readonly _tag: "StepInterrupted"; readonly exampleKey: string; readonly stepId: string }
  | { readonly _tag: "StepDied"; readonly exampleKey: string; readonly stepId: string }
  | { readonly _tag: "ExampleReset"; readonly exampleKey: string }
  | { readonly _tag: "ControlChanged"; readonly exampleKey: string; readonly controlId: string }
  | { readonly _tag: "Notification"; readonly exampleKey: string; readonly stepId: string }
```

Keeping `SoundCue` separate from `VisualEffectSoundEvent` lets the system evolve musical decisions without rewriting runtime event producers.

## Event Bus Service

The event bus should be a small service with publish and subscribe responsibilities.

```ts
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as PubSub from "effect/PubSub"
import * as ServiceMap from "effect/ServiceMap"
import * as Stream from "effect/Stream"

export class VisualEffectEventBus extends ServiceMap.Service<
  VisualEffectEventBus,
  {
    readonly publish: (event: VisualEffectSoundEvent) => Effect.Effect<void>
    readonly events: Stream.Stream<VisualEffectSoundEvent>
  }
>()("website-v4/services/VisualEffectEventBus") {}

export const makeVisualEffectEventBus = Effect.gen(function* () {
  const pubsub = yield* PubSub.sliding<VisualEffectSoundEvent>(128)

  return VisualEffectEventBus.of({
    publish: (event) => PubSub.publish(pubsub, event),
    events: Stream.fromPubSub(pubsub),
  })
})

export const visualEffectEventBusLayer = Layer.effect(
  VisualEffectEventBus,
  makeVisualEffectEventBus,
)
```

The bus should be in-memory, bounded, and lossy under pressure. Sound does not require perfect replay. It requires responsive, low-latency behavior.

## Atom State For Sound Settings

Sound settings should be represented as normal atoms so React components and Effect services can observe the same values.

```ts
import * as Atom from "effect/unstable/reactivity/Atom"
import { pipe } from "effect/Function"

export const soundPreferenceAtom = pipe(
  Atom.make<SoundPreference>("system"),
  Atom.withLabel("visual-effects:sound-preference"),
  Atom.keepAlive,
)

export const soundUnlockedAtom = pipe(
  Atom.make(false),
  Atom.withLabel("visual-effects:sound-unlocked"),
  Atom.keepAlive,
)

export const soundReducedMotionAtom = pipe(
  Atom.make(false),
  Atom.withLabel("visual-effects:sound-reduced-motion"),
  Atom.keepAlive,
)

export const soundEnabledAtom = pipe(
  Atom.make((get) => {
    const preference = get(soundPreferenceAtom)
    const unlocked = get(soundUnlockedAtom)
    const reducedMotion = get(soundReducedMotionAtom)

    if (!unlocked) {
      return false
    }

    if (preference === "off") {
      return false
    }

    if (preference === "on") {
      return true
    }

    return reducedMotion === false
  }),
  Atom.withLabel("visual-effects:sound-enabled"),
  Atom.keepAlive,
)
```

This derived model gives the UI a precise answer to three different questions:

- what the user asked for,
- whether the browser has been unlocked,
- whether sound is actually active.

The implementation should also expose a small client-only persistence helper that reads and writes `soundPreferenceAtom` using `localStorage`, but does not persist `soundUnlockedAtom`.

## Sound Manager Service

`SoundManager` should own all Tone-specific behavior.

Responsibilities:

- lazy dynamic import of `tone`,
- `Tone.start()` unlock handling,
- Tone node allocation and disposal,
- event consumption,
- event-to-cue mapping,
- dedupe and rate limiting,
- shared harmony state for overlapping step cues,
- volume routing.

It should not know anything about React layout or visual animation hooks.

### Suggested service shape

```ts
import * as Effect from "effect/Effect"
import * as ServiceMap from "effect/ServiceMap"

export class SoundManager extends ServiceMap.Service<
  SoundManager,
  {
    readonly unlockFromGesture: Effect.Effect<void>
    readonly setPreference: (preference: SoundPreference) => Effect.Effect<void>
    readonly syncReducedMotion: (reduced: boolean) => Effect.Effect<void>
  }
>()("website-v4/services/SoundManager") {}
```

The public API should stay intentionally small. React should not call `playCue(...)` directly.

The implementation should expose a layer for this service. That layer should depend on `VisualEffectEventBus` and any client-safe state helpers it needs, then start its event-consumer fiber from within the managed service initialization.

### Tone engine allocation

Tone nodes should be allocated lazily and disposed with `Effect.acquireRelease(...)`.

```ts
import * as Effect from "effect/Effect"

interface ToneEngine {
  readonly playCue: (cue: SoundCue) => Effect.Effect<void>
}

const makeToneEngine = Effect.acquireRelease(
  Effect.promise(async () => {
    const Tone = await import("tone")
    await Tone.start()

    const volume = new Tone.Volume(-12).toDestination()
    const reverb = new Tone.Reverb({ decay: 2.5, wet: 0.25 }).connect(volume)
    const distortion = new Tone.Distortion({ distortion: 0.8, wet: 1 }).connect(volume)

    const running = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: { attack: 0.002, decay: 0.08, sustain: 0, release: 0.1 },
    }).connect(reverb)

    const success = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.02, decay: 0.3, sustain: 0.1, release: 1.1 },
    }).connect(reverb)

    const failure = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "fatsawtooth10" },
      envelope: { attack: 0.01, decay: 0.5, sustain: 0.2, release: 1.3 },
    }).connect(distortion)

    const transport = Tone.getTransport()
    if (transport.state !== "started") {
      transport.start()
    }

    return {
      playCue: (cue) =>
        Effect.sync(() => {
          const now = Tone.now()
          switch (cue._tag) {
            case "StepRunning":
              running.triggerAttackRelease("E4", "32n", now, 0.25)
              return
            case "StepSucceeded":
              success.triggerAttackRelease("G4", "8n", now, 0.45)
              return
            case "StepDied":
              failure.triggerAttackRelease("D#3", "32n", now, 0.45)
              failure.triggerAttackRelease("C1", "1n", now + 0.1, 0.55)
              return
            default:
              return
          }
        }),
    } satisfies ToneEngine
  }),
  (engine) =>
    Effect.sync(() => {
      void engine
    }),
)
```

The actual implementation should keep references to the allocated Tone nodes so they can all be disposed explicitly in the release action.

The release action must dispose only the nodes created by this subsystem. It must not dispose Tone's global context or global transport singleton.

## Recommended Cue Palette

The old website's musical language is a strong starting point. The new system should keep the same overall emotional map while simplifying where possible.

### Core cues for phase one

- `StepRunning`
  - A short, soft sine or triangle blip.
  - It should use a rotating pentatonic note selection window so concurrent steps sound intentional.
- `StepSucceeded`
  - A brighter success cue. It can reuse the old triad/pentatonic idea.
- `StepFailed`
  - A low, short bass cue.
- `StepInterrupted`
  - Two rapid ascending beeps.
- `StepDied`
  - A distorted stab followed by a low rumble.
- `ExampleReset`
  - A descending two-note cue.
- `ControlChanged`
  - A short pleasant confirmation chime.
- `Notification`
  - A gentle two-note ping.

### Reserved future cues

- `RefUpdated`
- `FinalizerCreated`
- `FinalizerRunning`
- `FinalizerCompleted`

These should not be part of the initial implementation unless the new site already has producers for them.

## Cue Mapping Rules

The mapping layer should prevent noisy duplication.

### Step transitions

- `Idle -> Running` maps to `StepRunning`.
- `Running -> Succeeded` maps to `StepSucceeded`.
- `Running -> Failed` maps to `StepFailed`.
- `Running -> Interrupted` maps to `StepInterrupted`.
- `Running -> Died` maps to `StepDied`.

### Example transitions

Example transitions should be used sparingly.

- `ExampleReset` always maps to the reset cue.
- `ExampleTransition -> Running` should not emit a cue when the example has tracked steps, because the step-start cues already carry the run feel.
- `ExampleTransition -> Running` may emit a subtle run cue only for examples with zero steps.
- `ExampleTransition` terminal states should usually not emit a second success or failure cue, because the result node often lands at the same time as the step nodes and would double-fire the soundscape.

### Control changes

- `ControlChanged` should emit exactly one config cue per user action.
- Control changes should never emit from the manager and the UI at the same time.
- The canonical producer should be `useControlWrite(...)` because it already knows when a control write actually happened.

## Integration Points In Existing Code

### `src/services/VisualEffectManager.ts`

This module is the semantic source of execution truth and must publish sound events.

It should publish:

- `StepTransition` when a step enters `Running`.
- `StepTransition` when a step reaches a terminal state.
- `ExampleTransition` when the example enters `Running`.
- `ExampleTransition` when the example reaches a terminal state.
- `ExampleReset` when `reset(...)` is executed.
- `NotificationRaised` when tracer events or sleep markers update a running step notification.

A helper should centralize transition publishing so the event logic is not duplicated.

```ts
const publishStepTransition = (
  bus: VisualEffectEventBus["Service"],
  step: StepDefinition,
  previous: VisualEffectState,
  current: VisualEffectState,
  example: ExampleDefinition,
) => {
  if (previous._tag === current._tag) {
    return Effect.void
  }

  return bus.publish({
    _tag: "StepTransition",
    exampleKey: example.key,
    stepId: step.id,
    stepLabel: step.label,
    previous: previous._tag,
    current: current._tag,
  })
}
```

The exact helper shape may differ, but the rule must hold: publish only on semantic tag changes.

Additional implementation notes for this file:

- Keep `start(...)`, `stop(...)`, and `reset(...)` as the only public manager methods.
- Do not make `SoundManager` a direct dependency of `VisualEffectManager`; depend on `VisualEffectEventBus` instead.
- Do not change the current `ExampleControlSnapshot` contract just for sound.
- Keep event publishing best-effort so failed sound infrastructure cannot break example execution.
- `stop(...)` currently interrupts by removing from `FiberMap`; terminal `Interrupted` state must still produce the correct semantic transition event through the existing state flow.

### `src/components/landing/examples/VisualEffectProvider.tsx`

This module currently owns the Atom runtime bridge. It should switch from a manager-only runtime to a shared visual-effects runtime that includes sound services.

Recommended structure:

```ts
import * as Layer from "effect/Layer"
import * as Atom from "effect/unstable/reactivity/Atom"

const visualEffectsLayer = Layer.mergeAll(
  visualEffectEventBusLayer,
  soundManagerLayer,
  VisualEffectManager.layer,
)

export const visualEffectsRuntime = Atom.runtime(visualEffectsLayer)
```

This runtime module should also expose:

- `unlockSoundAtom`,
- `setSoundPreferenceAtom`,
- `syncReducedMotionAtom`,
- `useSoundSettings()`,
- `useSoundControls()`.

Additional implementation notes for this file:

- Keep `useExampleControls()`, `useExampleState()`, and `useStepState()` working as they do today.
- `useControlWrite(...)` is the canonical place to publish `ControlChanged`.
- Publish `ControlChanged` only when the new value differs from the current atom value.
- Preserve the current control `changePolicy` behavior after the event is published.

### `src/components/landing/examples/VisualEffectControls.tsx`

This module should call `unlockFromGesture` at the start of the click handler, before branching into `start`, `stop`, or `reset`.

```ts
const sound = useSoundControls()

const handleClick = () => {
  sound.unlockFromGesture()

  if (isRunning) {
    controls.stop()
  } else if (isResettable) {
    controls.reset()
  } else {
    controls.start()
  }
}
```

This preserves the browser gesture requirement without making run behavior depend on sound success.

The implementation should not add any direct Tone code here. This component should only call runtime actions.

### `useControlWrite(...)`

`useControlWrite(...)` should publish `ControlChanged` when a control value actually changes.

It should not emit if the next value is equal to the current value.

It should emit after the write succeeds and before any reset side effect is triggered, so the config cue corresponds to the user's actual action.

### Files that must stay sound-free

The following files must not become sound trigger sources:

- `src/components/landing/examples/VisualEffect.tsx`
- `src/components/landing/examples/VisualEffectNode.tsx`
- `src/components/landing/examples/VisualEffectControlsIcon.tsx`
- `src/hooks/animation/useNodeTransitionFlags.ts`
- `src/hooks/animation/useEffectNodeAnimationController.ts`

These files may consume state that was influenced by sound preferences, but they must not publish playback cues or import Tone.

## Reduced Motion Policy

Reduced motion must be treated as a strong preference, but not as a hard ban.

Policy:

- On first load, sound preference defaults to `"system"`.
- If `prefers-reduced-motion: reduce` is active and preference is `"system"`, sound remains effectively off.
- If the user explicitly switches preference to `"on"`, sound may play even when reduced motion is active.
- If the user switches preference to `"off"`, sound never plays.

This balances accessibility with explicit user control.

`SoundManager.syncReducedMotion(...)` should keep the atom in sync with `useReducedMotion()` from `motion/react` or a `matchMedia(...)` listener.

## Persistence Policy

Sound preference should persist across reloads.

Recommended behavior:

- Persist only `SoundPreference`.
- Do not persist `unlocked`, because the browser gesture requirement is session-scoped.
- Derive `enabled` from current atoms instead of storing it.

Persistence can be implemented with `localStorage` from a small client-only helper or from an Effect wrapper inside `SoundManager`. The implementation should keep the boundary narrow and resilient to missing browser APIs.

Suggested storage key:

```ts
export const visualEffectSoundPreferenceStorageKey = "effect-website:visual-effect-sound"
```

## SSR And Client Boundary Rules

These rules are mandatory.

1. Do not import `tone` at module top level in any file under `src/`.
2. Do not construct Tone objects during SSR.
3. Do not read `window`, `document`, `localStorage`, or `matchMedia` outside client-safe code paths.
4. Keep the examples island usable when Tone fails to load.

Important nuance for this repo:

- The examples surface is mounted with `client:load` in `src/components/landing/sections/Examples.astro`.
- `client:load` still participates in Astro's server/build pipeline.
- A direct top-level `import "tone"` may happen to work, but this specification does not assume it is the safe default.
- Dynamic import inside the sound service is the recommended default because it keeps the boundary explicit and lowers bundle/SSR risk.

If Tone fails to import or unlock, the system should degrade to silent mode and keep the visual runtime functioning normally.

## Dedupe And Rate Limiting

Concurrent examples and `Effect.all(...)` can create many near-simultaneous events. The subsystem must smooth them.

### Rules

- Publishers must emit only when the semantic tag changes.
- `SoundManager` must maintain a short dedupe window keyed by cue identity.
- Running cues should be globally rate-limited.
- Success cues should use a harmony window so simultaneous completions sound chordal instead of random.

### Recommended defaults

- Running cue throttle: 60 to 100 ms.
- Generic duplicate suppression window: 40 to 80 ms for identical cue keys.
- Chord window for success cues: 80 to 120 ms.

The old `TaskSounds` chord-window behavior is worth retaining because it makes concurrent success notes sound intentional.

## Error Handling Rules

Sound playback must never break example execution.

Rules:

- All event publishing from runtime services should be best-effort and non-fatal.
- Tone import or unlock failures should be trapped inside the sound subsystem and converted to silent no-op behavior.
- The app must not surface unhandled promise rejections from sound playback.
- Sound should not participate in example success or failure semantics.

In practice, this means sound errors should be logged only in development and ignored in production.

## UI Behavior

### Sound toggle

The examples island should expose one global sound toggle, not one toggle per example card.

Recommended states:

- `system`
- `on`
- `off`

If a three-state control is visually too heavy, the UI may present a binary `on/off` toggle while treating the initial state as `system` until the first user decision. The stored state should still use the richer `SoundPreference` model.

### Placement

The best placement is the examples surface header area, near the category/example switching controls but outside the individual run button. The control should apply to the whole examples island.

### Unlock interaction

Unlock should happen implicitly when the user:

- runs an example,
- toggles sound on,
- or otherwise performs a direct sound-related action.

The user should not be forced through a separate "Enable audio" gate.

## Recommended Implementation Sequence

### Phase 1: Foundation

1. Add `tone` to `package.json`.
2. Define `SoundPreference`, `SoundSettings`, `VisualEffectSoundEvent`, and `SoundCue`.
3. Add `soundPreferenceAtom`, `soundUnlockedAtom`, `soundReducedMotionAtom`, and `soundEnabledAtom`.
4. Implement `VisualEffectEventBus`.

### Phase 2: Runtime integration

1. Create a shared visual-effects runtime layer.
2. Update `VisualEffectManager` to publish semantic events.
3. Update `useControlWrite(...)` to publish `ControlChanged` events.
4. Add reduced-motion synchronization.

### Phase 3: Tone engine

1. Implement `SoundManager` with lazy dynamic import.
2. Allocate synths, routing nodes, and harmony bookkeeping after unlock.
3. Add event-to-cue mapping.
4. Add dedupe and rate-limiting logic.

### Phase 4: UI

1. Add `VisualEffectSoundToggle.tsx`.
2. Expose sound hooks from the shared runtime.
3. Call `unlockFromGesture` from the run button and sound toggle.
4. Persist preference across reloads.

### Phase 5: Verification

1. Verify sound stays silent before unlock.
2. Verify run button unlocks sound and still starts the example even if Tone fails.
3. Verify concurrent examples sound coherent, not duplicated.
4. Verify reduced-motion defaults behave correctly.
5. Verify SSR/build still succeeds.

## Testing Plan

### Unit tests

- Test cue mapping from `VisualEffectSoundEvent` to `SoundCue`.
- Test `soundEnabledAtom` derivation logic.
- Test dedupe/rate-limit behavior with rapid duplicate events.
- Test that `ControlChanged` only emits when value actually changes.

### Integration tests

- Test that `VisualEffectManager.start(...)` publishes `ExampleTransition` and step transitions.
- Test that `reset(...)` publishes one `ExampleReset` event.
- Test that `Interrupted` state produces the expected event path.
- Test that control changes trigger the event even when they also trigger a reset.

### Manual verification

- Run `Effect.all` sequential and concurrent modes and confirm the sound palette remains pleasant.
- Run `Effect.race` repeatedly and confirm interrupted cues are not doubled.
- Run `Effect.die` and confirm the defect cue fires once.
- Turn sound off, reload, and confirm preference persists.
- Test Safari and Chrome autoplay behavior.

## Detailed Task Breakdown

### 1. Dependency and file scaffolding

- Add `tone` to `package.json` and install it with the existing package manager.
- Create `src/lib/examples/sound.ts` for shared types.
- Create `src/atoms/visual-effect-sound.ts` for atom state.
- Create `src/services/VisualEffectEventBus.ts` and `src/services/SoundManager.ts`.
- Create `src/components/landing/examples/visual-effects-runtime.ts` for the merged `Atom.runtime(...)`.

### 2. Semantic event production

- Add helpers in `src/services/VisualEffectManager.ts` to publish `StepTransition`, `ExampleTransition`, `ExampleReset`, and `NotificationRaised`.
- Ensure events are emitted only when the state tag changes.
- Keep event publishing non-fatal so runtime behavior is never blocked by sound concerns.
- Do not publish from visual animation hooks or presentation components.

### 3. Sound settings and React integration

- Expose hooks for reading sound settings with `useAtomValue(...)`.
- Expose actions for unlocking audio and setting preference with `runtime.fn(...)`.
- Sync reduced-motion state into `soundReducedMotionAtom` from a client-safe effect.
- Persist `SoundPreference` and restore it on mount.

### 4. Tone engine implementation

- Dynamically import `tone` only after a user gesture.
- Allocate one global engine for the examples island.
- Recreate the old palette in a simplified, modular form: running, success, failure, interrupted, death, reset, config, and notification.
- Dispose all created Tone nodes during cleanup.

### 5. Cue mapping and dedupe

- Add a pure event-to-cue mapper.
- Add a dedupe key strategy for cues.
- Add a harmony window for success cues.
- Add throttle logic for running cues under heavy concurrency.

### 6. UI work

- Add a global sound toggle component.
- Place it near the interactive examples controls.
- Call `unlockFromGesture` from the same click handler as example run/reset/stop actions.
- Provide a brief tooltip or accessible label that explains the current sound state.

### 7. Verification and cleanup

- Run typecheck, lint, and build.
- Verify no server-side import of `tone` slips into the bundle entry path.
- Verify sound failures degrade silently.
- Document any intentionally deferred future cues for `Ref` and `Scope`.

## Fresh-Session Implementation Checklist

This checklist is here so a new agent can implement the work without prior context.

1. Read all files listed in "Mandatory References Before Implementation".
2. Confirm the examples surface is still mounted with `client:load`.
3. Confirm `VisualEffectManager` is still the sole execution authority.
4. Confirm `useControlWrite(...)` still owns control writes.
5. Add `tone`.
6. Create sound types and atoms.
7. Create the event bus.
8. Create the sound manager and its layer.
9. Merge the runtime into a shared `Atom.runtime(...)` module.
10. Publish events from `VisualEffectManager` and `useControlWrite(...)`.
11. Add the sound toggle and unlock wiring.
12. Add persistence and reduced-motion sync.
13. Verify typecheck, lint, and build.

If any of the assumptions in steps 2 to 4 have changed, implementation should stop and re-evaluate the design before editing code.

## Acceptance Criteria

The integration is complete when all of the following are true.

- Interactive examples can play sound without breaking SSR or build behavior.
- Sound only starts after a real user gesture.
- Sound settings are shared across the examples island through Effect Atom state.
- Runtime modules emit semantic events independent of React animation code.
- `SoundManager` owns Tone lifecycle and playback.
- Reset, control changes, success, failure, interruption, and defects each have distinct cues.
- Concurrent example runs sound intentional instead of duplicated or chaotic.
- Reduced-motion users are not opted into sound by surprise.
- The system is ready for future `Ref` and `Scope` cues without redesign.

## Final Recommendation

The correct integration point is the semantic runtime, not the animation layer.

The new website already has the right architecture for this: example definitions are static, execution flows through `VisualEffectManager`, and React reads state through Effect Atom. Sound should extend that design instead of bypassing it.

In short:

- publish semantic events from runtime and control writes,
- consume them in a dedicated `SoundManager`,
- keep Tone lazy and client-only,
- represent preferences with atoms,
- and let the UI do only unlock and preference presentation.

That approach preserves the clarity of the new system while bringing back the expressiveness of the old site's sound design.
