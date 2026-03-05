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
  build: ({ addStep }) =>
    Effect.race(
      addStep(getEmoji("Tortoise"), {
        label: "tortoise",
      }),
      addStep(getEmoji("Achilles"), {
        label: "achilles",
      }),
    ),
})
