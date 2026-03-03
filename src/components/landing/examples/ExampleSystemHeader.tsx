import { Play, Square } from "lucide-react"
import type { RunRuntimeStatus } from "@/lib/examples/ui-state"
import { cn } from "@/lib/utils"

const STATUS_CLASS: Record<RunRuntimeStatus, string> = {
  idle: "text-zinc-500",
  running: "text-blue-400",
  succeeded: "text-emerald-300",
  failed: "text-red-400",
  interrupted: "text-amber-300",
  rejected: "text-zinc-400",
}

export interface ExampleSystemHeaderProps {
  readonly label: string
  readonly runStatus: RunRuntimeStatus
  readonly isReady: boolean
  readonly canCancel: boolean
  readonly onRun: () => void
  readonly onCancel: () => void
}

export function ExampleSystemHeader({
  label,
  runStatus,
  isReady,
  canCancel,
  onRun,
  onCancel,
}: ExampleSystemHeaderProps) {
  return (
    <header className="flex items-center gap-4 border-b border-zinc-800 bg-zinc-900/80 px-5 py-4">
      <button
        type="button"
        onClick={canCancel ? onCancel : onRun}
        disabled={!isReady}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-md border border-zinc-700 bg-zinc-950 text-zinc-100",
          "transition-colors",
          canCancel ? "hover:border-amber-400 hover:text-amber-300" : "hover:border-zinc-500",
          !isReady && "cursor-not-allowed opacity-60",
        )}
        aria-label={canCancel ? "Cancel run" : "Run example"}
      >
        {canCancel ? <Square className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
      </button>

      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-mono text-sm font-semibold text-zinc-100">
          {label}
        </span>
        <span className={cn("font-mono text-xs uppercase tracking-wider", STATUS_CLASS[runStatus])}>
          {runStatus}
        </span>
      </div>

      <span className="font-mono text-xs text-zinc-500">
        {canCancel ? "click to cancel" : "click to run"}
      </span>
    </header>
  )
}
