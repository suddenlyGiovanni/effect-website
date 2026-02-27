import { Effect } from "effect"

const getDelay = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export const createEffectSucceedProgram = () => {
  return Effect.succeed(42)
}

export const createEffectFailProgram = () => {
  return Effect.fail("Kaboom!")
}

export const createEffectDieProgram = () => {
  return Effect.dieMessage("FATAL: System corrupted")
}

export const createEffectSleepProgram = () => {
  return Effect.gen(function* () {
    yield* Effect.sleep("1 second")
    yield* Effect.sleep("2 seconds")
    return "Refreshed!"
  })
}

export const createOrElseShootProgram = (cycle: number) => {
  return Effect.gen(function* () {
    yield* Effect.sleep(getDelay(300, 650))

    const cyclePosition = cycle % 3

    if (cyclePosition === 0 || cyclePosition === 2) {
      return yield* Effect.fail("Out of Ammo!")
    }

    return "🔫"
  })
}

export const createOrElseQuestionProgram = (cycle: number) => {
  return Effect.gen(function* () {
    yield* Effect.sleep(getDelay(350, 700))

    const cyclePosition = cycle % 3

    if (cyclePosition === 2) {
      return yield* Effect.fail("Brain Fart!")
    }

    return "💬"
  })
}
