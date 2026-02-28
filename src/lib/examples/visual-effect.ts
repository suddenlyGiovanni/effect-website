import * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Atom from "effect/unstable/reactivity/Atom"
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult"

export interface VisualEffect<A, E = never> {
  /**
   * The label for display in the user interface.
   */
  readonly label: string
  /**
   * The reactive atom driving the state of the visual effect.
   */
  readonly atom: Atom.AtomResultFn<void, A, E>
  /**
   * The Effect program to run.
   */
  readonly effect: Effect.Effect<A, E>
}

export const make = <A, E = never>(
  label: string,
  effect: Effect.Effect<A, E>,
): VisualEffect<A, E> => ({
  label,
  atom: Atom.fn(() => effect),
  effect,
})

export type VisualState = "idle" | "running" | "completed" | "failed" | "interrupted" | "death"

export const stateOf = <A, E>(result: AsyncResult.AsyncResult<A, E>): VisualState => {
  if (AsyncResult.isInitial(result)) {
    return result.waiting ? "running" : "idle"
  }
  if (AsyncResult.isSuccess(result)) {
    return result.waiting ? "running" : "completed"
  }
  if (result.waiting) {
    return "running"
  }
  if (AsyncResult.isFailure(result)) {
    if (Cause.hasInterruptsOnly(result.cause)) {
      return "interrupted"
    }
    if (Cause.hasDies(result.cause)) {
      return "death"
    }
  }
  return "failed"
}
