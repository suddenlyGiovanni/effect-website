import * as Array from "effect/Array"
import * as Duration from "effect/Duration"
import * as Effect from "effect/Effect"
import { defineExample } from "../constructors"
import { TemperatureResult, TemperatureArrayResult } from "../results/temperature"

const getTemperature = (
  value: number,
  duration: Duration.Input,
): Effect.Effect<TemperatureResult> => {
  const result = new TemperatureResult(value)
  return Effect.sleep(duration).pipe(Effect.as(result))
}

export const allExample = defineExample({
  label: "Effect.all",
  description: "Combine multiple effects into one, returning results based on input structure",
  build: ({ addStep }) =>
    Effect.all([
      addStep(getTemperature(14, "900 millis"), {
        label: "nyc",
      }),
      addStep(getTemperature(11, "500 millis"), {
        label: "berlin",
      }),
      addStep(getTemperature(18, "650 millis"), {
        label: "tokyo",
      }),
      addStep(getTemperature(9, "400 millis"), {
        label: "london",
      }),
    ]).pipe(
      Effect.map(Array.map((result) => result.value)),
      Effect.map((values) => new TemperatureArrayResult(values)),
    ),
})
