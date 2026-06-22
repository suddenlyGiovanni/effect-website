import { useState, useRef, useEffect } from "react"
import { useAtom, useAtomValue } from "@effect/atom-react"
import { ChevronDownIcon, CheckIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { rootSpansAtom } from "../../services/devtools"
import { selectedSpanIndexAtom, selectedSpanAtom } from "../../atoms/devtools"

export function TraceSelector() {
  const [open, setOpen] = useState(false)
  const rootSpans = useAtomValue(rootSpansAtom)
  const [span, setSelectedSpan] = useAtom(selectedSpanAtom)
  const selectedSpanIndex = useAtomValue(selectedSpanIndexAtom)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center justify-between min-w-[350px] px-3 py-2 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer"
      >
        <span className="truncate">{span?.traceId || "Select a trace..."}</span>
        <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-80" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-[350px] max-h-60 overflow-auto rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-lg z-50">
          {rootSpans.length === 0 ? (
            <div className="p-3 text-sm text-zinc-500">No traces found.</div>
          ) : (
            rootSpans.map((root, index) => (
              <button
                key={root.traceId}
                type="button"
                className={cn(
                  "w-full flex items-center px-3 py-2 text-sm text-left cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700",
                  selectedSpanIndex === index && "bg-zinc-100 dark:bg-zinc-700"
                )}
                onClick={() => {
                  setSelectedSpan(index)
                  setOpen(false)
                }}
              >
                <span className="flex-1 truncate">{root.traceId}</span>
                <CheckIcon
                  className={cn("ml-2 h-4 w-4", selectedSpanIndex === index ? "opacity-100" : "opacity-0")}
                />
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
