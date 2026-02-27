import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type TabId = "concurrency" | "constructors" | "error-handling" | "schedule" | "ref-scope"

interface TabConfig {
  readonly label: string
  readonly examples?: ReadonlyArray<string> | undefined
  readonly subTabs?: ReadonlyArray<SubTabConfig> | undefined
}

interface SubTabConfig {
  readonly id: string
  readonly label: readonly [title: string, subtitle?: string]
}

const TAB_CONFIGS: Record<TabId, TabConfig> = {
  concurrency: {
    label: "Concurrency",
  },
  constructors: {
    label: "Constructors",
  },
  "error-handling": {
    label: "Error Handling",
  },
  schedule: {
    label: "Schedule",
    subTabs: [
      {
        id: "effect-retry-recurs",
        label: ["Effect.retry", "times"],
      },
    ],
  },
  "ref-scope": {
    label: "Ref & Scope",
  },
} as const

export function InteractiveExamples() {
  return (
    <div className="border-r border-t border-zinc-800 shadow-2xl shadow-black/20">
      <Tabs defaultValue="concurrency">
        <TabsList variant="line">
          {Object.entries(TAB_CONFIGS).map(([tabId, tabConfig]) => (
            <TabsTrigger key={tabId} value={tabId}>
              {tabConfig.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}
