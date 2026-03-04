import { useAtom } from "@effect/atom-react"
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react"
import type { ExampleDefinition } from "@/lib/examples/constructors"
import { currentExampleCategoryAtom } from "@/atoms/visual-effect"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

export function InteractiveExamples() {
  const [category, setCategory] = useAtom(currentExampleCategoryAtom)
  const [indicatorRect, setIndicatorRect] = useState<IndicatorRect | undefined>(undefined)
  const rootElementReference = useRef<HTMLElement | undefined>(undefined)
  const resizeObserverReference = useRef<ResizeObserver | undefined>(undefined)
  const frameReference = useRef<number | undefined>(undefined)

  const updateIndicator = useCallback(() => {
    const rootElement = rootElementReference.current

    if (rootElement === undefined) {
      setIndicatorRect(undefined)
      return
    }

    const tabListElement = getTabListElement(rootElement)

    if (tabListElement === undefined) {
      setIndicatorRect(undefined)
      return
    }

    const activeTriggerElement = getActiveTriggerElement(tabListElement)

    if (activeTriggerElement === undefined) {
      setIndicatorRect(undefined)
      return
    }

    const tabListRect = tabListElement.getBoundingClientRect()
    const activeTriggerRect = activeTriggerElement.getBoundingClientRect()
    const nextRect: IndicatorRect = {
      left: activeTriggerRect.left - tabListRect.left,
      top: activeTriggerRect.top - tabListRect.top,
      width: activeTriggerRect.width,
      height: activeTriggerRect.height,
    }

    setIndicatorRect((currentRect) => {
      if (rectMatches(nextRect, currentRect)) {
        return currentRect
      }

      return nextRect
    })
  }, [])

  const scheduleIndicatorUpdate = useCallback(() => {
    const activeFrame = frameReference.current

    if (activeFrame !== undefined) {
      cancelAnimationFrame(activeFrame)
    }

    // Wait for next frame so aria-selected/data attrs are committed first.
    frameReference.current = requestAnimationFrame(() => {
      frameReference.current = undefined
      updateIndicator()
    })
  }, [updateIndicator])

  const rootReference = useCallback(
    (node: HTMLDivElement | null) => {
      resizeObserverReference.current?.disconnect()
      resizeObserverReference.current = undefined

      if (node === null) {
        rootElementReference.current = undefined
        setIndicatorRect(undefined)
        return
      }

      rootElementReference.current = node
      const tabListElement = getTabListElement(node)

      if (tabListElement !== undefined) {
        const resizeObserver = new ResizeObserver(() => {
          scheduleIndicatorUpdate()
        })

        resizeObserver.observe(tabListElement)
        resizeObserverReference.current = resizeObserver
      }

      scheduleIndicatorUpdate()
    },
    [scheduleIndicatorUpdate],
  )

  useEffect(() => {
    scheduleIndicatorUpdate()
  }, [category, scheduleIndicatorUpdate])

  useEffect(() => {
    const fontsApi = document.fonts

    if (fontsApi === undefined) {
      return
    }

    // Font loading can shift trigger widths without a resize event.
    void fontsApi.ready.then(() => {
      scheduleIndicatorUpdate()
    })
  }, [scheduleIndicatorUpdate])

  useEffect(() => {
    return () => {
      resizeObserverReference.current?.disconnect()

      const activeFrame = frameReference.current

      if (activeFrame !== undefined) {
        cancelAnimationFrame(activeFrame)
      }
    }
  }, [])

  return (
    <div
      ref={rootReference}
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

function TabsListContent({ indicatorRect }: { readonly indicatorRect: IndicatorRect | undefined }) {
  let indicatorStyle: CSSProperties | undefined = undefined

  if (indicatorRect !== undefined) {
    indicatorStyle = {
      left: `${indicatorRect.left}px`,
      width: `${indicatorRect.width}px`,
    }
  }

  return (
    <>
      {indicatorStyle && (
        <div
          style={indicatorStyle}
          className={cn(
            "pointer-events-none absolute bottom-0 z-0 h-px bg-zinc-100",
            "transition-[left,width] duration-200 ease-out motion-reduce:transition-none",
          )}
          aria-hidden="true"
        />
      )}

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

  return (
    <Tabs defaultValue={examples[0]} className="gap-0">
      <TabsList
        variant="line"
        className={cn(
          "no-scrollbar w-full overflow-x-auto overflow-y-hidden",
          "group-data-horizontal/tabs:h-auto",
          "justify-start gap-1 border-b border-zinc-800 px-4 py-3",
          "rounded-none bg-zinc-950",
        )}
      >
        {examples.map((example) => {
          const title = example.title
          const subtitle = example.subtitle
          return (
            <TabsTrigger
              key={example.key}
              value={example}
              className={cn(
                "h-auto flex-none px-3 py-1.5",
                "rounded-md font-mono text-sm whitespace-nowrap",
                "text-zinc-400 hover:text-white",
                "cursor-pointer transition-colors",
                "data-active:bg-zinc-900! data-active:text-white!",
                "group-data-[variant=line]/tabs-list:data-active:bg-zinc-900!",
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
  )
}

interface IndicatorRect {
  readonly left: number
  readonly top: number
  readonly width: number
  readonly height: number
}

const rectMatches = (nextRect: IndicatorRect, currentRect: IndicatorRect | undefined) => {
  if (currentRect === undefined) {
    return false
  }

  return (
    nextRect.left === currentRect.left &&
    nextRect.top === currentRect.top &&
    nextRect.width === currentRect.width &&
    nextRect.height === currentRect.height
  )
}

const getTabListElement = (root: HTMLElement): HTMLDivElement | undefined => {
  const tabListCandidate = root.querySelector('[data-slot="tabs-list"]')

  if (tabListCandidate instanceof HTMLDivElement) {
    return tabListCandidate
  }

  return undefined
}

const getActiveTriggerElement = (tabListElement: HTMLDivElement): HTMLButtonElement | undefined => {
  const activeTriggerCandidate = tabListElement.querySelector(
    '[data-slot="tabs-trigger"][aria-selected="true"]',
  )

  if (activeTriggerCandidate instanceof HTMLButtonElement) {
    return activeTriggerCandidate
  }

  return undefined
}
