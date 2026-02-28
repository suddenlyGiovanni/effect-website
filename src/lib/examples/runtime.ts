import { Effect, Ref, Schedule } from "effect"
import type { ExampleLayout } from "@/lib/examples/model"
import { EXAMPLE_IDS, type ExampleId } from "@/lib/examples/ids"

export type ExampleExecutionKind =
  | "single-node"
  | "pipeline"
  | "fallback-chain"
  | "schedule"
  | "ref-scope"
export type ExampleProgram = Effect.Effect<unknown, unknown, never>

export interface ExampleNodeSpec {
  readonly inputNodes: ReadonlyArray<string>
  readonly resultNode?: string | undefined
  readonly timerNode?: string | undefined
}

export interface ExampleCatalogEntry {
  readonly title: string
  readonly variant?: string | undefined
  readonly description: string
  readonly snippet: string
  readonly nodeSpec: ExampleNodeSpec
  readonly executionKind: ExampleExecutionKind
  readonly deterministic: true
  readonly layout: ExampleLayout
  readonly program: ExampleProgram
}

const lines = (...parts: ReadonlyArray<string>): string => parts.join("\n")
const singleNode: ExampleLayout = { type: "single-node" }
const pipeline: ExampleLayout = { type: "pipeline" }
const fallbackChain: ExampleLayout = { type: "fallback-chain" }
const schedule: ExampleLayout = { type: "schedule" }
const refScope: ExampleLayout = { type: "ref-scope" }

const makeRetryProgram = (
  schedulePolicy: Schedule.Schedule<unknown, unknown, unknown>,
): ExampleProgram =>
  Effect.gen(function* () {
    const attempts = yield* Ref.make(0)
    const flaky = Ref.updateAndGet(attempts, (n) => n + 1).pipe(
      Effect.flatMap((n) => (n < 3 ? Effect.fail(`attempt-${n}`) : Effect.succeed(`ok-${n}`))),
    )
    return yield* flaky.pipe(Effect.retry(schedulePolicy))
  })

export const EXAMPLE_CATALOG: Readonly<Record<ExampleId, ExampleCatalogEntry>> = {
  "effect-all": {
    title: "Effect.all",
    description: "Runs multiple effects and collects all successful results.",
    snippet: lines(
      'import { Effect } from "effect"',
      "",
      "const program = Effect.all([",
      '  Effect.succeed("alpha"),',
      '  Effect.succeed("beta"),',
      '  Effect.succeed("gamma"),',
      "])",
    ),
    nodeSpec: { inputNodes: ["alpha", "beta", "gamma"], resultNode: "all" },
    executionKind: "pipeline",
    deterministic: true,
    layout: pipeline,
    program: Effect.all([Effect.succeed("alpha"), Effect.succeed("beta"), Effect.succeed("gamma")]),
  },
  "effect-race": {
    title: "Effect.race",
    description: "Resolves with the first successful branch and interrupts the loser.",
    snippet: lines(
      'import { Effect } from "effect"',
      "",
      'const fast = Effect.sleep("20 millis").pipe(Effect.as("fast"))',
      'const slow = Effect.sleep("80 millis").pipe(Effect.as("slow"))',
      "",
      "const program = Effect.race(fast, slow)",
    ),
    nodeSpec: { inputNodes: ["fast", "slow"], resultNode: "winner", timerNode: "winner" },
    executionKind: "pipeline",
    deterministic: true,
    layout: pipeline,
    program: Effect.race(
      Effect.sleep("20 millis").pipe(Effect.as("fast")),
      Effect.sleep("80 millis").pipe(Effect.as("slow")),
    ),
  },
  "effect-raceall": {
    title: "Effect.raceAll",
    description: "Races a collection of effects and returns the first completion.",
    snippet: lines(
      'import { Effect } from "effect"',
      "",
      "const program = Effect.raceAll([",
      '  Effect.sleep("60 millis").pipe(Effect.as("A")),',
      '  Effect.sleep("30 millis").pipe(Effect.as("B")),',
      '  Effect.sleep("90 millis").pipe(Effect.as("C")),',
      "])",
    ),
    nodeSpec: { inputNodes: ["A", "B", "C"], resultNode: "winner", timerNode: "winner" },
    executionKind: "pipeline",
    deterministic: true,
    layout: pipeline,
    program: Effect.raceAll([
      Effect.sleep("60 millis").pipe(Effect.as("A")),
      Effect.sleep("30 millis").pipe(Effect.as("B")),
      Effect.sleep("90 millis").pipe(Effect.as("C")),
    ]),
  },
  "effect-foreach": {
    title: "Effect.forEach",
    description: "Maps an effectful function over values and collects results.",
    snippet: lines(
      'import { Effect } from "effect"',
      "",
      "const program = Effect.forEach([1, 2, 3], (n) =>",
      "  Effect.succeed(n * 2)",
      ")",
    ),
    nodeSpec: { inputNodes: ["1", "2", "3"], resultNode: "mapped" },
    executionKind: "pipeline",
    deterministic: true,
    layout: pipeline,
    program: Effect.forEach([1, 2, 3], (n) => Effect.succeed(n * 2)),
  },
  "effect-succeed": {
    title: "Effect.succeed",
    description: "Creates an effect that immediately succeeds with a value.",
    snippet: lines('import { Effect } from "effect"', "", 'const program = Effect.succeed("ok")'),
    nodeSpec: { inputNodes: ["succeed"], resultNode: "ok" },
    executionKind: "single-node",
    deterministic: true,
    layout: singleNode,
    program: Effect.succeed("ok"),
  },
  "effect-die": {
    title: "Effect.die",
    description: "Terminates with a defect (outside the typed error channel).",
    snippet: lines(
      'import { Effect } from "effect"',
      "",
      'const program = Effect.die("fatal defect")',
    ),
    nodeSpec: { inputNodes: ["die"], resultNode: "defect" },
    executionKind: "single-node",
    deterministic: true,
    layout: singleNode,
    program: Effect.die("fatal defect"),
  },
  "effect-fail": {
    title: "Effect.fail",
    description: "Creates an effect that fails in the typed error channel.",
    snippet: lines(
      'import { Effect } from "effect"',
      "",
      'const program = Effect.fail("domain failure")',
    ),
    nodeSpec: { inputNodes: ["fail"], resultNode: "error" },
    executionKind: "single-node",
    deterministic: true,
    layout: singleNode,
    program: Effect.fail("domain failure"),
  },
  "effect-sync": {
    title: "Effect.sync",
    description: "Wraps synchronous computation in an effect.",
    snippet: lines(
      'import { Effect } from "effect"',
      "",
      'const program = Effect.sync(() => "computed synchronously")',
    ),
    nodeSpec: { inputNodes: ["sync"], resultNode: "value" },
    executionKind: "single-node",
    deterministic: true,
    layout: singleNode,
    program: Effect.sync(() => "computed synchronously"),
  },
  "effect-promise": {
    title: "Effect.promise",
    description: "Wraps a Promise API that is expected to succeed.",
    snippet: lines(
      'import { Effect } from "effect"',
      "",
      'const program = Effect.promise((_) => Promise.resolve("promise resolved"))',
    ),
    nodeSpec: { inputNodes: ["promise"], resultNode: "value" },
    executionKind: "single-node",
    deterministic: true,
    layout: singleNode,
    program: Effect.promise((_) => Promise.resolve("promise resolved")),
  },
  "effect-sleep": {
    title: "Effect.sleep",
    description: "Delays execution and then continues with a value.",
    snippet: lines(
      'import { Effect } from "effect"',
      "",
      'const program = Effect.sleep("120 millis").pipe(',
      '  Effect.as("woke up")',
      ")",
    ),
    nodeSpec: { inputNodes: ["sleep"], resultNode: "woke up", timerNode: "sleep" },
    executionKind: "single-node",
    deterministic: true,
    layout: singleNode,
    program: Effect.sleep("120 millis").pipe(Effect.as("woke up")),
  },
  "effect-all-short-circuit": {
    title: "Effect.all",
    variant: "short circuit",
    description: "Fails fast when one branch fails in default mode.",
    snippet: lines(
      'import { Effect } from "effect"',
      "",
      "const program = Effect.all([",
      '  Effect.succeed("left"),',
      '  Effect.fail("boom"),',
      '  Effect.succeed("right"),',
      "])",
    ),
    nodeSpec: { inputNodes: ["left", "boom", "right"], resultNode: "failure" },
    executionKind: "fallback-chain",
    deterministic: true,
    layout: fallbackChain,
    program: Effect.all([Effect.succeed("left"), Effect.fail("boom"), Effect.succeed("right")]),
  },
  "effect-orelse": {
    title: "Effect.orElse",
    description: "Recovers from a failure by switching to a fallback effect.",
    snippet: lines(
      'import { Effect } from "effect"',
      "",
      'const program = Effect.fail("primary").pipe(',
      '  Effect.catch(() => Effect.succeed("fallback"))',
      ")",
    ),
    nodeSpec: { inputNodes: ["primary", "fallback"], resultNode: "fallback" },
    executionKind: "fallback-chain",
    deterministic: true,
    layout: fallbackChain,
    program: Effect.fail("primary").pipe(Effect.catch(() => Effect.succeed("fallback"))),
  },
  "effect-timeout": {
    title: "Effect.timeout",
    description: "Fails with TimeoutError when the effect takes too long.",
    snippet: lines(
      'import { Effect } from "effect"',
      "",
      'const program = Effect.sleep("200 millis").pipe(',
      '  Effect.as("late"),',
      '  Effect.timeout("50 millis")',
      ")",
    ),
    nodeSpec: { inputNodes: ["work"], resultNode: "timeout", timerNode: "work" },
    executionKind: "fallback-chain",
    deterministic: true,
    layout: fallbackChain,
    program: Effect.sleep("200 millis").pipe(Effect.as("late"), Effect.timeout("50 millis")),
  },
  "effect-eventually": {
    title: "Effect.eventually",
    description: "Retries forever until the effect eventually succeeds.",
    snippet: lines(
      'import { Effect, Ref } from "effect"',
      "",
      "const program = Effect.gen(function*() {",
      "  const attempts = yield* Ref.make(0)",
      "  const flaky = Ref.updateAndGet(attempts, (n) => n + 1).pipe(",
      "    Effect.flatMap((n) => (n < 3 ? Effect.fail(n) : Effect.succeed(n)))",
      "  )",
      "",
      "  return yield* Effect.eventually(flaky)",
      "})",
    ),
    nodeSpec: { inputNodes: ["attempts"], resultNode: "eventual success", timerNode: "attempts" },
    executionKind: "fallback-chain",
    deterministic: true,
    layout: fallbackChain,
    program: Effect.gen(function* () {
      const attempts = yield* Ref.make(0)
      const flaky = Ref.updateAndGet(attempts, (n) => n + 1).pipe(
        Effect.flatMap((n) =>
          n < 3 ? Effect.fail(`attempt-${n}`) : Effect.succeed(`attempt-${n}`),
        ),
      )
      return yield* Effect.eventually(flaky)
    }),
  },
  "effect-partition": {
    title: "Effect.partition",
    description: "Runs all tasks and separates failures from successes.",
    snippet: lines(
      'import { Effect } from "effect"',
      "",
      "const program = Effect.partition([0, 1, 2, 3], (n) =>",
      "  n % 2 === 0 ? Effect.fail(`even-${n}`) : Effect.succeed(`odd-${n}`)",
      ")",
    ),
    nodeSpec: { inputNodes: ["0", "1", "2", "3"], resultNode: "[errors, values]" },
    executionKind: "fallback-chain",
    deterministic: true,
    layout: fallbackChain,
    program: Effect.partition([0, 1, 2, 3], (n) =>
      n % 2 === 0 ? Effect.fail(`even-${n}`) : Effect.succeed(`odd-${n}`),
    ),
  },
  "effect-validate": {
    title: "Effect.validate",
    description: "Validates all values and accumulates every failure.",
    snippet: lines(
      'import { Effect } from "effect"',
      "",
      "const program = Effect.validate([0, 1, 2, 3], (n) =>",
      "  n % 2 === 0 ? Effect.fail(`even-${n}`) : Effect.succeed(`odd-${n}`)",
      ")",
    ),
    nodeSpec: { inputNodes: ["0", "1", "2", "3"], resultNode: "all errors or all values" },
    executionKind: "fallback-chain",
    deterministic: true,
    layout: fallbackChain,
    program: Effect.validate([0, 1, 2, 3], (n) =>
      n % 2 === 0 ? Effect.fail(`even-${n}`) : Effect.succeed(`odd-${n}`),
    ),
  },
  "ref-make": {
    title: "Ref.make",
    description: "Creates mutable state in a pure, concurrent-safe reference.",
    snippet: lines(
      'import { Effect, Ref } from "effect"',
      "",
      "const program = Effect.gen(function*() {",
      "  const counter = yield* Ref.make(1)",
      "  return yield* Ref.get(counter)",
      "})",
    ),
    nodeSpec: { inputNodes: ["ref"], resultNode: "value" },
    executionKind: "ref-scope",
    deterministic: true,
    layout: refScope,
    program: Effect.gen(function* () {
      const counter = yield* Ref.make(1)
      return yield* Ref.get(counter)
    }),
  },
  "ref-update-and-get": {
    title: "Ref.updateAndGet",
    description: "Atomically updates and reads a Ref value in one operation.",
    snippet: lines(
      'import { Effect, Ref } from "effect"',
      "",
      "const program = Effect.gen(function*() {",
      "  const counter = yield* Ref.make(0)",
      "  return yield* Ref.updateAndGet(counter, (n) => n + 1)",
      "})",
    ),
    nodeSpec: { inputNodes: ["ref"], resultNode: "updated value" },
    executionKind: "ref-scope",
    deterministic: true,
    layout: refScope,
    program: Effect.gen(function* () {
      const counter = yield* Ref.make(0)
      return yield* Ref.updateAndGet(counter, (n) => n + 1)
    }),
  },
  "effect-add-finalizer": {
    title: "Effect.addFinalizer",
    description: "Registers cleanup logic that runs when scope exits.",
    snippet: lines(
      'import { Effect, Ref } from "effect"',
      "",
      "const program = Effect.scoped(",
      "  Effect.gen(function*() {",
      '    const events = yield* Ref.make(["start"] as ReadonlyArray<string>)',
      '    yield* Effect.addFinalizer(Ref.update(events, (xs) => [...xs, "finalize"]))',
      '    yield* Ref.update(events, (xs) => [...xs, "run"])',
      "    return yield* Ref.get(events)",
      "  })",
      ")",
    ),
    nodeSpec: { inputNodes: ["scope"], resultNode: "events" },
    executionKind: "ref-scope",
    deterministic: true,
    layout: refScope,
    program: Effect.scoped(
      Effect.gen(function* () {
        const events = yield* Ref.make<ReadonlyArray<string>>(["start"])
        yield* Effect.addFinalizer(() => Ref.update(events, (xs) => [...xs, "finalize"]))
        yield* Ref.update(events, (xs) => [...xs, "run"])
        return yield* Ref.get(events)
      }),
    ),
  },
  "effect-acquire-release": {
    title: "Effect.acquireRelease",
    description: "Acquires a resource and guarantees release on scope exit.",
    snippet: lines(
      'import { Effect, Ref } from "effect"',
      "",
      "const program = Effect.scoped(",
      "  Effect.gen(function*() {",
      "    const events = yield* Ref.make([] as ReadonlyArray<string>)",
      "    const resource = yield* Effect.acquireRelease(",
      '      Ref.update(events, (xs) => [...xs, "acquire"]).pipe(Effect.as("resource")),',
      '      () => Ref.update(events, (xs) => [...xs, "release"])',
      "    )",
      "    yield* Ref.update(events, (xs) => [...xs, `use:${resource}`])",
      "    return yield* Ref.get(events)",
      "  })",
      ")",
    ),
    nodeSpec: { inputNodes: ["acquire"], resultNode: "release" },
    executionKind: "ref-scope",
    deterministic: true,
    layout: refScope,
    program: Effect.scoped(
      Effect.gen(function* () {
        const events = yield* Ref.make<ReadonlyArray<string>>([])
        const resource = yield* Effect.acquireRelease(
          Ref.update(events, (xs) => [...xs, "acquire"]).pipe(Effect.as("resource")),
          () => Ref.update(events, (xs) => [...xs, "release"]),
        )
        yield* Ref.update(events, (xs) => [...xs, `use:${resource}`])
        return yield* Ref.get(events)
      }),
    ),
  },
  "effect-retry-recurs": {
    title: "Effect.retry",
    variant: "times",
    description: "Retries a failing effect for a fixed number of additional attempts.",
    snippet: lines(
      'import { Effect, Ref, Schedule } from "effect"',
      "",
      "const wakeUp = attemptToWakeUp()",
      "const snoozeSchedule = Schedule.intersect(",
      '  Schedule.spaced("2 seconds"),',
      "  Schedule.recurs(4)",
      ")",
      "const result = Effect.retry(wakeUp, snoozeSchedule)",
    ),
    nodeSpec: { inputNodes: ["wakeUp"], resultNode: "result", timerNode: "result" },
    executionKind: "schedule",
    deterministic: true,
    layout: schedule,
    program: makeRetryProgram(Schedule.recurs(3)),
  },
  "effect-retry-exponential": {
    title: "Effect.retry",
    variant: "exponential",
    description: "Retries with exponentially increasing delays between attempts.",
    snippet: lines(
      'import { Effect, Ref, Schedule } from "effect"',
      "",
      "const program = Effect.gen(function*() {",
      "  const attempts = yield* Ref.make(0)",
      "  const flaky = Ref.updateAndGet(attempts, (n) => n + 1).pipe(",
      "    Effect.flatMap((n) => (n < 3 ? Effect.fail(`attempt-${n}`) : Effect.succeed(`ok-${n}`)))",
      "  )",
      "",
      '  return yield* flaky.pipe(Effect.retry(Schedule.exponential("10 millis")))',
      "})",
    ),
    nodeSpec: { inputNodes: ["wakeUp"], resultNode: "result", timerNode: "result" },
    executionKind: "schedule",
    deterministic: true,
    layout: schedule,
    program: makeRetryProgram(Schedule.exponential("10 millis")),
  },
  "effect-repeat-spaced": {
    title: "Effect.repeat",
    variant: "spaced",
    description: "Repeats an effect at fixed spacing intervals.",
    snippet: lines(
      'import { Effect, Ref, Schedule } from "effect"',
      "",
      "const program = Effect.gen(function*() {",
      "  const counter = yield* Ref.make(0)",
      "  const tick = Ref.updateAndGet(counter, (n) => n + 1)",
      "",
      '  yield* tick.pipe(Effect.repeat(Schedule.spaced("10 millis").pipe(Schedule.take(2))))',
      "  return yield* Ref.get(counter)",
      "})",
    ),
    nodeSpec: { inputNodes: ["tick"], resultNode: "result", timerNode: "result" },
    executionKind: "schedule",
    deterministic: true,
    layout: schedule,
    program: Effect.gen(function* () {
      const counter = yield* Ref.make(0)
      const tick = Ref.updateAndGet(counter, (n) => n + 1)
      yield* tick.pipe(Effect.repeat(Schedule.spaced("10 millis").pipe(Schedule.take(2))))
      return yield* Ref.get(counter)
    }),
  },
  "effect-repeat-while-output": {
    title: "Effect.repeat",
    variant: "whileOutput",
    description: "Repeats while the previous output matches a condition.",
    snippet: lines(
      'import { Effect, Ref } from "effect"',
      "",
      "const program = Effect.gen(function*() {",
      "  const counter = yield* Ref.make(0)",
      "  const step = Ref.updateAndGet(counter, (n) => n + 1)",
      "",
      "  return yield* step.pipe(Effect.repeat({ while: (n) => n < 3 }))",
      "})",
    ),
    nodeSpec: { inputNodes: ["step"], resultNode: "result", timerNode: "result" },
    executionKind: "schedule",
    deterministic: true,
    layout: schedule,
    program: Effect.gen(function* () {
      const counter = yield* Ref.make(0)
      const step = Ref.updateAndGet(counter, (n) => n + 1)
      return yield* step.pipe(Effect.repeat({ while: (n) => n < 3 }))
    }),
  },
}

const assertCatalogCoverage = (): void => {
  const expected = new Set<string>(EXAMPLE_IDS)
  const actual = new Set(Object.keys(EXAMPLE_CATALOG))

  for (const id of expected) {
    if (!actual.has(id)) {
      throw new Error(`Missing example catalog entry for "${id}".`)
    }
  }

  for (const id of actual) {
    if (!expected.has(id)) {
      throw new Error(`Example catalog contains unknown id "${id}".`)
    }
  }
}

assertCatalogCoverage()
