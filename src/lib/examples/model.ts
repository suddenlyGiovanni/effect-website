export type ExampleLayout =
  | { readonly type: "single-node" }
  | { readonly type: "pipeline" }
  | { readonly type: "fallback-chain" }
  | { readonly type: "schedule" }
  | { readonly type: "ref-scope" }

export type ExampleExecutionState<Success> =
  | { readonly type: "idle" }
  | { readonly type: "running"; readonly startedAtMs: number }
  | { readonly type: "succeeded"; readonly finishedAtMs: number; readonly value: Success }
  | { readonly type: "failed"; readonly finishedAtMs: number; readonly error: unknown }
  | { readonly type: "died"; readonly finishedAtMs: number; readonly defect: unknown }
  | { readonly type: "interrupted"; readonly finishedAtMs: number }

export type ExampleStatusTone = "idle" | "running" | "success" | "failure" | "death" | "interrupted"

export interface StatusBadgeViewModel {
  readonly tone: ExampleStatusTone
  readonly label: string
}

export interface ResultLabelViewModel {
  readonly label: string
  readonly tone: Exclude<ExampleStatusTone, "idle" | "running">
}

export interface NodeDisplayViewModel {
  readonly nodeId: string
  readonly label: string
  readonly status: StatusBadgeViewModel
  readonly resultLabel?: ResultLabelViewModel | undefined
}

export interface ErrorDisplayModel {
  readonly title: string
  readonly detail: string
}

const unknownToDetail = (input: unknown): string => {
  if (input instanceof Error) {
    return input.message
  }

  if (typeof input === "string") {
    return input
  }

  if (
    typeof input === "number" ||
    typeof input === "boolean" ||
    input === null ||
    input === undefined
  ) {
    return String(input)
  }

  try {
    return JSON.stringify(input)
  } catch {
    return "Unserializable error payload"
  }
}

export const toFailureDisplayModel = (error: unknown): ErrorDisplayModel => {
  return {
    title: "Effect failed",
    detail: unknownToDetail(error),
  }
}

export const toDefectDisplayModel = (defect: unknown): ErrorDisplayModel => {
  return {
    title: "Effect died",
    detail: unknownToDetail(defect),
  }
}
