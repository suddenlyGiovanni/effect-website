import * as Effect from "effect/Effect"
import { defineExample } from "../constructors"

export const dieExample = defineExample({
  label: "Effect.die",
  description: "Create an effect that terminates with an unrecoverable defect",
  code: {
    language: "typescript",
    source: `const death = Effect.die(new Error("FATAL: System corrupted"))`,
  },
  resultHighlight: {
    _tag: "Text",
    text: 'Effect.die(new Error("FATAL: System corrupted"))',
  },
  build: ({ addStep }) => {
    return addStep(Effect.die(new Error("FATAL: System corrupted")), {
      label: "death",
      highlight: {
        _tag: "Text",
        text: 'Effect.die(new Error("FATAL: System corrupted"))',
      },
    })
  },
})
