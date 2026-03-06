import * as Effect from "effect/Effect"
import * as Schedule from "effect/Schedule"
import { defineExample } from "../constructors"
import { ErrorResult } from "../results/error"
import { PrimitiveResult } from "../results/primitive"

const notifications = ["unknown caller", "calendar alert", "new message", "battery warning"] as const

// This module-level cursor gives the demo a deterministic story across retries.
// `Effect.ensuring(...)` resets it so every run starts from the same state.
let notificationIndex = 0

const resetNotificationIndex = Effect.sync(() => {
  notificationIndex = 0
})

const checkNotifications = Effect.gen(function* () {
  yield* Effect.sleep("500 millis")

  const notification = notifications[notificationIndex]
  notificationIndex += 1

  if (notification === undefined) {
    return yield* Effect.fail(new ErrorResult("phone died"))
  }

  return new PrimitiveResult(notification)
})

export const repeatSpacedExample = defineExample({
  label: "Effect.repeat",
  subtitle: "spaced",
  description: "Repeat an effect after a fixed delay for as long as it keeps succeeding",
  code: {
    language: "typescript",
    source: `const phone = checkNotifications()

// Repeat only after each successful check finishes.
const checking = Effect.repeat(phone, Schedule.spaced("2 seconds"))`,
  },
  resultHighlight: {
    _tag: "Text",
    text: 'Effect.repeat(phone, Schedule.spaced("2 seconds"))',
  },
  scheduleTimeline: {},
  build: ({ addStep }) => {
    const phone = addStep(checkNotifications, {
      label: "phone",
      highlight: { _tag: "Text", text: "checkNotifications()" },
      scheduleRole: "attempt",
    })

    return Effect.repeat(phone, Schedule.spaced("2 seconds")).pipe(
      Effect.map((count) => new PrimitiveResult(count)),
      Effect.ensuring(resetNotificationIndex),
    )
  },
})
