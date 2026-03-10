import * as Effect from "effect/Effect"
import * as Schedule from "effect/Schedule"
import * as String from "effect/String"
import { defineExample, HighlightSelector, Notifications } from "../constructors"
import { ErrorResult } from "../results/error"

const SNOOZE_MESSAGES = [
  "😴 Snooze #1",
  "😪 Snooze #2",
  "🥱 Snooze #3",
  "😵 Snooze #4",
  "💀 Asleep Forever",
] as const

export const retryRecursExample = defineExample({
  type: "schedule",
  label: "Effect.retry",
  subtitle: "times",
  description: "Retry an effect a fixed number of times",
  code: {
    language: "typescript",
    source: String.stripMargin(
      `|const wakeUp = attemptToWakeUp()
       |const snoozeSchedule = Schedule.both(
       |  Schedule.spaced("2 seconds"),
       |  Schedule.recurs(4)
       |)
       |const result = Effect.retry(wakeUp, snoozeSchedule)`,
    ),
  },
  resultHighlight: HighlightSelector.Text({
    text: "Effect.retry(wakeUp, snoozeSchedule)",
  }),
  build: ({ addStep }) => {
    let index = 0

    const wakeUpAttempt = Effect.gen(function* () {
      const notifications = yield* Notifications

      yield* Effect.sleep("500 millis")

      const message = SNOOZE_MESSAGES[Math.min(index, SNOOZE_MESSAGES.length - 1)]
      index += 1

      return yield* Effect.fail(new ErrorResult(message)).pipe(
        Effect.tapError((error) => notifications.notify(error.message)),
      )
    })

    const wakeUp = addStep(wakeUpAttempt, {
      label: "wakeUp",
      highlight: HighlightSelector.Text({ text: "attemptToWakeUp()" }),
      addToTimeline: true,
    })

    const snoozeSchedule = Schedule.both(Schedule.spaced("2 seconds"), Schedule.recurs(4))

    return Effect.retry(wakeUp, snoozeSchedule)
  },
})
