import { ArrowRight, Play, RotateCcw, Sparkles, Square, TriangleAlert } from "lucide-react"
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  TAB_CONFIGS,
  TAB_ORDER,
  isTabId,
  type ExampleId,
  type SubTabConfig,
  type TabId,
} from "@/lib/examples/ids"
import { useExampleController } from "@/lib/examples/orchestrator"
import { EXAMPLE_CATALOG } from "@/lib/examples/runtime"
import { cn } from "@/lib/utils"

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

export function InteractiveExamples() {
  const [activeTab, setActiveTab] = useState<TabId>("schedule")
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
  }, [activeTab, scheduleIndicatorUpdate])

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

  const handleTabValueChange = (nextValue: string) => {
    if (isTabId(nextValue)) {
      setActiveTab(nextValue)
    }
  }

  return (
    <div
      ref={rootReference}
      className={cn("border-t border-r border-zinc-800", "shadow-2xl shadow-black/20")}
    >
      <Tabs value={activeTab} onValueChange={handleTabValueChange} className="gap-0">
        <TabsList
          variant="line"
          className={cn(
            "relative isolate no-scrollbar w-full overflow-x-auto p-0",
            "group-data-horizontal/tabs:h-auto",
            "border-b border-zinc-800 bg-zinc-950/90",
            "snap-x snap-mandatory",
            "justify-start md:justify-center",
          )}
        >
          <TabsListContent indicatorRect={indicatorRect} />
        </TabsList>

        {TAB_ORDER.map((tabId) => {
          const tabConfig = TAB_CONFIGS[tabId]

          return (
            <TabsContent key={tabId} value={tabId} className="mt-0">
              {tabConfig.subTabs ? (
                <SubTabsContent tabId={tabId} subTabs={tabConfig.subTabs} />
              ) : (
                <GridContent tabId={tabId} examples={tabConfig.examples} />
              )}
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

      {TAB_ORDER.map((tabId) => {
        const tabConfig = TAB_CONFIGS[tabId]

        return (
          <TabsTrigger
            key={tabId}
            value={tabId}
            className={cn(
              "relative z-10 text-zinc-400",
              // Mobile: horizontal scrolling tabs. Desktop: equal-width tabs.
              "h-auto min-w-40 flex-none md:min-w-0 md:flex-1 md:basis-0",
              "px-4 py-5 md:px-6",
              "font-mono text-sm tracking-wide whitespace-nowrap uppercase md:text-base",
              "justify-center text-center",
              "snap-start",
              "cursor-pointer transition-colors",
              "hover:text-zinc-200 data-active:text-white",
              "data-active:font-medium",
              "group-data-[variant=line]/tabs-list:data-active:after:opacity-0",
            )}
          >
            {tabConfig.label}
          </TabsTrigger>
        )
      })}
    </>
  )
}

function SubTabsContent({
  tabId,
  subTabs,
}: {
  readonly tabId: TabId
  readonly subTabs: ReadonlyArray<SubTabConfig>
}) {
  const firstSubTab = subTabs[0]

  if (firstSubTab === undefined) {
    return (
      <div className="border-t border-zinc-800 p-6">
        <p className="font-mono text-sm text-zinc-200">Sub-tabs stub</p>
        <p className="mt-2 text-sm text-zinc-400">No sub-tabs configured for {tabId}.</p>
      </div>
    )
  }

  return (
    <Tabs defaultValue={firstSubTab.id} className="gap-0">
      <TabsList
        variant="line"
        className={cn(
          "no-scrollbar w-full overflow-x-auto",
          "group-data-horizontal/tabs:h-auto",
          "justify-start gap-1 border-b border-zinc-800 px-4 py-3",
          "rounded-none bg-zinc-950",
        )}
      >
        {subTabs.map((subTab) => {
          const subtitle = subTab.label[1]

          return (
            <TabsTrigger
              key={subTab.id}
              value={subTab.id}
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
              <span>{subTab.label[0]}</span>
              {subtitle === undefined ? null : <span className="text-zinc-500">({subtitle})</span>}
            </TabsTrigger>
          )
        })}
      </TabsList>

      {subTabs.map((subTab) => {
        return (
          <TabsContent
            key={subTab.id}
            value={subTab.id}
            className="mt-0 border-b border-zinc-800 p-6"
          >
            <ExampleRuntimePanel exampleId={subTab.id} />
          </TabsContent>
        )
      })}
    </Tabs>
  )
}

function ExampleRuntimePanel({ exampleId }: { readonly exampleId: ExampleId }) {
  const entry = EXAMPLE_CATALOG[exampleId]
  const { reset, run, state, stop } = useExampleController(exampleId)
  const [highlightAnchor, setHighlightAnchor] = useState<string | undefined>(undefined)
  const [tickMs, setTickMs] = useState<number>(Date.now())
  const running = state.type === "running"
  const canReset =
    state.type === "succeeded" ||
    state.type === "failed" ||
    state.type === "died" ||
    state.type === "interrupted"

  useEffect(() => {
    if (!running) {
      return
    }

    const interval = window.setInterval(() => {
      setTickMs(Date.now())
    }, 50)

    return () => {
      window.clearInterval(interval)
    }
  }, [running])

  const statusText = (() => {
    switch (state.type) {
      case "idle":
        return "idle"
      case "running":
        return "running"
      case "succeeded":
        return `succeeded: ${String(state.value)}`
      case "failed":
        return `failed: ${String(state.error)}`
      case "died":
        return `died: ${String(state.defect)}`
      case "interrupted":
        return "interrupted"
    }
  })()

  const actionLabel = running ? "stop" : canReset ? "reset" : "run"
  const actionHint = running
    ? "Click to stop"
    : canReset
      ? "Click to reset"
      : "Click to run an Effect"

  const handlePrimaryAction = () => {
    if (running) {
      stop()
      return
    }

    if (canReset) {
      reset()
      return
    }

    run()
  }

  const primaryIcon = (() => {
    if (running) {
      return <Square className="size-4 fill-current" />
    }

    if (canReset) {
      return <RotateCcw className="size-4" />
    }

    return <Play className="size-4 fill-current" />
  })()

  const elapsedMs = state.type === "running" ? Math.max(0, tickMs - state.startedAtMs) : undefined
  const timelineProgress =
    elapsedMs === undefined ? 0 : Math.min(96, Math.floor((elapsedMs * 0.08) / 10))

  const statusToneClass =
    state.type === "succeeded"
      ? "text-emerald-300"
      : state.type === "failed" || state.type === "died"
        ? "text-rose-300"
        : state.type === "interrupted"
          ? "text-amber-300"
          : state.type === "running"
            ? "text-sky-300"
            : "text-zinc-300"

  const codeMarkup = (() => {
    if (highlightAnchor === undefined) {
      return <code>{entry.snippet}</code>
    }

    const matchIndex = entry.snippet.indexOf(highlightAnchor)

    if (matchIndex < 0) {
      return <code>{entry.snippet}</code>
    }

    const before = entry.snippet.slice(0, matchIndex)
    const marked = entry.snippet.slice(matchIndex, matchIndex + highlightAnchor.length)
    const after = entry.snippet.slice(matchIndex + highlightAnchor.length)

    return (
      <code>
        {before}
        <mark className="rounded bg-zinc-100 px-0.5 text-zinc-950">{marked}</mark>
        {after}
      </code>
    )
  })()

  const renderNode = (label: string, key: string) => {
    const highlightKey = label.trim()
    const isResultNode = key === "result"

    const icon = (() => {
      if (state.type === "failed" || state.type === "died") {
        return <TriangleAlert className="size-5" />
      }

      if (state.type === "running") {
        return <Square className="size-4 fill-current" />
      }

      return <Sparkles className="size-5" />
    })()

    const nodeText =
      state.type === "succeeded" && isResultNode ? String(state.value).slice(0, 16) : undefined

    return (
      <button
        type="button"
        key={key}
        onMouseEnter={() => setHighlightAnchor(highlightKey)}
        onMouseLeave={() => setHighlightAnchor(undefined)}
        onFocus={() => setHighlightAnchor(highlightKey)}
        onBlur={() => setHighlightAnchor(undefined)}
        className={cn(
          "flex h-12 min-w-12 items-center justify-center rounded-md border px-2.5 transition-colors motion-reduce:transition-none",
          "focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:outline-none",
          highlightAnchor === highlightKey
            ? "border-zinc-200 bg-zinc-100 text-zinc-950"
            : "border-zinc-700 bg-zinc-950 text-zinc-300 hover:border-zinc-500 hover:text-zinc-100",
        )}
        aria-label={`Highlight ${highlightKey} in code`}
      >
        {nodeText === undefined ? (
          icon
        ) : (
          <span className="max-w-28 truncate font-mono text-[11px]">{nodeText}</span>
        )}
      </button>
    )
  }

  return (
    <div className="overflow-hidden border border-zinc-800 bg-black/70">
      <div className="border-b border-zinc-800 bg-zinc-900/70 px-4 py-3 md:px-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={handlePrimaryAction}
              className={cn(
                "mt-0.5 flex h-8 w-8 items-center justify-center rounded-md border border-zinc-600 text-white",
                running ? "bg-zinc-600" : canReset ? "bg-zinc-700" : "bg-emerald-600",
              )}
              aria-label={actionLabel}
            >
              {primaryIcon}
            </button>
            <div className="space-y-0.5">
              <p className="font-mono text-[17px] font-semibold text-zinc-100">
                {entry.title}
                {entry.variant === undefined ? null : (
                  <span className="ml-2 font-medium text-zinc-400">{entry.variant}</span>
                )}
              </p>
              <p className="text-sm text-zinc-400">{entry.description}</p>
            </div>
          </div>
          <div className="font-mono text-xs text-zinc-500">{actionHint}</div>
        </div>
      </div>

      <div className="border-b border-zinc-800 px-4 py-4 md:px-5">
        <div className="flex flex-wrap items-center gap-4">
          {entry.nodeSpec.inputNodes.map((label, index) => {
            return (
              <div key={`${label}-${index}`} className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-2">
                  {renderNode(label, `input-${index}`)}
                  <span className="font-mono text-xs text-zinc-500">{label}</span>
                </div>
                {index === entry.nodeSpec.inputNodes.length - 1 ? null : (
                  <ArrowRight className="size-4 text-zinc-600" />
                )}
              </div>
            )
          })}

          {entry.nodeSpec.resultNode === undefined ? null : (
            <>
              <ArrowRight className="size-4 text-zinc-600" />
              <div className="flex flex-col items-center gap-2">
                {renderNode(entry.nodeSpec.resultNode, "result")}
                <span className="font-mono text-xs text-zinc-500">{entry.nodeSpec.resultNode}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {entry.executionKind !== "schedule" ? null : (
        <div className="border-b border-zinc-800 px-4 py-0 md:px-5">
          <div className="relative h-12 overflow-hidden">
            <div className="absolute top-1/2 right-0 left-0 h-px -translate-y-1/2 bg-zinc-800" />
            {Array.from({ length: 20 }).map((_, index) => {
              return (
                <div
                  key={index}
                  className="absolute inset-y-0 w-px bg-zinc-800"
                  style={{ left: `${(index + 1) * 5}%` }}
                />
              )
            })}
            <div
              className={cn(
                "absolute top-0 bottom-0 w-0.5 transition-colors motion-reduce:transition-none",
                running ? "bg-zinc-100" : "bg-zinc-600",
              )}
              style={{ left: `${timelineProgress}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid gap-0 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="border-b border-zinc-800 p-4 md:border-r md:border-b-0 md:p-5">
          <pre className="overflow-x-auto rounded border border-zinc-800 bg-zinc-950/80 p-4 text-[19px] leading-8 text-zinc-300 md:text-base md:leading-7">
            {codeMarkup}
          </pre>
        </div>

        <div aria-live="polite" className="p-4 md:p-5">
          <p className="font-mono text-xs text-zinc-400">status</p>
          <p className={cn("mt-1 text-sm font-medium", statusToneClass)}>{statusText}</p>
        </div>
      </div>
    </div>
  )
}

function GridContent({
  tabId,
  examples,
}: {
  readonly tabId: TabId
  readonly examples?: ReadonlyArray<ExampleId> | undefined
}) {
  return (
    <div className="border-y border-zinc-800 p-6">
      <p className="font-mono text-sm text-zinc-200">Grid examples stub</p>
      <p className="mt-2 text-sm text-zinc-400">Tab: {tabId}</p>
      <p className="mt-1 text-sm text-zinc-500">Configured examples: {examples?.length ?? 0}</p>
    </div>
  )
}
