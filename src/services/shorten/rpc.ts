import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Option from "effect/Option"
import * as Schema from "effect/Schema"
import * as Rpc from "effect/unstable/rpc/Rpc"
import * as RpcGroup from "effect/unstable/rpc/RpcGroup"
import { ShortenError } from "./domain"
import { Shorten } from "./service"

export class ShortenRpcs extends RpcGroup.make(
  Rpc.make("shorten", {
    payload: { text: Schema.String },
    error: ShortenError,
    success: Schema.String,
  }),
  Rpc.make("retrieve", {
    payload: { hash: Schema.String },
    error: ShortenError,
    success: Schema.Option(Schema.String),
  }),
) {}

export const ShortenLayer = ShortenRpcs.toLayer(
  Effect.gen(function* () {
    const svc = yield* Shorten
    return {
      shorten: (params: { text: string }) => svc.shorten(params.text),
      retrieve: (params: { hash: string }) =>
        svc.retrieve(params.hash).pipe(Effect.map(Option.fromNullishOr)),
    }
  }),
).pipe(Layer.provide(Shorten.layer))
