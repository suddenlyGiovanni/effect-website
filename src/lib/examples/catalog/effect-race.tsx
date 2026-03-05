import * as Effect from "effect/Effect"
import * as Random from "effect/Random"
import { defineExample } from "../constructors"
import { EmojiResult, type EmojiKey } from "../results/emoji"

const getEmoji = Effect.fnUntraced(function* (emoji: EmojiKey): Effect.fn.Return<EmojiResult> {
  const result = new EmojiResult(emoji)
  const delay = yield* Random.nextBetween(500, 900)
  return yield* Effect.sleep(delay).pipe(Effect.as(result))
})

export const raceExample = defineExample({
  label: "Effect.race",
  code: {
    language: "typescript",
    source: `const tortoise = runFast("tortoise")
const achilles = runFast("achilles")

const winner = Effect.race(tortoise, achilles)`,
  },
  resultHighlight: {
    _tag: "Text",
    text: "Effect.race(tortoise, achilles)",
  },
  build: ({ addStep }) => {
    return Effect.race(
      addStep(getEmoji("Tortoise"), {
        label: "tortoise",
        highlight: { _tag: "Text", text: 'runFast("tortoise")' },
      }),
      addStep(getEmoji("Achilles"), {
        label: "achilles",
        highlight: { _tag: "Text", text: 'runFast("achilles")' },
      }),
    )
  },
})
