import * as Effect from "effect/Effect"
import { defineExample } from "../constructors"
import { ErrorResult } from "../results/error"

export const failExample = defineExample({
  label: "Effect.fail",
  description: "Create an effect that represents a recoverable error",
  code: {
    language: "typescript",
    source: `const error = Effect.fail("Kaboom!")`,
  },
  resultHighlight: {
    _tag: "Text",
    text: 'Effect.fail("Kaboom!")',
  },
  build: () => Effect.fail(new ErrorResult("Kaboom!")),
})
