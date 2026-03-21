import { ChevronDownIcon, PlayIcon } from "lucide-react"
import * as React from "react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { PodcastChapter } from "../domain"
import { useActiveChapter, useChapters, useSetActiveChapter } from "../context/PodcastContext"

export function PodcastChapters() {
  const chapters = useChapters()
  const activeChapter = useActiveChapter()
  const setActiveChapter = useSetActiveChapter()

  const handleSeek = React.useCallback(
    (chapter: PodcastChapter) => {
      setActiveChapter(chapter)
    },
    [setActiveChapter],
  )

  return (
    <Collapsible defaultOpen={false} className="rounded-lg border border-zinc-700 bg-card">
      <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between rounded-lg bg-card px-4 py-3 transition-colors hover:bg-accent/50 data-panel-open:rounded-b-none">
        <h2 className="text-sm font-semibold">Chapters</h2>
        <ChevronDownIcon className="size-4 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="border-t bg-card">
          <ScrollArea className="h-64 p-2 lg:max-h-[min(16rem,35vh)]">
            <ul className="pr-2">
              {chapters.map((chapter, index) => {
                const isActive = activeChapter ? activeChapter === chapter : index === 0

                return (
                  <li key={chapter.id} className="group m-0 list-none p-0">
                    <button
                      type="button"
                      onClick={() => handleSeek(chapter)}
                      aria-label={`Jump to ${chapter.startLabel}: ${chapter.title}`}
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-3 bg-inherit px-3 py-2.5 text-left transition-colors hover:bg-accent/50",
                        isActive && "bg-accent",
                        index === 0 && "rounded-t-md",
                        index === chapters.length - 1 && "rounded-b-md",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground group-hover:text-foreground",
                        )}
                      >
                        {isActive ? (
                          <PlayIcon className="size-3 transition-none" fill="currentColor" />
                        ) : (
                          index + 1
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "truncate text-sm font-medium transition-colors",
                            isActive
                              ? "text-foreground"
                              : "text-muted-foreground group-hover:text-foreground",
                          )}
                        >
                          {chapter.title}
                        </p>
                      </div>
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">
                        {chapter.startLabel}
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
