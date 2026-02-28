import { Cause, Effect, Exit, Fiber, Option } from "effect"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { ExampleId } from "@/lib/examples/ids"
import type { ExampleExecutionState } from "@/lib/examples/model"
import { EXAMPLE_CATALOG } from "@/lib/examples/runtime"

const toFailedOrDiedState = (
  finishedAtMs: number,
  cause: Cause.Cause<unknown>,
): ExampleExecutionState<unknown> => {
  const errorOption = Cause.findErrorOption(cause)

  if (Option.isSome(errorOption)) {
    return {
      type: "failed",
      finishedAtMs,
      error: errorOption.value,
    }
  }

  return {
    type: "died",
    finishedAtMs,
    defect: Cause.squash(cause),
  }
}

const toTerminalState = (
  finishedAtMs: number,
  exit: Exit.Exit<unknown, unknown>,
): ExampleExecutionState<unknown> => {
  if (Exit.isSuccess(exit)) {
    return {
      type: "succeeded",
      finishedAtMs,
      value: exit.value,
    }
  }

  if (Cause.hasInterruptsOnly(exit.cause)) {
    return {
      type: "interrupted",
      finishedAtMs,
    }
  }

  return toFailedOrDiedState(finishedAtMs, exit.cause)
}

export interface ExampleController {
  readonly state: ExampleExecutionState<unknown>
  readonly run: () => void
  readonly stop: () => void
  readonly reset: () => void
}

export const useExampleController = (exampleId: ExampleId): ExampleController => {
  const [state, setState] = useState<ExampleExecutionState<unknown>>({ type: "idle" })
  const stateRef = useRef<ExampleExecutionState<unknown>>({ type: "idle" })
  const fiberRef = useRef<Fiber.RuntimeFiber<Exit.Exit<unknown, unknown>, never> | undefined>(
    undefined,
  )

  useEffect(() => {
    stateRef.current = state
  }, [state])

  const stop = useCallback(() => {
    const currentFiber = fiberRef.current

    if (currentFiber === undefined) {
      return
    }

    fiberRef.current = undefined
    const finishedAtMs = Date.now()

    setState({ type: "interrupted", finishedAtMs })
    void Effect.runPromise(Fiber.interrupt(currentFiber))
  }, [])

  const reset = useCallback(() => {
    const currentFiber = fiberRef.current

    if (currentFiber !== undefined) {
      fiberRef.current = undefined
      void Effect.runPromise(Fiber.interrupt(currentFiber))
    }

    setState({ type: "idle" })
  }, [])

  const run = useCallback(() => {
    if (stateRef.current.type === "running") {
      return
    }

    const runningSince = Date.now()
    setState({ type: "running", startedAtMs: runningSince })

    const program = EXAMPLE_CATALOG[exampleId].program.pipe(Effect.exit)
    const fiber = Effect.runFork(program)

    fiberRef.current = fiber

    void Effect.runPromise(Fiber.await(fiber)).then((exit) => {
      if (fiberRef.current !== fiber) {
        return
      }

      fiberRef.current = undefined
      setState(toTerminalState(Date.now(), exit))
    })
  }, [exampleId])

  useEffect(() => {
    return () => {
      const currentFiber = fiberRef.current

      if (currentFiber !== undefined) {
        fiberRef.current = undefined
        void Effect.runPromise(Fiber.interrupt(currentFiber))
      }
    }
  }, [])

  return useMemo(
    () => ({
      state,
      run,
      stop,
      reset,
    }),
    [reset, run, state, stop],
  )
}
