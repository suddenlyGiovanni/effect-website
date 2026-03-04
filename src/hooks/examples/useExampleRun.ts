import { useAtomValue } from "@effect/atom-react"
import * as Effect from "effect/Effect"
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult"
import { useCallback } from "react"
import type { AnyExampleDefinition } from "@/lib/examples/catalog"
import type { RunId } from "@/lib/examples/domain"
import { managerAtom } from "@/lib/examples/ui-state"
import { VisualEffectManager } from "@/services/VisualEffectManager"

export interface UseExampleRunInput {
  readonly example: AnyExampleDefinition
  readonly latestRunId: RunId | undefined
}

export interface UseExampleRunResult {
  readonly isReady: boolean
  readonly run: () => void
  readonly cancel: () => void
}

export const useExampleRun = ({
  example,
  latestRunId,
}: UseExampleRunInput): UseExampleRunResult => {
  const managerResult = useAtomValue(managerAtom)
  const manager = AsyncResult.isSuccess(managerResult) ? managerResult.value : undefined

  const run = useCallback(() => {
    if (manager === undefined) {
      return
    }

    Effect.runFork(example.effect.pipe(Effect.provideService(VisualEffectManager, manager)))
  }, [example, manager])

  const cancel = useCallback(() => {
    if (manager === undefined || latestRunId === undefined) {
      return
    }

    Effect.runFork(manager.cancelRun(latestRunId, "user"))
  }, [latestRunId, manager])

  return {
    isReady: manager !== undefined,
    run,
    cancel,
  }
}
