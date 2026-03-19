import { ChevronDownIcon } from "lucide-react"
import * as React from "react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { SrtCue } from "../lib/transcript"

export function PodcastTranscript({ transcript }: { readonly transcript: ReadonlyArray<SrtCue> }) {
  const [activeIndex, setActiveIndex] = React.useState(0)

  const formatStartTime = (startTime: string) => {
    startTime = startTime.replace(/,\d+$/, "")
    const segments = startTime.split(":")
    const time = [segments.at(1), segments.at(2)]
    if (segments.at(0) !== "00") time.unshift(segments.at(0))
    return time.join(":")
  }

  return (
    <Collapsible defaultOpen={true} className="rounded-lg border border-zinc-700 bg-card">
      <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between rounded-lg bg-card px-4 py-3 transition-colors hover:bg-accent/50 data-panel-open:rounded-b-none">
        <h2 className="text-sm font-semibold">Transcript</h2>
        <ChevronDownIcon className="size-4 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t bg-card">
          <ScrollArea className="h-[400px] p-2 lg:h-[calc(100vh-420px)] lg:min-h-[300px]">
            <ul className="space-y-1 pr-2">
              {transcript.map((segment, index) => {
                const isActive = index === activeIndex
                const timestamp = formatStartTime(segment.startTime)
                return (
                  <li key={`${timestamp}-${index}`} className="list-none">
                    <button
                      // ref={isActive ? activeRef : null}
                      onClick={() => setActiveIndex(index)}
                      aria-label={`Jump to ${timestamp}`}
                      className={cn(
                        "group flex w-full cursor-pointer items-baseline gap-4 rounded-md bg-inherit px-3 py-2.5 text-left hover:bg-accent/50",
                        isActive && "bg-accent",
                      )}
                    >
                      <code className="shrink-0 font-mono text-xs leading-relaxed text-muted-foreground">
                        {timestamp}
                      </code>
                      <span
                        className={cn(
                          "min-w-0 flex-1 text-sm leading-relaxed text-zinc-300",
                          isActive
                            ? "text-foreground"
                            : "text-muted-foreground group-hover:text-foreground",
                        )}
                      >
                        {segment.text}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </ScrollArea>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
