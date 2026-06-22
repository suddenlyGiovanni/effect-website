import { Context, Effect, Layer } from "effect"
import * as Option from "effect/Option"

export class ShortenClient extends Context.Service<
  ShortenClient,
  {
    readonly shorten: (opts: { text: string }) => Effect.Effect<string>
    readonly retrieve: (opts: { hash: string }) => Effect.Effect<Option.Option<string>>
  }
>()("app/ShortenClient", {
  make: Effect.succeed({
    shorten: (_opts: { text: string }) => Effect.succeed("stub-hash"),
    retrieve: (_opts: { hash: string }) => Effect.succeed(Option.none<string>())
  })
}) {
  static readonly layer = Layer.effect(this, this.make)
}
