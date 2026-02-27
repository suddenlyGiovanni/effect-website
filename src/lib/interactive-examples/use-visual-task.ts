import type { Effect } from "effect"
import { useEffect, useMemo, useSyncExternalStore } from "react"
import {
  createIdleInteractiveTaskState,
  type InteractiveTaskState,
} from "@/lib/interactive-examples/types"
import { InteractiveVisualTask } from "@/lib/interactive-examples/visual-task"

export const useVisualTask = <A, E>(
  name: string,
  create: () => Effect.Effect<A, E>,
  dependencies: ReadonlyArray<unknown> = [],
) => {
  const task = useMemo(() => {
    return new InteractiveVisualTask(name, create)
  }, [name, ...dependencies])

  useEffect(() => {
    return () => {
      task.reset()
    }
  }, [task])

  return task
}

export const useVisualTaskState = <A, E>(task: InteractiveVisualTask<A, E>) => {
  return useSyncExternalStore(
    task.subscribe,
    task.getState,
    (): InteractiveTaskState<A, E> => createIdleInteractiveTaskState(),
  )
}
