import * as Effect from "effect/Effect"
import * as Schedule from "effect/Schedule"
import { defineExample } from "../constructors"
import { ErrorResult } from "../results/error"

const snoozeMessages = [
  "snooze #1",
  "snooze #2",
  "snooze #3",
  "snooze #4",
  "asleep forever",
] as const

// The retry demo always follows the same sequence of failures so the timeline and
// final exhausted state stay easy to compare during development.
let snoozeAttempt = 0

const resetSnoozeAttempt = Effect.sync(() => {
  snoozeAttempt = 0
})

const wakeUpAttempt = Effect.gen(function* () {
  yield* Effect.sleep("500 millis")

  const message = snoozeMessages[Math.min(snoozeAttempt, snoozeMessages.length - 1)]
  snoozeAttempt += 1

  return yield* Effect.fail(new ErrorResult(message))
})

const snoozeSchedule = Schedule.both(Schedule.spaced("2 seconds"), Schedule.recurs(4))

export const retryRecursExample = defineExample({
  type: "schedule",
  label: "Effect.retry",
  subtitle: "recurs",
  description: "Retry while both spacing and retry-count limits still allow another attempt",
  code: {
    language: "typescript",
    source: `const wakeUp = attemptToWakeUp()

// The schedule keeps going only while both policies agree:
// - wait 2 seconds between attempts
// - stop after 4 retries
const snoozeSchedule = Schedule.both(
  Schedule.spaced("2 seconds"),
  Schedule.recurs(4)
)

const result = Effect.retry(wakeUp, snoozeSchedule)`,
  },
  resultHighlight: {
    _tag: "Text",
    text: "Effect.retry(wakeUp, snoozeSchedule)",
  },
  build: ({ addStep }) => {
    const wakeUp = addStep(wakeUpAttempt, {
      label: "wakeUp",
      highlight: { _tag: "Text", text: "attemptToWakeUp()" },
      addToTimeline: true,
    })

    return Effect.retry(wakeUp, snoozeSchedule).pipe(Effect.ensuring(resetSnoozeAttempt))
  },
})
