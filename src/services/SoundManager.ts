import * as Clock from "effect/Clock"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Scope from "effect/Scope"
import * as ServiceMap from "effect/ServiceMap"
import * as AtomRegistry from "effect/unstable/reactivity/AtomRegistry"
import { prefersReducedMotionAtom, soundPreferenceAtom } from "@/atoms/visual-effect"
import { soundCueKey, type SoundCue } from "@/lib/examples/sound"

const PENTATONIC_SCALE = ["C", "D", "E", "G", "A"] as const
const RUNNING_NOTES = ["C2", "D2", "E2", "G2"] as const
const FAILURE_NOTES = ["C2", "D#2", "F2", "G#2", "A#2"] as const
const INTERRUPTED_NOTES = ["C5", "D5", "E5", "G5", "A5"] as const
const DEATH_NOTES = ["C1", "D#1", "F1", "G1"] as const
const RESET_NOTES = ["C3", "E3", "G3", "A3"] as const
const CONTROL_NOTES = ["D5", "E5", "G5", "A5", "C6"] as const
const DEDUPE_WINDOW_MS = 60

export interface ToneEngine {
  readonly play: (cue: SoundCue) => Effect.Effect<void>
}

export class SoundManager extends ServiceMap.Service<
  SoundManager,
  {
    readonly play: (cue: SoundCue) => Effect.Effect<void>
    readonly unlock: Effect.Effect<void>
  }
>()("SoundManager", {
  make: Effect.gen(function* () {
    const registry = yield* AtomRegistry.AtomRegistry
    const scope = yield* Effect.scope

    let isUnlocked = false
    const recentCueTimes = new Map<string, number>()
    const loadToneEngine = yield* Effect.cached(makeToneEngine)

    const pruneCueHistory = (nowMillis: number) => {
      const cutoff = nowMillis - DEDUPE_WINDOW_MS * 4
      for (const [key, timestamp] of recentCueTimes) {
        if (timestamp < cutoff) {
          recentCueTimes.delete(key)
        }
      }
    }

    const isSoundEnabled = () => {
      const soundPreference = registry.get(soundPreferenceAtom)
      const prefersReducedMotion = registry.get(prefersReducedMotionAtom)

      // Do not play sounds if the user has explicitly disabled them
      if (soundPreference === "off") {
        return false
      }

      if (soundPreference === "on") {
        return true
      }

      // If the user prefers reduced motion and they've set their sound
      // preference to system, respect their preferences
      return prefersReducedMotion === false
    }

    const isPlayableCue = Effect.fn(function* (cue: SoundCue) {
      const now = yield* Clock.currentTimeMillis
      const key = soundCueKey(cue)
      const previous = recentCueTimes.get(key)
      if (previous !== undefined && now - previous < DEDUPE_WINDOW_MS) {
        return false
      }
      recentCueTimes.set(key, now)
      pruneCueHistory(now)
      return true
    })

    const play = Effect.fn(function* (cue: SoundCue) {
      const soundEnabled = isSoundEnabled()
      if (!soundEnabled) {
        return yield* Effect.void
      }

      // Only attempt to load the tone engine if sound has been enabled
      const toneEngine = yield* Scope.provide(loadToneEngine, scope)

      if (isUnlocked && (yield* isPlayableCue(cue))) {
        return toneEngine.play(cue)
      }

      return yield* Effect.void
    })

    const unlock = Effect.sync(() => {
      isUnlocked = true
    })

    return {
      play,
      unlock,
    } as const
  }),
}) {
  static readonly layer = Layer.effect(this, this.make)
}

const makeToneEngine = Effect.gen(function* () {
  const Tone = yield* Effect.promise(() => import("tone"))
  yield* Effect.promise(() => Tone.start())

  const volume = new Tone.Volume(-12).toDestination()
  const reverb = new Tone.Reverb({ decay: 2.5, wet: 0.25 }).connect(volume)
  const distortion = new Tone.Distortion({ distortion: 0.8, wet: 1 }).connect(volume)

  const running = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "triangle" },
    envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.08 },
  }).connect(reverb)

  const success = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "triangle" },
    envelope: { attack: 0.02, decay: 0.3, sustain: 0.1, release: 1.1 },
  }).connect(reverb)

  const failure = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "sawtooth" },
    envelope: { attack: 0.02, decay: 0.4, sustain: 0.1, release: 0.8 },
  }).connect(reverb)

  const interrupted = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "triangle" },
    envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.04 },
  }).connect(reverb)

  const reset = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "sine" },
    envelope: { attack: 0.004, decay: 0.18, sustain: 0, release: 0.12 },
  }).connect(reverb)

  const death = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "fatsawtooth10" },
    envelope: { attack: 0.01, decay: 0.5, sustain: 0.3, release: 1.5 },
  }).connect(distortion)

  const config = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "triangle" },
    envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 },
  }).connect(reverb)

  const transport = Tone.getTransport()

  if (transport.state !== "started") {
    transport.start()
  }

  const randomItem = <A>(items: ReadonlyArray<A>): A => {
    const index = Math.floor(Math.random() * items.length)
    return items[index] ?? items[0]
  }

  const randomBetween = (min: number, max: number): number => {
    return min + Math.random() * (max - min)
  }

  const randomPentatonicNote = (octaves: ReadonlyArray<number>): string => {
    const note = randomItem(PENTATONIC_SCALE)
    const octave = randomItem(octaves)
    return `${note}${octave}`
  }

  const play = (cue: SoundCue) => {
    const now = Tone.now()
    switch (cue._tag) {
      case "StepRunning": {
        running.triggerAttackRelease(
          randomItem(RUNNING_NOTES),
          randomItem(["32n", "16n"]),
          now,
          randomBetween(0.58, 0.76),
        )
        break
      }
      case "StepSucceeded": {
        const note = randomPentatonicNote([4, 5])
        success.triggerAttackRelease(
          note,
          randomItem(["16n", "8n"]),
          now,
          randomBetween(0.38, 0.52),
        )
        break
      }
      case "StepFailed": {
        failure.triggerAttackRelease(
          randomItem(FAILURE_NOTES),
          randomItem(["8n", "4n"]),
          now,
          randomBetween(0.55, 0.72),
        )
        break
      }
      case "StepInterrupted": {
        interrupted.triggerAttackRelease(
          randomItem(INTERRUPTED_NOTES),
          "32n",
          now,
          randomBetween(0.52, 0.66),
        )
        interrupted.triggerAttackRelease(
          randomItem(INTERRUPTED_NOTES),
          "32n",
          now + randomBetween(0.05, 0.09),
          randomBetween(0.52, 0.66),
        )
        break
      }
      case "StepDied": {
        death.triggerAttackRelease(
          randomPentatonicNote([2, 3]),
          "32n",
          now,
          randomBetween(0.38, 0.5),
        )
        death.triggerAttackRelease(
          randomItem(DEATH_NOTES),
          randomItem(["2n", "1n"]),
          now + randomBetween(0.08, 0.14),
          randomBetween(0.48, 0.6),
        )
        break
      }
      case "ExampleReset": {
        reset.triggerAttackRelease(randomItem(RESET_NOTES), "16n", now, randomBetween(0.52, 0.66))
        reset.triggerAttackRelease(
          randomItem(RESET_NOTES),
          "16n",
          now + randomBetween(0.08, 0.12),
          randomBetween(0.52, 0.66),
        )
        break
      }
      case "ControlChanged": {
        config.triggerAttackRelease(
          randomItem(CONTROL_NOTES),
          randomItem(["32n", "16n"]),
          now,
          randomBetween(0.48, 0.6),
        )
        break
      }
    }
  }

  yield* Effect.addFinalizer(() =>
    Effect.sync(() => {
      running.dispose()
      success.dispose()
      failure.dispose()
      interrupted.dispose()
      reset.dispose()
      death.dispose()
      config.dispose()
      distortion.dispose()
      reverb.dispose()
      volume.dispose()
    }),
  )

  return {
    play,
  } as const
})
