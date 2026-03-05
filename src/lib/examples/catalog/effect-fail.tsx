import * as Effect from "effect/Effect"
import { defineExample } from "../constructors"
import { ErrorResult } from "../results/error"

export const failExample = defineExample({
  label: "Effect.fail",
  description: "Create an effect that represents a recoverable error",
  build: ({ addStep }) =>
    addStep(Effect.fail(new ErrorResult("Kaboom!")), {
      label: "error",
    }),
})
