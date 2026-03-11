import type { ExampleDefinition } from "@/lib/examples/constructors"
import { allExample } from "./catalog/effect-all"
import { allShortCircuitExample } from "./catalog/effect-all-short-circuit"
import { acquireReleaseExample } from "./catalog/effect-acquirerelease"
import { addFinalizerExample } from "./catalog/effect-addfinalizer"
import { catchExample } from "./catalog/effect-catch"
import { dieExample } from "./catalog/effect-die"
import { eventuallyExample } from "./catalog/effect-eventually"
import { failExample } from "./catalog/effect-fail"
import { forEachExample } from "./catalog/effect-foreach"
import { partitionExample } from "./catalog/effect-partition"
import { promiseExample } from "./catalog/effect-promise"
import { raceExample } from "./catalog/effect-race"
import { raceAllExample } from "./catalog/effect-raceall"
import { repeatSpacedExample } from "./catalog/effect-repeat-spaced"
import { repeatWhileExample } from "./catalog/effect-repeat-while"
import { retryExponentialExample } from "./catalog/effect-retry-exponential"
import { retryRecursExample } from "./catalog/effect-retry-recurs"
import { sleepExample } from "./catalog/effect-sleep"
import { succeedExample } from "./catalog/effect-succeed"
import { syncExample } from "./catalog/effect-sync"
import { timeoutExample } from "./catalog/effect-timeout"
import { validateExample } from "./catalog/effect-validate"

export type ExampleCategory =
  | "concurrency"
  | "constructors"
  | "error-handling"
  | "schedule"
  | "scope"

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
    examples: [succeedExample, failExample, dieExample, syncExample, promiseExample, sleepExample],
  },
  "error-handling": {
    label: "Error Handling",
    examples: [
      allShortCircuitExample,
      catchExample,
      timeoutExample,
      eventuallyExample,
      partitionExample,
      validateExample,
    ],
  },
  scope: {
    label: "Scope",
    examples: [addFinalizerExample, acquireReleaseExample],
  },
}
