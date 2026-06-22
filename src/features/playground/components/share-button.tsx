import { useCallback, useState, useRef, useEffect } from "react"
import { CheckIcon, CopyIcon, DownloadIcon, Loader2Icon } from "lucide-react"
import { useAtomSet, useAtomValue, useAtom } from "@effect/atom-react"
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult"
import { useWorkspaceHandle } from "../context/workspace"
import { copyLinkAtom, downloadAtom, shareAtom } from "../atoms/share"

export function ShareButton() {
  const handle = useWorkspaceHandle()
  const share = useAtomSet(shareAtom(handle))
  const [open, setOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  const onToggle = useCallback(() => {
    setOpen((prev) => {
      if (!prev) share()
      return !prev
    })
  }, [share])

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={onToggle}
        className="rounded-lg border border-zinc-300 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 cursor-pointer dark:border-zinc-700 dark:bg-zinc-800/40 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:hover:text-white"
      >
        Share
      </button>
      {open && <ShareContent />}
    </div>
  )
}

function ShareContent() {
  const handle = useWorkspaceHandle()
  const result = useAtomValue(shareAtom(handle))
  const [copied, setCopied] = useAtom(copyLinkAtom)
  const [downloaded, download] = useAtom(downloadAtom)

  const url = AsyncResult.isSuccess(result) ? result.value.url : ""
  const isWaiting = result.waiting
  const isFailed = AsyncResult.isFailure(result)

  return (
    <div className="absolute top-full right-0 mt-2 w-[400px] p-4 bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg shadow-lg z-50">
      <div className="flex flex-col space-y-2">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Share</h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Use the link to share this playground with others.</p>
      </div>
      <div className="flex items-center space-x-2 pt-4">
        <div className="flex-1">
          <input
            type="text"
            readOnly
            placeholder="Loading..."
            value={isFailed ? "An error occurred." : url}
            className="w-full h-9 px-3 text-sm rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none"
          />
        </div>
        <button
          type="button"
          className="h-9 px-3 rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isWaiting || isFailed}
          onClick={() => setCopied(handle)}
        >
          {AsyncResult.isSuccess(copied) ? (
            <CheckIcon size={16} />
          ) : isWaiting ? (
            <Loader2Icon className="animate-spin" size={16} />
          ) : (
            <CopyIcon size={16} />
          )}
        </button>
      </div>
      <div className="flex items-center space-x-2 pt-4">
        <p className="flex-1 text-sm text-zinc-600 dark:text-zinc-400">Or download the files locally</p>
        <button
          type="button"
          className="h-9 px-3 rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isWaiting || isFailed}
          onClick={() => download(handle)}
        >
          {AsyncResult.isSuccess(downloaded) ? (
            <CheckIcon size={16} />
          ) : isWaiting ? (
            <Loader2Icon className="animate-spin" size={16} />
          ) : (
            <DownloadIcon size={16} />
          )}
        </button>
      </div>
    </div>
  )
}
