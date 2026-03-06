import { useAtomValue } from "@effect/atom-react"
import * as Array from "effect/Array"
import * as Duration from "effect/Duration"
import * as Effect from "effect/Effect"
import { useControlWrite } from "@/components/landing/examples/VisualEffectProvider"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TabsIndicator } from "@/components/ui/tabs-indicator"
import { useTabsIndicator } from "@/hooks/useTabsIndicator"
import { cn } from "@/lib/utils"
import { defineExample, type ExampleControlRenderProps } from "../constructors"
import { TemperatureArrayResult, TemperatureResult } from "../results/temperature"

type ConcurrencyMode = "sequential" | "numbered" | "unbounded"

const CONCURRENCY_OPTIONS: ReadonlyArray<ConcurrencyMode> = ["sequential", "numbered", "unbounded"]

function ConcurrencyModeControl(props: ExampleControlRenderProps<ConcurrencyMode>) {
  const value = useAtomValue(props.atom)
  const setValue = useControlWrite(props.atom)
  const { indicatorRect, rootRef } = useTabsIndicator(value)

  return (
    <div ref={rootRef} className="flex items-center justify-start gap-3">
      <span className="font-mono tracking-wider text-neutral-500 select-none">CONCURRENCY</span>
      <Tabs value={value} onValueChange={(value) => setValue(value)}>
        <TabsList className="relative isolate gap-3 overflow-hidden border border-zinc-700 bg-zinc-900 p-1 group-data-horizontal/tabs:h-11">
          <TabsIndicator rect={indicatorRect} variant="fill" className="rounded-md bg-zinc-950" />

          {CONCURRENCY_OPTIONS.map((option) => (
            <TabsTrigger
              key={option}
              className={cn(
                "relative z-10 cursor-pointer border-none px-3 text-center font-mono shadow-none",
                "bg-transparent data-active:border-transparent data-active:bg-transparent data-active:font-semibold data-active:shadow-none",
                "dark:data-active:border-transparent dark:data-active:bg-transparent",
                "group-data-[variant=default]/tabs-list:data-active:shadow-none",
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

const effectAll = (mode: ConcurrencyMode): string => {
  switch (mode) {
    case "sequential":
      return "Effect.all([nyc, berlin, tokyo, london])"
    case "numbered":
      return "Effect.all([nyc, berlin, tokyo, london], {\n  concurrency: 2\n})"
    case "unbounded":
      return 'Effect.all([nyc, berlin, tokyo, london], {\n  concurrency: "unbounded"\n})'
  }
}

const effectAllSnippetSource = (
  mode: ConcurrencyMode,
): string => `const nyc = readTemperature("New York")
const berlin = readTemperature("Berlin")
const tokyo = readTemperature("Tokyo")
const london = readTemperature("London")

const result = ${effectAll(mode)}`

export const allExample = defineExample({
  label: "Effect.all",
  description: "Combine multiple effects into one, returning results based on input structure",
  code: {
    language: "typescript",
    source: effectAllSnippetSource("sequential"),
  },
  resultHighlight: {
    _tag: "Text",
    text: effectAll("sequential"),
  },
  build: ({ addStep, controls, snippet }) => {
    const concurrency = controls.register({
      id: "concurrency",
      label: "Concurrency",
      description: "Changing mode resets the current run.",
      initialValue: "sequential",
      render: ConcurrencyModeControl,
      changePolicy: "ifRunning",
    })

    snippet.setCode(({ get }) => ({
      language: "typescript",
      source: effectAllSnippetSource(get(concurrency)),
    }))
    snippet.setResultHighlight(({ get }) => ({
      _tag: "Text",
      text: effectAll(get(concurrency)),
    }))

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
