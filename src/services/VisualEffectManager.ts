import * as Effect from "effect/Effect"
import * as ServiceMap from "effect/ServiceMap"

export class VisualEffectManager extends ServiceMap.Service<VisualEffectManager>()(
  "VisualEffectManager",
  {
    make: Effect.gen(function* () {}),
  },
) {}
