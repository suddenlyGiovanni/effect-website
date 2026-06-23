import { useAtomSet } from "@effect/atom-react"
import { resetAtom } from "../atoms/import"
import { useWorkspaceHandle } from "../context/workspace"

export function ResetButton() {
  const handle = useWorkspaceHandle()
  const reset = useAtomSet(resetAtom)
  return (
    <button
      type="button"
      className="cursor-pointer rounded-lg border border-zinc-300 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900 dark:hover:text-white"
      onClick={() => reset(handle)}
    >
      Reset
    </button>
  )
}
