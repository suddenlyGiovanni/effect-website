export type InteractiveExampleId =
  | "effect-succeed"
  | "effect-fail"
  | "effect-die"
  | "effect-sleep"
  | "effect-orelse"

export type InteractiveTaskState<A, E> =
  | { readonly tag: "idle" }
  | { readonly tag: "running" }
  | { readonly tag: "completed"; readonly result: A }
  | { readonly tag: "failed"; readonly error: E }
  | { readonly tag: "interrupted" }
  | { readonly tag: "death"; readonly defect: unknown }

export type InteractiveTaskStateTag = InteractiveTaskState<unknown, unknown>["tag"]

export type InteractiveExampleMeta = {
  readonly id: InteractiveExampleId
  readonly name: string
  readonly description: string
  readonly code: string
}

export const interactiveTaskIsTerminal = <A, E>(state: InteractiveTaskState<A, E>) => {
  return (
    state.tag === "completed" ||
    state.tag === "failed" ||
    state.tag === "interrupted" ||
    state.tag === "death"
  )
}

export const createIdleInteractiveTaskState = <A, E>(): InteractiveTaskState<A, E> => {
  return { tag: "idle" }
}
