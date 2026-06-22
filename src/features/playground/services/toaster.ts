import { Context, Effect, Layer } from "effect"

export class Toaster extends Context.Service<
  Toaster,
  {
    readonly toast: (opts: { title: string; description: string }) => Effect.Effect<void>
  }
>()("app/Toaster", {
  make: Effect.succeed({
    toast: (_opts: { title: string; description: string }) => Effect.void
  })
}) {
  static readonly layer = Layer.effect(this, this.make)
}
