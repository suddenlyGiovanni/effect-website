import type { InteractiveExampleId, InteractiveExampleMeta } from "@/lib/interactive-examples/types"

const INTERACTIVE_EXAMPLE_MAP: Readonly<Record<InteractiveExampleId, InteractiveExampleMeta>> = {
  "effect-succeed": {
    id: "effect-succeed",
    name: "Effect.succeed",
    description: "Create an effect that always succeeds with a given value.",
    code: "const value = Effect.succeed(42)",
  },
  "effect-die": {
    id: "effect-die",
    name: "Effect.die",
    description: "Create an effect that terminates with an unrecoverable defect.",
    code: 'const death = Effect.dieMessage("FATAL: System corrupted")',
  },
  "effect-fail": {
    id: "effect-fail",
    name: "Effect.fail",
    description: "Create an effect that represents a recoverable error.",
    code: 'const error = Effect.fail("Kaboom!")',
  },
  "effect-orelse": {
    id: "effect-orelse",
    name: "Effect.orElse",
    description: "Try one effect, and if it fails, fall back to another effect.",
    code: "const result = Effect.orElse(shoot, () => question)",
  },
  "effect-sleep": {
    id: "effect-sleep",
    name: "Effect.sleep",
    description: "Suspend execution for a duration before continuing.",
    code: 'yield* Effect.sleep("3 seconds")',
  },
}

export const INTERACTIVE_EXAMPLES: ReadonlyArray<InteractiveExampleMeta> = [
  INTERACTIVE_EXAMPLE_MAP["effect-succeed"],
  INTERACTIVE_EXAMPLE_MAP["effect-die"],
  INTERACTIVE_EXAMPLE_MAP["effect-fail"],
  INTERACTIVE_EXAMPLE_MAP["effect-orelse"],
  INTERACTIVE_EXAMPLE_MAP["effect-sleep"],
]

export const getInteractiveExampleMeta = (id: InteractiveExampleId) => {
  return INTERACTIVE_EXAMPLE_MAP[id]
}

export const INTERACTIVE_EXAMPLE_ROW_1: ReadonlyArray<InteractiveExampleId> = [
  "effect-succeed",
  "effect-die",
  "effect-fail",
]

export const INTERACTIVE_EXAMPLE_ROW_2: ReadonlyArray<InteractiveExampleId> = [
  "effect-orelse",
  "effect-sleep",
]
