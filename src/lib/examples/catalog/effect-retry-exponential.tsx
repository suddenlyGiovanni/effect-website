import * as Effect from "effect/Effect"
import * as Schedule from "effect/Schedule"
import { defineExample } from "../constructors"
import { ErrorResult } from "../results/error"
import { PrimitiveResult } from "../results/primitive"

const parkingMistakes = ["too close", "too far", "still crooked"] as const

// This counter keeps the demo deterministic so the widening backoff is easy to read.
// We reset it in `ensuring(...)` so each new run replays the same sequence of failures.
let parkingAttempt = 0

const resetParkingAttempt = Effect.sync(() => {
  parkingAttempt = 0
})

const attemptParallelPark = Effect.gen(function* () {
  yield* Effect.sleep("500 millis")

  const attemptNumber = parkingAttempt
  parkingAttempt += 1

  const parkingMistake = parkingMistakes[attemptNumber]

  if (parkingMistake !== undefined) {
    return yield* Effect.fail(new ErrorResult(parkingMistake))
  }

  return new PrimitiveResult("parked")
})

export const retryExponentialExample = defineExample({
  type: "schedule",
  label: "Effect.retry",
  subtitle: "exponential",
  description: "Retry a failing effect with gaps that widen after each failure",
  code: {
    language: "typescript",
    source: `const park = attemptParallelPark()

// Exponential backoff widens the gap after each failed attempt.
const result = Effect.retry(park, Schedule.exponential("700 millis"))`,
  },
  resultHighlight: {
    _tag: "Text",
    text: 'Effect.retry(park, Schedule.exponential("700 millis"))',
  },
  build: ({ addStep }) => {
    const park = addStep(attemptParallelPark, {
      type: "schedule",
      label: "park",
      highlight: { _tag: "Text", text: "attemptParallelPark()" },
    })

    return Effect.retry(park, Schedule.exponential("700 millis")).pipe(
      Effect.ensuring(resetParkingAttempt),
    )
  },
})
