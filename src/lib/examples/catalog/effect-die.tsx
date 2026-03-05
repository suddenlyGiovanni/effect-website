import * as Effect from "effect/Effect"
import { defineExample } from "../constructors"

export const dieExample = defineExample({
  label: "Effect.die",
  description: "Create an effect that terminates with an unrecoverable defect",
  build: ({ addStep }) =>
    addStep(Effect.die(new Error("FATAL: System corrupted")), {
      label: "death",
    }),
})
