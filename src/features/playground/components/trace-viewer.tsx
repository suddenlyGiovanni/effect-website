import { TraceSelector } from "./trace-viewer/trace-selector"
import { TraceWaterfall } from "./trace-viewer/trace-waterfall"
import { TraceSummary } from "./trace-viewer/trace-summary"

export function TraceViewer() {
  return (
    <div className="h-full flex flex-col w-full p-2 bg-zinc-100 dark:bg-zinc-900">
      <div className="flex justify-between items-center">
        <div className="min-w-1/2 flex items-center shrink">
          <h1 className="mr-3 text-3xl font-bold">Trace</h1>
          <div>
            <TraceSelector />
          </div>
        </div>
      </div>
      <TraceSummary />
      <TraceWaterfall />
    </div>
  )
}
