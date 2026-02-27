import { AlertTriangle, Ban, Check, Loader2, Skull, Sparkles } from "lucide-react"
import type { InteractiveTaskState } from "@/lib/interactive-examples/types"

interface EffectNodeLiteProps {
  readonly label: string
  readonly state: InteractiveTaskState<unknown, unknown>
  readonly resultLabel?: string | undefined
}

const getNodeContainerClasses = (state: InteractiveTaskState<unknown, unknown>) => {
  switch (state.tag) {
    case "running":
      return "border-sky-500/70 bg-sky-500/10"
    case "completed":
      return "border-emerald-500/70 bg-emerald-500/10"
    case "failed":
      return "border-amber-500/70 bg-amber-500/10"
    case "interrupted":
      return "border-zinc-500/70 bg-zinc-500/10"
    case "death":
      return "border-red-500/70 bg-red-500/10"
    case "idle":
      return "border-zinc-700 bg-zinc-900"
  }
}

const renderNodeContent = (
  state: InteractiveTaskState<unknown, unknown>,
  resultLabel: string | undefined,
) => {
  switch (state.tag) {
    case "running":
      return <Loader2 className="h-5 w-5 animate-spin text-sky-300" aria-hidden="true" />
    case "completed":
      return resultLabel === undefined ? (
        <Check className="h-5 w-5 text-emerald-300" aria-hidden="true" />
      ) : (
        <span className="font-mono text-sm text-emerald-200">{resultLabel}</span>
      )
    case "failed":
      return <AlertTriangle className="h-5 w-5 text-amber-300" aria-hidden="true" />
    case "interrupted":
      return <Ban className="h-5 w-5 text-zinc-300" aria-hidden="true" />
    case "death":
      return <Skull className="h-5 w-5 text-red-300" aria-hidden="true" />
    case "idle":
      return <Sparkles className="h-5 w-5 text-zinc-300" aria-hidden="true" />
  }
}

export function EffectNodeLite({ label, state, resultLabel }: EffectNodeLiteProps) {
  return (
    <div className="flex min-w-20 flex-col items-center gap-2">
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-md border transition-colors ${getNodeContainerClasses(state)}`}
      >
        {renderNodeContent(state, resultLabel)}
      </div>
      <span className="font-mono text-xs text-zinc-400">{label}</span>
    </div>
  )
}
