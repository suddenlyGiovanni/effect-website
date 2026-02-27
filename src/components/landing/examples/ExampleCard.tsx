import { ArrowRight, Play, RotateCcw, Square } from "lucide-react"
import { CodePane } from "@/components/landing/examples/CodePane"
import { EffectNodeLite } from "@/components/landing/examples/EffectNodeLite"
import {
  interactiveTaskIsTerminal,
  type InteractiveTaskState,
} from "@/lib/interactive-examples/types"

export type ExampleNodeSpec = {
  readonly key: string
  readonly label: string
  readonly state: InteractiveTaskState<unknown, unknown>
  readonly resultLabel?: string | undefined
}

interface ExampleCardProps {
  readonly title: string
  readonly description: string
  readonly code: string
  readonly nodes: ReadonlyArray<ExampleNodeSpec>
  readonly state: InteractiveTaskState<unknown, unknown>
  readonly onAction: () => void
}

const getActionState = (state: InteractiveTaskState<unknown, unknown>) => {
  if (state.tag === "running") {
    return {
      label: "Stop",
      icon: <Square className="h-4 w-4" aria-hidden="true" />,
    }
  }

  if (interactiveTaskIsTerminal(state)) {
    return {
      label: "Reset",
      icon: <RotateCcw className="h-4 w-4" aria-hidden="true" />,
    }
  }

  return {
    label: "Run",
    icon: <Play className="h-4 w-4" aria-hidden="true" />,
  }
}

export function ExampleCard({
  title,
  description,
  code,
  nodes,
  state,
  onAction,
}: ExampleCardProps) {
  const action = getActionState(state)

  return (
    <article className="flex h-full flex-col border border-zinc-800 bg-zinc-950/80">
      <div className="border-b border-zinc-800 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="font-mono text-base font-semibold text-white">{title}</h3>
            <p className="mt-1 text-sm leading-snug text-zinc-400">{description}</p>
          </div>

          <button
            type="button"
            onClick={onAction}
            className="inline-flex shrink-0 items-center gap-2 rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-900"
            aria-label={`${action.label} ${title} example`}
          >
            {action.icon}
            {action.label}
          </button>
        </div>
      </div>

      <div className="border-b border-zinc-800 p-5">
        <div className="flex min-h-24 flex-wrap items-center justify-start gap-5">
          {nodes.map((node, index) => (
            <div key={node.key} className="flex items-center gap-5">
              <EffectNodeLite
                label={node.label}
                state={node.state}
                resultLabel={node.resultLabel}
              />
              {index < nodes.length - 1 ? (
                <ArrowRight className="h-4 w-4 text-zinc-500" aria-hidden="true" />
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <CodePane code={code} />
    </article>
  )
}
