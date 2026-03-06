import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as PubSub from "effect/PubSub"
import * as ServiceMap from "effect/ServiceMap"
import * as Stream from "effect/Stream"
import type { VisualEffectSoundEvent } from "@/lib/examples/sound"

export class VisualEffectEventBus extends ServiceMap.Service<
  VisualEffectEventBus,
  {
    readonly publish: (event: VisualEffectSoundEvent) => Effect.Effect<void>
    readonly publishUnsafe: (event: VisualEffectSoundEvent) => void
    readonly events: Stream.Stream<VisualEffectSoundEvent>
  }
>()("website-v4/services/VisualEffectEventBus") {}

const makeVisualEffectEventBus = Effect.gen(function* () {
  const pubsub = yield* PubSub.sliding<VisualEffectSoundEvent>(128)

  return VisualEffectEventBus.of({
    publish: (event) => PubSub.publish(pubsub, event),
    publishUnsafe: (event) => PubSub.publishUnsafe(pubsub, event),
    events: Stream.fromPubSub(pubsub),
  })
})

export const visualEffectEventBusLayer = Layer.effect(
  VisualEffectEventBus,
  makeVisualEffectEventBus,
)
