import * as React from "react"
import { cn } from "@/lib/utils"
import type { EmbedState } from "../services/PodcastEmbedManager"
import { useDebugInfo, useEmbedControls, useEmbedState } from "../context/EmbedManagerContext"

export function EmbedDebugger() {
  const { play, pause, seekTo } = useEmbedControls()
  const debugInfo = useDebugInfo()
  const state = useEmbedState()
  const [selectedLabels, setSelectedLabels] = React.useState<ReadonlySet<string>>(() => new Set())
  const [seekSeconds, setSeekSeconds] = React.useState("0")

  const events = React.useMemo(
    () =>
      debugInfo.map((raw) => {
        const parsed = parseDebugEvent(raw)
        const label = getDebugEventLabel(parsed)
        return { raw, parsed, label }
      }),
    [debugInfo],
  )

  const eventCounts = React.useMemo(() => {
    const counts = new Map<string, number>()

    for (const event of events) {
      counts.set(event.label, (counts.get(event.label) ?? 0) + 1)
    }

    return Array.from(counts.entries()).sort(([left], [right]) => left.localeCompare(right))
  }, [events])

  const availableLabels = React.useMemo(
    () => new Set(eventCounts.map(([label]) => label)),
    [eventCounts],
  )

  const filteredEvents = React.useMemo(() => {
    if (selectedLabels.size === 0) return events
    return events.filter((event) => selectedLabels.has(event.label))
  }, [events, selectedLabels])

  React.useEffect(() => {
    setSelectedLabels((current) => {
      const next = new Set(Array.from(current).filter((label) => availableLabels.has(label)))
      return next.size === current.size ? current : next
    })
  }, [availableLabels])

  const toggleLabel = React.useCallback((label: string) => {
    setSelectedLabels((current) => {
      const next = new Set(current)
      if (next.has(label)) {
        next.delete(label)
      } else {
        next.add(label)
      }
      return next
    })
  }, [])

  const clearFilters = React.useCallback(() => {
    setSelectedLabels(new Set())
  }, [])

  const submitSeekTo = React.useCallback(
    (event: React.SubmitEvent<HTMLFormElement>) => {
      event.preventDefault()

      const seconds = Number(seekSeconds)
      if (!Number.isFinite(seconds) || seconds < 0) return

      seekTo(seconds)
    },
    [seekSeconds, seekTo],
  )

  return (
    <section className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 text-zinc-100 shadow-lg shadow-black/20 backdrop-blur-sm">
      <header className="flex items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <p className="text-xs font-medium tracking-[0.24em] text-zinc-500 uppercase">
          Embed debugger
        </p>
        <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
          {debugInfo.length} events
        </div>
      </header>

      <div className="space-y-4">
        <section className="space-y-2 rounded-xl border border-sky-900/60 bg-linear-to-br from-sky-950/40 via-sky-950/15 to-zinc-900/90 p-3 shadow-[inset_0_1px_0_rgba(56,189,248,0.08)]">
          <p className="text-xs font-medium tracking-[0.18em] text-sky-300/80 uppercase">
            Controls
          </p>

          <div className="flex flex-wrap items-end gap-2 rounded-lg border border-sky-900/50 bg-black/15 p-2.5">
            <button
              type="button"
              onClick={() => play()}
              className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1.5 text-sm font-medium text-emerald-200 transition hover:border-emerald-400/60 hover:bg-emerald-500/15"
            >
              Play
            </button>
            <button
              type="button"
              onClick={() => pause()}
              className="rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 text-sm font-medium text-amber-100 transition hover:border-amber-400/60 hover:bg-amber-500/15"
            >
              Pause
            </button>
            <form onSubmit={submitSeekTo} className="flex flex-wrap items-end gap-2">
              <label className="flex min-w-34 flex-col gap-1">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  inputMode="decimal"
                  value={seekSeconds}
                  onChange={(event) => setSeekSeconds(event.target.value)}
                  placeholder="seconds"
                  className="rounded-md border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 font-mono text-sm text-zinc-100 transition outline-none placeholder:text-zinc-500 focus:border-sky-500/60"
                />
              </label>
              <button
                type="submit"
                className="rounded-md border border-sky-500/40 bg-sky-500/10 px-2.5 py-1.5 text-sm font-medium text-sky-100 transition hover:border-sky-400/60 hover:bg-sky-500/15"
              >
                Seek
              </button>
            </form>
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-2 xl:items-stretch">
          <section className="space-y-3 rounded-xl border border-amber-900/60 bg-linear-to-br from-amber-950/25 via-amber-950/10 to-zinc-900/90 p-4 shadow-[inset_0_1px_0_rgba(245,158,11,0.08)]">
            <div className="flex items-center justify-between gap-3 border-b border-amber-950/60 pb-3">
              <div>
                <p className="text-xs font-medium tracking-[0.18em] text-amber-300/80 uppercase">
                  State
                </p>
              </div>
              <div className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 font-mono text-xs font-medium text-amber-200">
                {state._tag}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <StatePill label="state" value={state._tag} />
              <StatePill label="playback" value={getEmbedPlaybackLabel(state)} />
              <StatePill label="pending" value={getEmbedPendingLabel(state)} />
            </div>

            <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80">
              <pre className="overflow-x-auto px-3 py-3 font-mono text-xs leading-5 text-zinc-300">
                <code>{JSON.stringify(state, null, 2)}</code>
              </pre>
            </div>
          </section>

          <section className="flex min-h-0 flex-col space-y-3 rounded-xl border border-emerald-900/60 bg-linear-to-br from-emerald-950/30 via-emerald-950/10 to-zinc-900/90 p-4 shadow-[inset_0_1px_0_rgba(16,185,129,0.08)] xl:h-full">
            <div className="flex items-center justify-between gap-3 border-b border-emerald-950/60 pb-3">
              <div>
                <p className="text-xs font-medium tracking-[0.18em] text-emerald-300/80 uppercase">
                  Events
                </p>
              </div>
              <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
                {filteredEvents.length} shown
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="flex min-w-0 flex-1 flex-wrap gap-2">
                {eventCounts.map(([label, count]) => {
                  const isActive = selectedLabels.size === 0 || selectedLabels.has(label)

                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => toggleLabel(label)}
                      className={cn(
                        "inline-flex items-center justify-between gap-2 rounded-full border px-3 py-1.5 text-xs transition",
                        isActive
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                          : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200",
                      )}
                    >
                      <span className="font-mono">{label}</span>
                      <span className="rounded-full bg-black/20 px-1.5 py-0.5 font-mono text-[10px]">
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>

              <button
                type="button"
                onClick={clearFilters}
                disabled={selectedLabels.size === 0}
                className="shrink-0 rounded-md border border-zinc-700 px-2.5 py-1 text-[11px] font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100 disabled:cursor-default disabled:opacity-40"
              >
                Clear
              </button>
            </div>

            <div className="min-h-0 flex-1">
              <div className="no-scrollbar min-h-0 space-y-3 overflow-y-auto pr-1 xl:h-full">
                {debugInfo.length === 0 && (
                  <div className="rounded-xl border border-dashed border-zinc-700/70 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-400">
                    Waiting for YouTube embed events...
                  </div>
                )}

                {filteredEvents
                  .slice()
                  .reverse()
                  .map((event, index) => {
                    return (
                      <article
                        key={`${event.label}-${index}`}
                        className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80"
                      >
                        <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-3 py-2">
                          <div className="min-w-0">
                            <p className="truncate font-mono text-xs text-zinc-200">
                              {event.label}
                            </p>
                            <p className="text-[11px] tracking-[0.22em] text-zinc-500 uppercase">
                              Event #{filteredEvents.length - index}
                            </p>
                          </div>
                          <div className="rounded-full bg-zinc-800 px-2 py-1 font-mono text-[11px] text-zinc-400">
                            {event.parsed === null ? "raw" : "json"}
                          </div>
                        </div>

                        <pre className="overflow-x-auto px-3 py-3 font-mono text-xs leading-5 text-zinc-300">
                          <code>{formatDebugEvent(event.parsed, event.raw)}</code>
                        </pre>
                      </article>
                    )
                  })}

                {filteredEvents.length === 0 && (
                  <div className="rounded-xl border border-dashed border-zinc-700/70 bg-zinc-950/40 px-4 py-6 text-center text-sm text-zinc-400">
                    No events match current filters.
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>
  )
}

const parseDebugEvent = (event: string): unknown | null => {
  try {
    return JSON.parse(event)
  } catch {
    return null
  }
}

const getDebugEventLabel = (event: unknown): string => {
  if (event !== null && typeof event === "object") {
    const maybeEvent = Reflect.get(event, "event")
    if (typeof maybeEvent === "string") {
      return maybeEvent
    }
  }

  return "unknown"
}

const formatDebugEvent = (parsed: unknown | null, raw: string): string => {
  if (parsed === null) return raw
  return JSON.stringify(parsed, null, 2)
}

function StatePill({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="rounded-full border border-amber-500/20 bg-amber-500/8 px-3 py-1.5 text-xs text-amber-100/90">
      <span className="text-zinc-400">{label}: </span>
      <span className="font-mono">{value}</span>
    </div>
  )
}

const getEmbedPlaybackLabel = (state: EmbedState): string => {
  if (state._tag !== "Active") return "-"
  return state.playback._tag
}

const getEmbedPendingLabel = (state: EmbedState): string => {
  if (state._tag !== "Active") return "-"
  return state.pending._tag
}
