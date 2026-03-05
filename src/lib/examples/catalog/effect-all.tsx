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
  code: {
    language: "typescript",
    source: `const nyc = readTemperature("New York")
const berlin = readTemperature("Berlin")
const tokyo = readTemperature("Tokyo")
const london = readTemperature("London")

const result = Effect.all([nyc, berlin, tokyo, london])`,
  },
  resultHighlight: {
    _tag: "Text",
    text: "Effect.all([nyc, berlin, tokyo, london])",
  },
  build: ({ addStep }) => {
    return Effect.all([
      addStep(getTemperature(14, "900 millis"), {
        label: "nyc",
        highlight: { _tag: "Text", text: 'readTemperature("New York")' },
      }),
      addStep(getTemperature(11, "500 millis"), {
        label: "berlin",
        highlight: { _tag: "Text", text: 'readTemperature("Berlin")' },
      }),
      addStep(getTemperature(18, "650 millis"), {
        label: "tokyo",
        highlight: { _tag: "Text", text: 'readTemperature("Tokyo")' },
      }),
      addStep(getTemperature(9, "400 millis"), {
        label: "london",
        highlight: { _tag: "Text", text: 'readTemperature("London")' },
      }),
    ]).pipe(
      Effect.map(Array.map((result) => result.value)),
      Effect.map((values) => new TemperatureArrayResult(values)),
    )
  },
})
