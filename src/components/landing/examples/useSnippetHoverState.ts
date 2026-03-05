import { useAtom } from "@effect/atom-react"
import * as Atom from "effect/unstable/reactivity/Atom"
import * as React from "react"

const delayedSnippetHoverAtom = Atom.family((scopeKey: string) =>
  Atom.make<string | null>(null).pipe(Atom.withLabel(`snippet-hover:${scopeKey}`)),
)

export const useSnippetHoverState = (
  scopeKey: string,
  hoveredTarget: string | null,
  hideDelayMilliseconds: number,
): string | null => {
  const [delayedTarget, setDelayedTarget] = useAtom(delayedSnippetHoverAtom(scopeKey))
  const hideTimeoutReference = React.useRef<number | undefined>(undefined)

  React.useEffect(() => {
    const activeTimeout = hideTimeoutReference.current
    if (activeTimeout !== undefined) {
      window.clearTimeout(activeTimeout)
      hideTimeoutReference.current = undefined
    }

    if (hoveredTarget !== null) {
      setDelayedTarget(hoveredTarget)
      return
    }

    hideTimeoutReference.current = window.setTimeout(() => {
      setDelayedTarget(null)
      hideTimeoutReference.current = undefined
    }, hideDelayMilliseconds)

    return () => {
      const timeout = hideTimeoutReference.current
      if (timeout !== undefined) {
        window.clearTimeout(timeout)
        hideTimeoutReference.current = undefined
      }
    }
  }, [hideDelayMilliseconds, hoveredTarget, setDelayedTarget])

  React.useEffect(() => {
    return () => {
      const timeout = hideTimeoutReference.current
      if (timeout !== undefined) {
        window.clearTimeout(timeout)
        hideTimeoutReference.current = undefined
      }
    }
  }, [])

  return delayedTarget
}
