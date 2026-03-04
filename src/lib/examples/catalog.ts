import * as Effect from "effect/Effect"
import * as Ref from "effect/Ref"
import * as Schedule from "effect/Schedule"
import { defineExample, type ExampleDefinition } from "@/lib/examples/constructors"
import { ExampleKey } from "@/lib/examples/domain"

export type ExampleCategory =
  | "concurrency"
  | "constructors"
  | "error-handling"
  | "schedule"
  | "ref-scope"

export interface ExampleCatalogEntry {
  readonly label: string
  readonly examples: ReadonlyArray<ExampleDefinition>
}

const delayedLabel = (city: string, temperature: number, delayMs: number): Effect.Effect<string> =>
  Effect.sleep(`${delayMs} millis`).pipe(Effect.andThen(Effect.succeed(` ${temperature}°C`)))

export const allExample = defineExample({
  key: ExampleKey.makeUnsafe("examples/concurrency/all"),
  label: { title: "Effect.all" },
  description: "Combine multiple effects into one, returning results based on input structure",
  build: ({ addStep }) =>
    Effect.all([
      addStep(delayedLabel("New York", 14, 500), {
        label: "nyc",
      }),
      delayedLabel("Berlin", 11, 900).pipe(
        addStep({
          label: "berlin",
        }),
      ),
      addStep(delayedLabel("Tokyo", 18, 650), {
        label: "tokyo",
      }),
      addStep(delayedLabel("London", 9, 400), {
        label: "london",
      }),
    ]),
})

export const raceExample = defineExample({
  key: ExampleKey.makeUnsafe("examples/concurrency/race"),
  label: { title: "Effect.race" },
  build: ({ addStep }) =>
    Effect.race(
      addStep(Effect.sleep("1200 millis").pipe(Effect.andThen(Effect.succeed("branch-a"))), {
        label: "branch-a",
      }),
      Effect.sleep("700 millis").pipe(
        Effect.andThen(Effect.succeed("branch-b")),
        addStep({
          label: "branch-b",
        }),
      ),
    ),
})

export const retryExample = defineExample({
  key: ExampleKey.makeUnsafe("examples/schedule/retry"),
  label: { title: "Effect.retry", subtitle: "times" },
  build: ({ addStep }) =>
    Effect.gen(function* () {
      const attempts = yield* Ref.make(0)

      const flaky = addStep(
        Effect.gen(function* () {
          const currentAttempt = yield* Ref.updateAndGet(attempts, (current) => current + 1)

          yield* Effect.sleep("350 millis")
          if (currentAttempt < 3) {
            return yield* Effect.fail(`attempt-${currentAttempt}`)
          }

          return `success-${currentAttempt}`
        }),
        {
          label: "attempt",
        },
      )

      return yield* flaky.pipe(
        Effect.retry(Schedule.both(Schedule.recurs(3), Schedule.spaced("500 millis"))),
      )
    }),
})

export const EXAMPLES_CATALOG: Record<ExampleCategory, ExampleCatalogEntry> = {
  concurrency: {
    label: "Concurrency",
    examples: [allExample, raceExample],
  },
  schedule: {
    label: "Schedule",
    examples: [retryExample],
  },
  constructors: {
    label: "Constructors",
    examples: [],
  },
  "error-handling": {
    label: "Error Handling",
    examples: [],
  },
  "ref-scope": {
    label: "Ref & Scope",
    examples: [],
  },
}
