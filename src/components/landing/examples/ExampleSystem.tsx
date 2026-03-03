import { useMemo } from "react"
import { useAtomValue } from "@effect/atom-react"
import type { AnyExampleDefinition } from "@/lib/examples/catalog"
import {
  type StepRuntimeStatus,
  viewModelAtom,
} from "@/lib/examples/ui-state"
import { cn } from "@/lib/utils"
import { useExampleRun } from "@/hooks/examples/useExampleRun"
import { ExampleSystemHeader } from "./ExampleSystemHeader"

const STEP_STATUS_CLASS: Record<StepRuntimeStatus, string> = {
  idle: "border-zinc-800 text-zinc-500",
  running: "border-blue-500/70 text-blue-300",
  succeeded: "border-emerald-500/60 text-emerald-300",
  failed: "border-red-500/60 text-red-300",
  interrupted: "border-amber-500/70 text-amber-300",
}

export function ExampleSystem({
  example,
}: {
  readonly example: AnyExampleDefinition
}) {
  const atom = useMemo(() => viewModelAtom(example.key), [example.key])
  const view = useAtomValue(atom)
  const definition = view.definition ?? example

  const { run, cancel, isReady } = useExampleRun({
    example: definition,
    latestRunId: view.runtime.latestRunId,
  })

  const canCancel =
    view.runtime.runStatus === "running" && view.runtime.latestRunId !== undefined

  return (
    <article className="w-fit min-w-full overflow-hidden border border-zinc-800 bg-zinc-950 shadow-xl">
      <ExampleSystemHeader
        label={definition.label}
        runStatus={view.runtime.runStatus}
        isReady={isReady}
        canCancel={canCancel}
        onRun={run}
        onCancel={cancel}
      />

      <ol className="flex flex-col gap-2 p-4">
        {definition.blueprint.steps.map((step) => {
          const status = view.runtime.statusByNodeId.get(step.nodeId) ?? "idle"

          return (
            <li
              key={step.nodeId}
              className={cn(
                "flex items-center gap-3 rounded border bg-zinc-950/70 px-3 py-2",
                STEP_STATUS_CLASS[status],
              )}
            >
              <span className="w-7 shrink-0 text-right font-mono text-xs text-zinc-500">
                {step.order + 1}
              </span>

              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-mono text-xs text-zinc-100">
                  {step.label}
                </span>
                {step.description === undefined ? null : (
                  <span className="truncate text-xs text-zinc-500">
                    {step.description}
                  </span>
                )}
              </div>

              <span className="font-mono text-[11px] uppercase tracking-wider">
                {status}
              </span>
            </li>
          )
        })}
      </ol>
    </article>
  )
}
