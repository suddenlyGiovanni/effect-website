import * as Array from "effect/Array"
import * as Duration from "effect/Duration"
import * as Effect from "effect/Effect"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useControlWrite } from "@/components/landing/examples/VisualEffectProvider"
import { defineExample, type ExampleControlRenderProps } from "../constructors"
import { TemperatureArrayResult, TemperatureResult } from "../results/temperature"
import { cn } from "@/lib/utils"

type ConcurrencyMode = "sequential" | "numbered" | "unbounded"

const CONCURRENCY_OPTIONS: ReadonlyArray<ConcurrencyMode> = ["sequential", "numbered", "unbounded"]

function ConcurrencyModeControl(props: ExampleControlRenderProps<ConcurrencyMode>) {
  const setValue = useControlWrite(props.atom)

  return (
    <div className="flex justify-start items-center gap-3">
      <span className="text-neutral-500 font-mono tracking-wider select-none">CONCURRENCY</span>
      <Tabs defaultValue={CONCURRENCY_OPTIONS[0]} onValueChange={(value) => setValue(value)}>
        <TabsList className="group-data-horizontal/tabs:h-11 p-1 gap-3 bg-zinc-900 border border-zinc-700">
          {CONCURRENCY_OPTIONS.map((option) => (
            <TabsTrigger
              className={cn(
                "px-3 text-center font-mono border-none cursor-pointer",
                "bg-transparent data-active:font-semibold data-active:bg-background dark:data-active:bg-zinc-950",
              )}
              value={option}
            >
              {option}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}

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
  build: ({ addStep, controls }) => {
    const concurrency = controls.register({
      id: "concurrency",
      label: "Concurrency",
      description: "Changing mode resets the current run.",
      initialValue: "sequential",
      render: ConcurrencyModeControl,
      changePolicy: "ifRunning",
    })

    const nyc = addStep(getTemperature(14, "900 millis"), {
      label: "nyc",
      highlight: { _tag: "Text", text: 'readTemperature("New York")' },
    })
    const berlin = addStep(getTemperature(11, "500 millis"), {
      label: "berlin",
      highlight: { _tag: "Text", text: 'readTemperature("Berlin")' },
    })
    const tokyo = addStep(getTemperature(18, "650 millis"), {
      label: "tokyo",
      highlight: { _tag: "Text", text: 'readTemperature("Tokyo")' },
    })
    const london = addStep(getTemperature(9, "400 millis"), {
      label: "london",
      highlight: { _tag: "Text", text: 'readTemperature("London")' },
    })

    return Effect.gen(function* () {
      const mode = yield* controls.read(concurrency)
      const effects = [nyc, berlin, tokyo, london] as const

      const temperatures =
        mode === "sequential"
          ? yield* Effect.all(effects)
          : mode === "unbounded"
            ? yield* Effect.all(effects, { concurrency: "unbounded" })
            : yield* Effect.all(effects, { concurrency: 2 })

      return new TemperatureArrayResult(Array.map(temperatures, (result) => result.value))
    })
  },
})
