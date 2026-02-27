import { useCallback, useEffect, useRef } from "react"

export type SoundName = "run" | "success" | "failure" | "death" | "interrupt" | "reset"

type SoundPreset = {
  readonly frequency: number
  readonly durationSeconds: number
  readonly oscillatorType: OscillatorType
  readonly gain: number
  readonly endFrequency?: number | undefined
}

const SOUND_PRESETS: Readonly<Record<SoundName, SoundPreset>> = {
  run: {
    frequency: 620,
    durationSeconds: 0.06,
    oscillatorType: "sine",
    gain: 0.05,
  },
  success: {
    frequency: 820,
    durationSeconds: 0.11,
    oscillatorType: "triangle",
    gain: 0.07,
    endFrequency: 980,
  },
  failure: {
    frequency: 240,
    durationSeconds: 0.12,
    oscillatorType: "square",
    gain: 0.06,
    endFrequency: 180,
  },
  death: {
    frequency: 150,
    durationSeconds: 0.18,
    oscillatorType: "sawtooth",
    gain: 0.07,
    endFrequency: 90,
  },
  interrupt: {
    frequency: 460,
    durationSeconds: 0.08,
    oscillatorType: "triangle",
    gain: 0.06,
    endFrequency: 300,
  },
  reset: {
    frequency: 520,
    durationSeconds: 0.09,
    oscillatorType: "sine",
    gain: 0.05,
    endFrequency: 320,
  },
}

const createAudioContext = () => {
  if (typeof window === "undefined") {
    return undefined
  }

  if (window.AudioContext === undefined) {
    return undefined
  }

  return new window.AudioContext()
}

export const useInteractionSounds = () => {
  const audioContextReference = useRef<AudioContext | undefined>(undefined)

  const ensureContext = useCallback(() => {
    const activeContext = audioContextReference.current

    if (activeContext !== undefined && activeContext.state !== "closed") {
      return activeContext
    }

    const createdContext = createAudioContext()

    if (createdContext !== undefined) {
      audioContextReference.current = createdContext
    }

    return createdContext
  }, [])

  const playSound = useCallback(
    (name: SoundName) => {
      const context = ensureContext()

      if (context === undefined) {
        return
      }

      if (context.state === "suspended") {
        void context.resume()
      }

      const preset = SOUND_PRESETS[name]
      const oscillator = context.createOscillator()
      const gainNode = context.createGain()

      const now = context.currentTime
      const attackEnd = now + 0.01
      const endTime = now + preset.durationSeconds

      oscillator.type = preset.oscillatorType
      oscillator.frequency.setValueAtTime(preset.frequency, now)

      if (preset.endFrequency !== undefined) {
        oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, preset.endFrequency), endTime)
      }

      gainNode.gain.setValueAtTime(0.0001, now)
      gainNode.gain.exponentialRampToValueAtTime(preset.gain, attackEnd)
      gainNode.gain.exponentialRampToValueAtTime(0.0001, endTime)

      oscillator.connect(gainNode)
      gainNode.connect(context.destination)

      oscillator.start(now)
      oscillator.stop(endTime)
    },
    [ensureContext],
  )

  useEffect(() => {
    return () => {
      const context = audioContextReference.current

      if (context !== undefined && context.state !== "closed") {
        void context.close()
      }
    }
  }, [])

  return { playSound }
}
