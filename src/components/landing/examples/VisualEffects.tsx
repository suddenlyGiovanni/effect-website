import { useAtom } from "@effect/atom-react"
import { useState } from "react"
import type { ExampleDefinition } from "@/lib/examples/constructors"
import { currentExampleCategoryAtom } from "@/atoms/visual-effect"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TabsIndicator } from "@/components/ui/tabs-indicator"
import { useTabsIndicator } from "@/hooks/useTabsIndicator"
import { type ExampleCategory, EXAMPLES_CATALOG } from "@/lib/examples/catalog"
import { cn } from "@/lib/utils"
import { VisualEffect } from "./VisualEffect"

const ORDERED_CATEGORIES: ReadonlyArray<ExampleCategory> = [
  "concurrency",
  "schedule",
  "error-handling",
  "constructors",
  "ref-scope",
]

export function VisualEffects() {
  const [category, setCategory] = useAtom(currentExampleCategoryAtom)
  const { indicatorRect, rootRef } = useTabsIndicator(category)

  return (
    <div
      ref={rootRef}
      className={cn("border-t border-r border-zinc-800", "shadow-2xl shadow-black/20")}
    >
      <Tabs value={category} onValueChange={(category) => setCategory(category)} className="gap-0">
        <TabsList
          variant="line"
          className={cn(
            "relative isolate no-scrollbar w-full overflow-x-auto overflow-y-hidden p-0",
            "group-data-horizontal/tabs:h-auto",
            "border-b border-zinc-800 bg-zinc-950/90",
            "snap-x snap-mandatory",
            "justify-start md:justify-center",
          )}
        >
          <TabsListContent indicatorRect={indicatorRect} />
        </TabsList>

        {ORDERED_CATEGORIES.map((category) => {
          const entry = EXAMPLES_CATALOG[category]
          return (
            <TabsContent key={category} value={category} className="mt-0">
              <SubTabsContent examples={entry.examples} />
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}

function TabsListContent({
  indicatorRect,
}: {
  readonly indicatorRect: ReturnType<typeof useTabsIndicator>["indicatorRect"]
}) {
  return (
    <>
      <TabsIndicator rect={indicatorRect} variant="line" className="bg-zinc-100" />

      {ORDERED_CATEGORIES.map((category) => {
        const entry = EXAMPLES_CATALOG[category]

        return (
          <TabsTrigger
            key={category}
            value={category}
            className={cn(
              "relative z-10 text-zinc-400",
              // Mobile: horizontal scrolling tabs. Desktop: equal-width tabs.
              "h-auto min-w-40 flex-none md:min-w-0 md:flex-1 md:basis-0",
              "px-4 py-5 md:px-6",
              "font-mono text-sm tracking-wide whitespace-nowrap uppercase md:text-base",
              "justify-center text-center",
              "snap-start",
              "cursor-pointer overscroll-none transition-colors",
              "hover:text-zinc-200 data-active:text-white",
              "data-active:font-medium",
              "group-data-[variant=line]/tabs-list:data-active:after:opacity-0",
            )}
          >
            {entry.label}
          </TabsTrigger>
        )
      })}
    </>
  )
}

function SubTabsContent({ examples }: { readonly examples: ReadonlyArray<ExampleDefinition> }) {
  if (examples.length === 0) {
    return null
  }

  const [selectedExample, setSelectedExample] = useState(examples[0])
  const { indicatorRect, rootRef } = useTabsIndicator(selectedExample)

  return (
    <div ref={rootRef}>
      <Tabs
        value={selectedExample}
        onValueChange={(example) => setSelectedExample(example)}
        className="gap-0"
      >
        <TabsList
          variant="line"
          className={cn(
            "relative isolate no-scrollbar w-full overflow-x-auto overflow-y-hidden",
            "group-data-horizontal/tabs:h-auto",
            "justify-start gap-1 border-b border-zinc-800 px-4 py-3",
            "rounded-none bg-zinc-950",
          )}
        >
          <TabsIndicator rect={indicatorRect} variant="fill" className="rounded-md bg-zinc-900" />

          {examples.map((example) => {
            const title = example.title
            const subtitle = example.subtitle
            return (
              <TabsTrigger
                key={example.key}
                value={example}
                className={cn(
                  "relative z-10 h-auto flex-none px-3 py-1.5",
                  "rounded-md font-mono text-sm whitespace-nowrap",
                  "text-zinc-400 hover:text-white",
                  "cursor-pointer transition-colors",
                  "data-active:text-white!",
                  "group-data-[variant=line]/tabs-list:data-active:text-white!",
                  "hover:bg-zinc-800/50",
                  "after:opacity-0 group-data-[variant=line]/tabs-list:data-active:after:opacity-0",
                )}
              >
                <span>{title}</span>
                {subtitle && <span className="text-zinc-500">({subtitle})</span>}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {examples.map((example) => {
          return (
            <TabsContent
              key={example.key}
              value={example}
              className="mt-0 overflow-x-auto border-b border-zinc-800 p-4"
            >
              <VisualEffect example={example} />
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}
