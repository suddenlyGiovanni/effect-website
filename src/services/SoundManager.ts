import * as Clock from "effect/Clock"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Scope from "effect/Scope"
import * as Semaphore from "effect/Semaphore"
import * as ServiceMap from "effect/ServiceMap"
import * as Stream from "effect/Stream"
import * as AtomRegistry from "effect/unstable/reactivity/AtomRegistry"
import { prefersReducedMotionAtom, soundPreferenceAtom } from "@/atoms/visual-effect"
import {
  soundCueKey,
  toSoundCue,
  type SoundCue,
  type VisualEffectSoundEvent,
} from "@/lib/examples/sound"
import { VisualEffectEventBus } from "@/services/VisualEffectEventBus"

const PENTATONIC_SCALE = ["C", "D", "E", "G", "A"] as const
const BASE_OCTAVE = 3
const CHORD_WINDOW_MS = 100
const DEDUPE_WINDOW_MS = 60

export interface ToneEngine {
  readonly play: (cue: SoundCue) => Effect.Effect<void>
}

export class SoundManager extends ServiceMap.Service<
  SoundManager,
  { readonly unlock: Effect.Effect<void> }
>()("SoundManager", {
  make: Effect.gen(function* () {
    const registry = yield* AtomRegistry.AtomRegistry
    const eventBus = yield* VisualEffectEventBus
    const semaphore = yield* Semaphore.make(1)
    const scope = yield* Scope.make()

    yield* semaphore.take(1)

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
        return false
      }

      // If the user prefers reduced motion and they've set their sound
      // preference to system, respect their preferences
      return prefersReducedMotion === false
    }

    const isPlayableCue = Effect.fnUntraced(function* (cue: SoundCue) {
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

    const handleEvent = Effect.fnUntraced(function* (event: VisualEffectSoundEvent) {
      const soundEnabled = isSoundEnabled()
      if (!soundEnabled) {
        return yield* Effect.void
      }

      // Only attempt to load the tone engine if sound has been enabled
      const toneEngine = yield* Scope.provide(loadToneEngine, scope)

      const cue = toSoundCue(event)
      if (cue && isPlayableCue(cue)) {
        return yield* semaphore.withPermitsIfAvailable(1)(toneEngine.play(cue))
      }

      return yield* Effect.void
    })

    yield* eventBus.events.pipe(
      Stream.runForEach((event) => handleEvent(event)),
      Effect.forkScoped,
    )

    return {
      unlock: semaphore.release(1),
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

  let currentNoteIndex = 0
  let chordWindowStart: number | undefined = undefined
  let chordStep = 0
  let chordBaseIndex = 0

  const inChordWindow = (nowMs: number): boolean => {
    return chordWindowStart !== undefined && nowMs - chordWindowStart <= CHORD_WINDOW_MS
  }

  const rotateScaleNote = (octave: number): string => {
    const note = PENTATONIC_SCALE[currentNoteIndex % PENTATONIC_SCALE.length]
    currentNoteIndex = (currentNoteIndex + 1) % (PENTATONIC_SCALE.length * 2)
    return `${note}${octave}`
  }

  const nextSuccessNote = Effect.gen(function* () {
    const now = yield* Clock.currentTimeMillis
    if (!inChordWindow(now)) {
      chordWindowStart = now
      chordStep = 0
      chordBaseIndex = currentNoteIndex % PENTATONIC_SCALE.length
    }

    const root = `${PENTATONIC_SCALE[chordBaseIndex]}${BASE_OCTAVE + 1}`
    const semitoneOffset = [0, 4, 7][chordStep % 3]

    chordStep += 1
    currentNoteIndex = (currentNoteIndex + 1) % (PENTATONIC_SCALE.length * 2)

    return Tone.Frequency(root).transpose(semitoneOffset).toNote()
  })

  const play = Effect.fn("ToneEngine.play")(function* (cue: SoundCue) {
    const now = Tone.now()
    switch (cue._tag) {
      case "StepRunning": {
        running.triggerAttackRelease("C2", "16n", now, 0.68)
        break
      }
      case "StepSucceeded": {
        const note = yield* nextSuccessNote
        success.triggerAttackRelease(note, "8n", now, 0.45)
        break
      }
      case "StepFailed": {
        const note = rotateScaleNote(BASE_OCTAVE - 1)
        failure.triggerAttackRelease(note, "4n", now, 0.65)
        break
      }
      case "StepInterrupted": {
        interrupted.triggerAttackRelease("C5", "32n", now, 0.6)
        interrupted.triggerAttackRelease("E5", "32n", now + 0.07, 0.6)
        break
      }
      case "StepDied": {
        death.triggerAttackRelease("D#3", "32n", now, 0.45)
        death.triggerAttackRelease("C1", "1n", now + 0.1, 0.55)
        break
      }
      case "ExampleReset": {
        reset.triggerAttackRelease(`G${BASE_OCTAVE}`, "16n", now, 0.6)
        reset.triggerAttackRelease(`C${BASE_OCTAVE}`, "16n", now + 0.1, 0.6)
        break
      }
      case "ControlChanged": {
        config.triggerAttackRelease("G5", "16n", now, 0.55)
        break
      }
    }
  })

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
