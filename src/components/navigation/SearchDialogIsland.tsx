import { Search, X } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { NAVIGATION_EVENTS } from "@/lib/constants"
import { getNavigationLinks } from "@/lib/navigation"

type SearchDialogState = { readonly tag: "closed" } | { readonly tag: "open" }

const syncSearchScrollLock = (open: boolean) => {
  const html = document.documentElement
  const body = document.body

  if (open) {
    html.setAttribute("data-search-open", "true")
    body.setAttribute("data-search-open", "true")
    return
  }

  html.removeAttribute("data-search-open")
  body.removeAttribute("data-search-open")
}

export default function SearchDialogIsland() {
  const [state, setState] = useState<SearchDialogState>({ tag: "closed" })
  const [query, setQuery] = useState("")
  const inputRef = useRef<HTMLInputElement | null>(null)

  const links = useMemo(() => {
    const allPrimaryLinks = getNavigationLinks("desktop", "primary")
    if (query.trim().length === 0) {
      return allPrimaryLinks
    }

    const normalizedQuery = query.trim().toLowerCase()
    return allPrimaryLinks.filter((link) => {
      return link.label.toLowerCase().includes(normalizedQuery)
    })
  }, [query])

  const isOpen = state.tag === "open"

  const openDialog = () => {
    setState({ tag: "open" })
  }

  const closeDialog = () => {
    setState({ tag: "closed" })
  }

  useEffect(() => {
    const onOpen = () => {
      openDialog()
    }

    const onClose = () => {
      closeDialog()
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        openDialog()
      }

      if (event.key === "Escape") {
        closeDialog()
      }
    }

    window.addEventListener(NAVIGATION_EVENTS.SEARCH_OPEN, onOpen)
    window.addEventListener(NAVIGATION_EVENTS.SEARCH_CLOSE, onClose)
    window.addEventListener(NAVIGATION_EVENTS.MOBILE_MENU_OPEN, onClose)
    window.addEventListener("keydown", onKeyDown)

    return () => {
      window.removeEventListener(NAVIGATION_EVENTS.SEARCH_OPEN, onOpen)
      window.removeEventListener(NAVIGATION_EVENTS.SEARCH_CLOSE, onClose)
      window.removeEventListener(NAVIGATION_EVENTS.MOBILE_MENU_OPEN, onClose)
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [])

  useEffect(() => {
    if (!isOpen) {
      syncSearchScrollLock(false)
      return
    }

    syncSearchScrollLock(true)
    setQuery("")
    inputRef.current?.focus()
    window.dispatchEvent(new Event(NAVIGATION_EVENTS.SEARCH_OPENED))
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-250">
      <button
        type="button"
        onClick={closeDialog}
        className="absolute inset-0 bg-zinc-950/70 backdrop-blur-sm"
        aria-label="Close search"
      />

      <div className="relative mx-auto mt-24 w-[min(42rem,calc(100%-2rem))] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl">
        <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
          <Search className="h-4 w-4 text-zinc-500" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
            }}
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
            placeholder="THIS IS A PLACEHOLDER COMPONENT"
            aria-label="Search navigation"
          />
          <button
            type="button"
            onClick={closeDialog}
            className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
            aria-label="Close search"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-3">
          {links.length === 0 ? (
            <p className="rounded-md px-3 py-2 text-sm text-zinc-400">No matches</p>
          ) : (
            <ul className="space-y-1">
              {links.map((link) => (
                <li key={link.id}>
                  {link.kind === "external" ? (
                    <a
                      href={link.href}
                      target={link.target}
                      rel={link.rel}
                      className="flex items-center rounded-md px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <a
                      href={link.href}
                      className="flex items-center rounded-md px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
