import * as Effect from "effect/Effect"
import { defineExample, HighlightSelector, Notifications } from "../constructors"

export const dieExample = defineExample({
  label: "Effect.die",
  description: "Create an effect that terminates with an unrecoverable defect",
  code: {
    language: "typescript",
    source: 'const death = Effect.die(new Error("FATAL: System corrupted"))',
  },
  resultHighlight: HighlightSelector.Text({
    text: 'Effect.die(new Error("FATAL: System corrupted"))',
  }),
  build: () =>
    Effect.die(new Error("FATAL: System corrupted")).pipe(
      Effect.tapDefect((defect) =>
        Notifications.use(({ notify }) =>
          notify(defect instanceof Error ? defect.message : "Died", {
            duration: "2 seconds",
            showOnHover: true,
          }),
        ),
      ),
    ),
})
