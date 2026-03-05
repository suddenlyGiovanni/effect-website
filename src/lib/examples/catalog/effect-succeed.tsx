import * as Effect from "effect/Effect"
import { defineExample } from "../constructors"
import { PrimitiveResult } from "../results/primitive"

export const succeedExample = defineExample({
  label: "Effect.succeed",
  description: "Create an effect that always succeeds with a given value",
  build: ({ addStep }) =>
    addStep(Effect.succeed(new PrimitiveResult(42)), {
      label: "value",
    }),
})
