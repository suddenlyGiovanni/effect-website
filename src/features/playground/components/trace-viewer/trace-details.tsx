import { useMemo, useState } from "react"
import * as Duration from "effect/Duration"
import * as Option from "effect/Option"
import { ChevronRightIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Event, Span } from "../../domain/devtools"
import { formatDuration } from "./utils"
import { useAtomValue } from "@effect/atom-react"
import { selectedSpanAtom } from "../../atoms/devtools"

export function TraceDetails({ span }: { readonly span: Span }) {
  return (
    <div className="flex flex-col mb-1 p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-sm">
      <div className="flex justify-between mb-2 px-2 pb-1 border-b border-zinc-400 dark:border-zinc-600">
        <h3 className="text-lg font-bold">{span.label}</h3>
        {Option.isSome(span.duration) && (
          <div>
            <span className="mr-1">Duration:</span>
            <span className="text-zinc-500 dark:text-zinc-400">{formatDuration(span.duration.value)}</span>
          </div>
        )}
      </div>
      <TraceAttributes attributes={Array.from(span.attributes)} />
      <TraceEvents events={span.events} />
    </div>
  )
}

function TraceAttributes({ attributes }: { readonly attributes: ReadonlyArray<[string, unknown]> }) {
  const [open, setOpen] = useState(false)

  if (attributes.length === 0) {
    return (
      <div className="mb-2 pl-3 space-x-1 text-sm">
        <span>Attributes</span>
        <span className="text-xs text-zinc-500">( {attributes.length} )</span>
      </div>
    )
  }

  return (
    <div className="mb-2">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1 pl-2 py-0 bg-transparent cursor-pointer text-sm"
      >
        <ChevronRightIcon className={cn("h-3 w-3 transition-transform", open && "rotate-90")} />
        <span>Attributes</span>
        <span className="text-xs text-zinc-500">( {attributes.length} )</span>
      </button>
      {open && (
        <table className="w-full text-sm mt-1">
          <tbody>
            {attributes.map(([key, value]) => (
              <tr key={key} className="even:bg-zinc-100 odd:bg-zinc-200 dark:even:bg-zinc-800 dark:odd:bg-zinc-850">
                <td className="px-2 py-1 font-medium">{key}</td>
                <td className="px-2 py-1 w-full text-zinc-700 dark:text-zinc-300">{JSON.stringify(value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function TraceEvents({ events }: { readonly events: ReadonlyArray<Event> }) {
  const [open, setOpen] = useState(false)

  if (events.length === 0) {
    return (
      <div className="py-1 pl-3 bg-zinc-100 dark:bg-zinc-800 space-x-1 text-sm">
        <span>Events</span>
        <span className="text-xs text-zinc-500">( {events.length} )</span>
      </div>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1 w-full py-1 pl-2 bg-zinc-100 dark:bg-zinc-800 cursor-pointer text-sm"
      >
        <ChevronRightIcon className={cn("h-3 w-3 transition-transform", open && "rotate-90")} />
        <span>Events</span>
        <span className="text-xs text-zinc-500">( {events.length} )</span>
      </button>
      {open && (
        <div className="py-2 ml-2">
          {events.map((node, index) => (
            <TraceEvent key={index} node={node} />
          ))}
          <div className="mt-2 ml-2 text-xs text-zinc-500">
            Log timestamps are relative to the start time of the full trace.
          </div>
        </div>
      )}
    </div>
  )
}

function TraceEvent({ node }: { readonly node: Event }) {
  const selectedSpan = useAtomValue(selectedSpanAtom)
  const [open, setOpen] = useState(false)
  const eventTimestamp = useMemo(() => {
    if (selectedSpan !== undefined) {
      const traceStartTime = Option.getOrThrow(selectedSpan.startTime)
      const eventStartTime = Duration.nanos(node.event.startTime)
      const relativeTimestamp = Duration.subtract(eventStartTime, Duration.nanos(traceStartTime))
      return formatDuration(relativeTimestamp)
    }
    return ""
  }, [node.event.startTime, selectedSpan])

  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-900 p-0 cursor-pointer text-sm"
      >
        <ChevronRightIcon className={cn("h-3 w-3 transition-transform", open && "rotate-90")} />
        <span>{eventTimestamp}</span>
        {!open && <span className="ml-2 text-xs font-light">{node.event.name}</span>}
      </button>
      {open && (
        <table className="w-full text-sm mt-1">
          <tbody>
            <tr className="even:bg-zinc-100 odd:bg-zinc-200 dark:even:bg-zinc-800 dark:odd:bg-zinc-850">
              <td className="px-2 py-1 font-medium">message</td>
              <td className="px-2 py-1">{JSON.stringify(node.event.name)}</td>
            </tr>
            {Object.entries(node.event.attributes ?? {}).map(([key, value]) => (
              <tr key={key} className="even:bg-zinc-100 odd:bg-zinc-200 dark:even:bg-zinc-800 dark:odd:bg-zinc-850">
                <td className="px-2 py-1 font-medium">{key}</td>
                <td className="px-2 py-1 w-full">{JSON.stringify(value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
