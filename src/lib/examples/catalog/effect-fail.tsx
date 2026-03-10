import * as Effect from "effect/Effect"
import { defineExample, HighlightSelector, Notifications } from "../constructors"
import { ErrorResult } from "../results/error"

export const failExample = defineExample({
  label: "Effect.fail",
  description: "Create an effect that represents a recoverable error",
  code: {
    language: "typescript",
    source: 'const error = Effect.fail("Kaboom!")',
  },
  resultHighlight: HighlightSelector.Text({
    text: 'Effect.fail("Kaboom!")',
  }),
  build: () =>
    Effect.fail(new ErrorResult("Kaboom!")).pipe(
      Effect.tapError((error) =>
        Notifications.use(({ notify }) =>
          notify(error.message, {
            duration: "2 seconds",
            showOnHover: true,
          }),
        ),
      ),
    ),
})
