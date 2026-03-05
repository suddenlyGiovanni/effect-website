import * as Effect from "effect/Effect"
import { defineExample } from "../constructors"

export const dieExample = defineExample({
  label: "Effect.all",
  description: "Combine multiple effects into one, returning results based on input structure",
  build: ({ addStep }) =>
    addStep(Effect.die(new Error("FATAL: System corrupted")), {
      label: "death",
    }),
})
