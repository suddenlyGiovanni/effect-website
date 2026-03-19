import { useAtom } from "@effect/atom-react"
import { cn, cssVars } from "@/lib/utils"
import { loadStateAtom, preconnectedAtom } from "../atoms/state"

const BACKGROUND_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 68 48"><path d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55c-2.93.78-4.63 3.26-5.42 6.19C.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z" fill="%23f00"/><path d="M45 24 27 14v20" fill="%23fff"/></svg>'

export function YouTubePlayButton({ id, title }: { readonly id: string; readonly title: string }) {
  const [loadState, setLoadState] = useAtom(loadStateAtom(id))
  const [preconnected, setPreconnected] = useAtom(preconnectedAtom(id))

  const setLoading = () => {
    if (loadState === "previewing") {
      setLoadState("loading")
    }
  }

  const warmConnections = () => {
    if (preconnected) return
    setPreconnected(true)
  }

  return (
    <button
      type="button"
      onClick={setLoading}
      onPointerOver={warmConnections}
      onFocus={warmConnections}
      aria-label={`Watch ${title}`}
      style={cssVars({
        "--button-url": `url('${BACKGROUND_IMAGE}')`,
      })}
      className="absolute inset-0 z-1 cursor-pointer rounded-lg border border-zinc-700 bg-transparent p-0"
    >
      <span className="sr-only">Watch {title}</span>
      <span
        aria-hidden="true"
        className={cn(
          "absolute top-1/2 left-1/2 h-12 w-17 -translate-1/2",
          "bg-transparent bg-(image:--button-url) bg-size-[100%_100%] bg-no-repeat",
          "opacity-80 grayscale transition-[filter,opacity] duration-100 ease-out",
          "group-hover:opacity-100 group-hover:filter-none",
        )}
      />
    </button>
  )
}
