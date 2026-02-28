export type TabId = "concurrency" | "constructors" | "error-handling" | "schedule" | "ref-scope"

export type ExampleId =
  | "effect-all"
  | "effect-race"
  | "effect-raceall"
  | "effect-foreach"
  | "effect-succeed"
  | "effect-die"
  | "effect-fail"
  | "effect-sync"
  | "effect-promise"
  | "effect-sleep"
  | "effect-all-short-circuit"
  | "effect-orelse"
  | "effect-timeout"
  | "effect-eventually"
  | "effect-partition"
  | "effect-validate"
  | "ref-make"
  | "ref-update-and-get"
  | "effect-add-finalizer"
  | "effect-acquire-release"
  | "effect-retry-recurs"
  | "effect-retry-exponential"
  | "effect-repeat-spaced"
  | "effect-repeat-while-output"

export interface SubTabConfig {
  readonly id: ExampleId
  readonly label: readonly [title: string, subtitle?: string]
}

export interface TabConfig {
  readonly label: string
  readonly examples?: ReadonlyArray<ExampleId> | undefined
  readonly subTabs?: ReadonlyArray<SubTabConfig> | undefined
}

export const TAB_CONFIGS: Readonly<Record<TabId, TabConfig>> = {
  concurrency: {
    label: "Concurrency",
    subTabs: [
      { id: "effect-all", label: ["Effect.all"] },
      { id: "effect-race", label: ["Effect.race"] },
      { id: "effect-raceall", label: ["Effect.raceAll"] },
      { id: "effect-foreach", label: ["Effect.forEach"] },
    ],
  },
  constructors: {
    label: "Constructors",
    subTabs: [
      { id: "effect-succeed", label: ["Effect.succeed"] },
      { id: "effect-die", label: ["Effect.die"] },
      { id: "effect-fail", label: ["Effect.fail"] },
      { id: "effect-sync", label: ["Effect.sync"] },
      { id: "effect-promise", label: ["Effect.promise"] },
      { id: "effect-sleep", label: ["Effect.sleep"] },
    ],
  },
  "error-handling": {
    label: "Error Handling",
    subTabs: [
      { id: "effect-all-short-circuit", label: ["Effect.all", "short-circuit"] },
      { id: "effect-orelse", label: ["Effect.orElse"] },
      { id: "effect-timeout", label: ["Effect.timeout"] },
      { id: "effect-eventually", label: ["Effect.eventually"] },
      { id: "effect-partition", label: ["Effect.partition"] },
      { id: "effect-validate", label: ["Effect.validate"] },
    ],
  },
  "ref-scope": {
    label: "Ref & Scope",
    subTabs: [
      { id: "ref-make", label: ["Ref.make"] },
      { id: "ref-update-and-get", label: ["Ref.updateAndGet"] },
      { id: "effect-add-finalizer", label: ["Effect.addFinalizer"] },
      { id: "effect-acquire-release", label: ["Effect.acquireRelease"] },
    ],
  },
  schedule: {
    label: "Schedule",
    subTabs: [
      { id: "effect-retry-recurs", label: ["Effect.retry", "times"] },
      { id: "effect-retry-exponential", label: ["Effect.retry", "exponential"] },
      { id: "effect-repeat-spaced", label: ["Effect.repeat", "spaced"] },
      { id: "effect-repeat-while-output", label: ["Effect.repeat", "whileOutput"] },
    ],
  },
}

export const TAB_ORDER: ReadonlyArray<TabId> = [
  "schedule",
  "concurrency",
  "error-handling",
  "constructors",
  "ref-scope",
]

export const isTabId = (value: string): value is TabId => {
  return value in TAB_CONFIGS
}

const readAllExampleIds = (): ReadonlyArray<ExampleId> => {
  const ids: Array<ExampleId> = []

  for (const tabId of TAB_ORDER) {
    const tab = TAB_CONFIGS[tabId]

    if (tab.subTabs !== undefined) {
      for (const subTab of tab.subTabs) {
        ids.push(subTab.id)
      }
    }

    if (tab.examples !== undefined) {
      for (const exampleId of tab.examples) {
        ids.push(exampleId)
      }
    }
  }

  return ids
}

export const EXAMPLE_IDS: ReadonlyArray<ExampleId> = readAllExampleIds()
