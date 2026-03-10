import type { ExampleDefinition } from "@/lib/examples/constructors"
import { allExample } from "./catalog/effect-all"
import { dieExample } from "./catalog/effect-die"
import { failExample } from "./catalog/effect-fail"
import { forEachExample } from "./catalog/effect-foreach"
import { raceExample } from "./catalog/effect-race"
import { raceAllExample } from "./catalog/effect-raceall"
import { repeatSpacedExample } from "./catalog/effect-repeat-spaced"
import { repeatWhileExample } from "./catalog/effect-repeat-while"
import { retryExponentialExample } from "./catalog/effect-retry-exponential"
import { retryRecursExample } from "./catalog/effect-retry-recurs"
import { succeedExample } from "./catalog/effect-succeed"

export type ExampleCategory =
  | "concurrency"
  | "constructors"
  | "error-handling"
  | "schedule"
  | "ref-scope"

export interface ExampleCatalogEntry {
  readonly label: string
  readonly examples: ReadonlyArray<ExampleDefinition>
}

export const EXAMPLES_CATALOG: Record<ExampleCategory, ExampleCatalogEntry> = {
  concurrency: {
    label: "Concurrency",
    examples: [allExample, raceExample, raceAllExample, forEachExample],
  },
  schedule: {
    label: "Schedule",
    examples: [
      retryRecursExample,
      retryExponentialExample,
      repeatSpacedExample,
      repeatWhileExample,
    ],
  },
  constructors: {
    label: "Constructors",
    examples: [succeedExample, failExample, dieExample],
  },
  "error-handling": {
    label: "Error Handling",
    examples: [],
  },
  "ref-scope": {
    label: "Ref & Scope",
    examples: [],
  },
}
