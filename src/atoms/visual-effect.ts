import * as BrowserKeyValueStore from "@effect/platform-browser/BrowserKeyValueStore"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Atom from "effect/unstable/reactivity/Atom"
import type { ExampleDefinition } from "@/lib/examples/constructors"
import { SoundPreference, type SoundSettings } from "@/lib/examples/sound"
import { SoundManager } from "@/services/SoundManager"
import { VisualEffectEventBus, visualEffectEventBusLayer } from "@/services/VisualEffectEventBus"
import { VisualEffectManager } from "@/services/VisualEffectManager"

// =============================================================================
// Visual Effect Atom Runtime
// =============================================================================

const VisualEffectsLayer = Layer.mergeAll(SoundManager.layer, VisualEffectManager.layer).pipe(
  Layer.provideMerge(visualEffectEventBusLayer),
)

export const visualEffectsRuntime = Atom.runtime(VisualEffectsLayer)

// =============================================================================
// Visual Effect Controls
// =============================================================================

export const startExampleAtom = visualEffectsRuntime.fn<ExampleDefinition>()(
  (example) => VisualEffectManager.use((_) => _.start(example)),
  { concurrent: true },
)

export const stopExampleAtom = visualEffectsRuntime.fn<ExampleDefinition>()(
  (example) => VisualEffectManager.use((_) => _.stop(example)),
  { concurrent: true },
)

export const resetExampleAtom = visualEffectsRuntime.fn<ExampleDefinition>()(
  (example) => VisualEffectManager.use((_) => _.reset(example)),
  { concurrent: true },
)

export interface ControlWriteSideEffectInput {
  readonly example: ExampleDefinition
  readonly controlId: string
  readonly shouldReset: boolean
}

export const controlWriteSideEffectsAtom = visualEffectsRuntime.fn<ControlWriteSideEffectInput>()(
  ({ example, controlId, shouldReset }) =>
    VisualEffectEventBus.use((eventBus) =>
      Effect.andThen(
        eventBus.publish({
          _tag: "ControlChanged",
          exampleKey: example.key,
          controlId,
        }),
        shouldReset ? VisualEffectManager.use((manager) => manager.reset(example)) : Effect.void,
      ),
    ),
  { concurrent: true },
)

// =============================================================================
// Sound Controls
// =============================================================================

export const unlockSoundAtom = visualEffectsRuntime.fn<void>()(
  Effect.fnUntraced(function* (_: void, get: Atom.FnContext) {
    yield* SoundManager.use((_) => _.unlock)
    get.set(soundUnlockedAtom, true)
  }),
  { concurrent: true },
)

const kvsRuntime = Atom.runtime(BrowserKeyValueStore.layerLocalStorage)

export const soundPreferenceAtom = Atom.kvs({
  runtime: kvsRuntime,
  key: "effect-website:visual-effect:sound-preference",
  schema: SoundPreference,
  defaultValue: () => "system" as const,
}).pipe(Atom.withLabel("visual-effects:sound-preference"))

export const soundUnlockedAtom = Atom.make(false).pipe(
  Atom.withLabel("visual-effects:sound-unlocked"),
)

export const soundSettingsAtom = Atom.make<SoundSettings>((get) => ({
  preference: get(soundPreferenceAtom),
  unlocked: get(soundUnlockedAtom),
  enabled: get(soundEnabledAtom),
})).pipe(Atom.withLabel("visual-effects:sound-settings"))

export const soundEnabledAtom = Atom.make((get) => {
  const preference = get(soundPreferenceAtom)
  const unlocked = get(soundUnlockedAtom)
  const prefersReducedMotion = get(prefersReducedMotionAtom)
  if (!unlocked) {
    return false
  }
  if (preference === "off") {
    return false
  }
  if (preference === "on") {
    return true
  }
  return !prefersReducedMotion
}).pipe(Atom.withLabel("visual-effects:sound-enabled"), Atom.keepAlive)

// =============================================================================
// Prefers Reduced Motion
// =============================================================================

export const prefersReducedMotionAtom = Atom.make((get) => {
  if (typeof window === "undefined") {
    return false
  }

  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")

  const syncReducedMotion = () => {
    get.setSelf(mediaQuery.matches)
  }

  window.addEventListener("change", syncReducedMotion)
  get.addFinalizer(() => window.removeEventListener("change", syncReducedMotion))

  return mediaQuery.matches
})
