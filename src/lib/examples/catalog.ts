import type { ExampleDefinition } from "@/lib/examples/constructors"
import { allExample } from "./catalog/effect-all"
import { dieExample } from "./catalog/effect-die"
import { raceExample } from "./catalog/effect-race"

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
    examples: [allExample, raceExample],
  },
  schedule: {
    label: "Schedule",
    examples: [],
  },
  constructors: {
    label: "Constructors",
    examples: [dieExample],
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
