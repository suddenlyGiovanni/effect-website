import * as Effect from "effect/Effect"
import * as Schedule from "effect/Schedule"
import * as String from "effect/String"
import { defineExample, HighlightSelector, Notifications } from "../constructors"
import { ErrorResult } from "../results/error"
import { PrimitiveResult } from "../results/primitive"

const PARKING_ATTEMPTS = ["😤 Too Close!", "😡 Too Far!", "🤬 Neutral!", "😑 Focus."]

export const retryExponentialExample = defineExample({
  type: "schedule",
  label: "Effect.retry",
  subtitle: "exponential",
  description: "Retry a failing effect with gaps that widen after each failure",
  code: {
    language: "typescript",
    source: String.stripMargin(
      `|const park = attemptParallelPark()
       |const result = Effect.retry(park, Schedule.exponential("700 millis"))`,
    ),
  },
  resultHighlight: HighlightSelector.Text({
    text: 'Effect.retry(park, Schedule.exponential("700 millis"))',
  }),
  build: ({ addStep }) => {
    let index = 0

    const attemptParallelPark = Effect.gen(function* () {
      const notifications = yield* Notifications

      yield* Effect.sleep("500 millis")

      if (index >= PARKING_ATTEMPTS.length) {
        return new PrimitiveResult("🚗 Parked!")
      }

      const result = PARKING_ATTEMPTS[index]
      index += 1

      return yield* Effect.fail(new ErrorResult(result)).pipe(
        Effect.tapError((error) => notifications.notify(error.message)),
      )
    })

    const parkStep = addStep(attemptParallelPark, {
      label: "park",
      highlight: HighlightSelector.Text({ text: "attemptParallelPark()" }),
      addToTimeline: true,
    })

    return Effect.retry(parkStep, Schedule.exponential("700 millis"))
  },
})
