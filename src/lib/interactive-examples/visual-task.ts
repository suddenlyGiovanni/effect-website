import { Cause, Effect, Exit, Fiber, Option } from "effect"
import {
  createIdleInteractiveTaskState,
  type InteractiveTaskState,
} from "@/lib/interactive-examples/types"

type Listener = () => void

export class InteractiveVisualTask<A, E> {
  readonly name: string
  readonly create: () => Effect.Effect<A, E>

  #listeners = new Set<Listener>()
  #state: InteractiveTaskState<A, E> = createIdleInteractiveTaskState()
  #activeFiber: Fiber.RuntimeFiber<A, E> | undefined = undefined
  #runVersion = 0

  constructor(name: string, create: () => Effect.Effect<A, E>) {
    this.name = name
    this.create = create
  }

  getState = () => {
    return this.#state
  }

  subscribe = (listener: Listener) => {
    this.#listeners.add(listener)

    return () => {
      this.#listeners.delete(listener)
    }
  }

  #notify = () => {
    this.#listeners.forEach((listener) => {
      listener()
    })
  }

  #setState = (state: InteractiveTaskState<A, E>) => {
    this.#state = state
    this.#notify()
  }

  #isCurrentRun = (version: number) => {
    return version === this.#runVersion
  }

  run = async (): Promise<InteractiveTaskState<A, E>> => {
    if (this.#state.tag === "running") {
      return this.#state
    }

    const version = this.#runVersion + 1
    this.#runVersion = version

    this.#setState({ tag: "running" })

    const fiber = Effect.runFork(this.create())
    this.#activeFiber = fiber

    try {
      const exit = await Effect.runPromise(Fiber.await(fiber))

      if (!this.#isCurrentRun(version)) {
        return this.#state
      }

      Exit.match(exit, {
        onSuccess: (result) => {
          this.#setState({ tag: "completed", result })
        },
        onFailure: (cause) => {
          if (Cause.isInterruptedOnly(cause)) {
            this.#setState({ tag: "interrupted" })
            return
          }

          const failure = Cause.failureOption(cause)

          if (Option.isSome(failure)) {
            this.#setState({ tag: "failed", error: failure.value })
            return
          }

          const defect = Cause.dieOption(cause)

          if (Option.isSome(defect)) {
            this.#setState({ tag: "death", defect: defect.value })
            return
          }

          this.#setState({ tag: "death", defect: cause })
        },
      })
    } catch (error) {
      if (this.#isCurrentRun(version)) {
        this.#setState({ tag: "death", defect: error })
      }
    } finally {
      if (this.#activeFiber === fiber) {
        this.#activeFiber = undefined
      }
    }

    return this.#state
  }

  interrupt = () => {
    if (this.#state.tag !== "running") {
      return
    }

    const activeFiber = this.#activeFiber
    this.#activeFiber = undefined

    this.#runVersion = this.#runVersion + 1
    this.#setState({ tag: "interrupted" })

    if (activeFiber !== undefined) {
      Effect.runFork(Fiber.interrupt(activeFiber))
    }
  }

  reset = () => {
    const activeFiber = this.#activeFiber
    this.#activeFiber = undefined

    this.#runVersion = this.#runVersion + 1

    if (activeFiber !== undefined) {
      Effect.runFork(Fiber.interrupt(activeFiber))
    }

    this.#setState(createIdleInteractiveTaskState())
  }
}
