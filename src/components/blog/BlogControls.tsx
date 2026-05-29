import { ArrowUpDown, ChevronDown, ChevronLeft, ChevronRight, FileSearch, Rss } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { PostCard, type SerializedPost, type SerializedTag } from "./PostCard"

const POSTS_PER_PAGE = 12

const NAVBAR_HEIGHT = 64

type SortOrder = "newest" | "oldest"

function readCategoryFromUrl(tags: SerializedTag[]): string {
  if (typeof window === "undefined") return "all"
  const param = new URLSearchParams(window.location.search).get("category")
  if (param && tags.some((t) => t.id === param)) return param
  return "all"
}

export default function BlogControls({
  posts,
  tags,
}: {
  posts: SerializedPost[]
  tags: SerializedTag[]
}) {
  const [tag, setTag] = useState<string>(() => readCategoryFromUrl(tags))
  const [sort, setSort] = useState<SortOrder>("newest")
  const [page, setPage] = useState(1)
  const [catOpen, setCatOpen] = useState(false)

  const gridRef = useRef<HTMLDivElement>(null)
  const catRef = useRef<HTMLDivElement>(null)

  const activeTagName = useMemo(
    () => tags.find((t) => t.id === tag)?.name ?? "All",
    [tags, tag],
  )

  const sortedTags = useMemo(
    () =>
      [...tags].sort((a, b) => {
        if (a.id === "all") return -1
        if (b.id === "all") return 1
        return b.count - a.count
      }),
    [tags],
  )

  // ── Filter + sort pipeline ───────────────────────────────────────
  const filteredPosts = useMemo(() => {
    const base = tag === "all" ? posts : posts.filter((p) => p.tags.some((t) => t.id === tag))
    return [...base].sort((a, b) => {
      const cmp = a.dateMs - b.dateMs
      return sort === "newest" ? -cmp : cmp
    })
  }, [posts, tag, sort])

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / POSTS_PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const paginatedPosts = useMemo(
    () => filteredPosts.slice((safePage - 1) * POSTS_PER_PAGE, safePage * POSTS_PER_PAGE),
    [filteredPosts, safePage],
  )

  // ── Dropdown click-outside + Escape ──────────────────────────────
  useEffect(() => {
    if (!catOpen) return
    const handleClick = (e: MouseEvent) => {
      if (!catRef.current?.contains(e.target as Node)) setCatOpen(false)
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCatOpen(false)
    }
    window.addEventListener("mousedown", handleClick)
    window.addEventListener("keydown", handleKey)
    return () => {
      window.removeEventListener("mousedown", handleClick)
      window.removeEventListener("keydown", handleKey)
    }
  }, [catOpen])

  // ── URL sync ─────────────────────────────────────────────────────
  const syncUrl = useCallback((tagId: string) => {
    if (typeof window === "undefined") return
    const url = new URL(window.location.href)
    if (tagId === "all") url.searchParams.delete("category")
    else url.searchParams.set("category", tagId)
    window.history.pushState({ category: tagId }, "", url)
  }, [])

  // Conditional smooth-scroll: only when grid header scrolled past navbar
  const maybeScrollToGrid = useCallback(() => {
    const el = gridRef.current
    if (!el) return
    const { top } = el.getBoundingClientRect()
    if (top < NAVBAR_HEIGHT) {
      window.scrollTo({ top: top + window.scrollY - NAVBAR_HEIGHT, behavior: "smooth" })
    }
  }, [])

  const handleTagChange = useCallback(
    (tagId: string) => {
      setTag(tagId)
      setPage(1)
      syncUrl(tagId)
      maybeScrollToGrid()
    },
    [syncUrl, maybeScrollToGrid],
  )

  const clearFilters = useCallback(() => {
    setTag("all")
    setPage(1)
    syncUrl("all")
  }, [syncUrl])

  const goToPage = useCallback(
    (next: number) => {
      setPage(next)
      maybeScrollToGrid()
    },
    [maybeScrollToGrid],
  )

  useEffect(() => {
    const handlePopState = () => {
      setTag(readCategoryFromUrl(tags))
      setPage(1)
    }
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [tags])

  // ── Pagination window ────────────────────────────────────────────
  const pageItems = useMemo<Array<number | "ellipsis">>(() => {
    const items: Array<number | "ellipsis"> = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) items.push(i)
    } else {
      items.push(1)
      if (safePage > 3) items.push("ellipsis")
      const start = Math.max(2, safePage - 1)
      const end = Math.min(totalPages - 1, safePage + 1)
      for (let i = start; i <= end; i++) items.push(i)
      if (safePage < totalPages - 2) items.push("ellipsis")
      items.push(totalPages)
    }
    return items
  }, [totalPages, safePage])

  return (
    <div className="min-w-0 pb-24">
      {/* Header row: heading + Category filter + Sort + RSS */}
      <div
        ref={gridRef}
        className="mt-16 flex flex-wrap items-baseline justify-between gap-4 border-b border-zinc-700/80 pb-4 md:mt-20"
      >
        <h2 className="text-2xl font-semibold tracking-tight text-white">
          {tag === "all" ? "All posts" : activeTagName}
        </h2>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-3 sm:gap-x-6">
          {/* Category dropdown */}
          <div ref={catRef} className="relative">
            <button
              type="button"
              onClick={() => setCatOpen((o) => !o)}
              aria-haspopup="listbox"
              aria-expanded={catOpen}
              className="group inline-flex items-baseline gap-1.5 font-mono text-xs tracking-wider uppercase transition-colors"
            >
              <span className="hidden text-zinc-500 group-hover:text-zinc-400 sm:inline">
                Category:
              </span>
              <span className="text-zinc-200 group-hover:text-white">{activeTagName}</span>
              <ChevronDown
                aria-hidden="true"
                className={`h-3.5 w-3.5 self-center text-zinc-500 transition-transform group-hover:text-zinc-300 ${
                  catOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {catOpen && (
              <ul
                role="listbox"
                className="absolute right-0 z-20 mt-2 w-64 rounded-md border border-zinc-700 bg-zinc-950 py-2 shadow-lg shadow-black/40"
              >
                {sortedTags.map((cat) => {
                  const isActive = tag === cat.id
                  return (
                    <li key={cat.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        onClick={() => {
                          handleTagChange(cat.id)
                          setCatOpen(false)
                        }}
                        className={`group/item relative flex w-full items-baseline justify-between gap-3 px-4 py-2 text-left font-mono text-xs tracking-wider uppercase transition-colors ${
                          isActive ? "text-white" : "text-zinc-300 hover:text-white"
                        }`}
                      >
                        <span>{cat.name}</span>
                        <span className={`tabular-nums ${isActive ? "text-white" : "text-zinc-500"}`}>
                          {String(cat.count).padStart(3, "0")}
                        </span>
                        <span
                          className={`pointer-events-none absolute right-4 bottom-1 left-4 h-px origin-left bg-white transition-transform duration-300 ease-out ${
                            isActive ? "scale-x-100" : "scale-x-0 group-hover/item:scale-x-[0.08]"
                          }`}
                        />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
          {/* Sort toggle */}
          <button
            type="button"
            onClick={() => setSort((s) => (s === "newest" ? "oldest" : "newest"))}
            aria-label={`Sort: ${sort === "newest" ? "Newest" : "Oldest"} first. Click to toggle.`}
            className="group inline-flex items-baseline gap-1.5 font-mono text-xs tracking-wider uppercase transition-colors"
          >
            <span className="text-zinc-200 group-hover:text-white">
              {sort === "newest" ? "Newest" : "Oldest"}
            </span>
            <ArrowUpDown
              aria-hidden="true"
              className="h-3.5 w-3.5 self-center text-zinc-500 group-hover:text-zinc-300"
            />
          </button>
          {/* RSS feed */}
          <a
            href="/rss.xml"
            aria-label="RSS feed"
            className="group inline-flex items-baseline gap-1.5 font-mono text-xs tracking-wider text-zinc-200 uppercase transition-colors hover:text-white"
          >
            <span>RSS</span>
            <Rss
              aria-hidden="true"
              className="h-3.5 w-3.5 self-center text-zinc-500 group-hover:text-zinc-300"
            />
          </a>
        </div>
      </div>

      {/* Post grid */}
      {paginatedPosts.length > 0 ? (
        <>
          <div className="flex flex-col">
            {paginatedPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <>
              <div className="mt-12 h-px bg-zinc-800" />
              <nav
                aria-label="Blog pagination"
                className="mt-8 flex items-center justify-center gap-1"
              >
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => goToPage(safePage - 1)}
                  aria-label="Previous page"
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-700 text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white disabled:pointer-events-none disabled:opacity-30"
                >
                  <ChevronLeft aria-hidden="true" className="h-4 w-4" />
                </button>

                {pageItems.map((item, idx) =>
                  item === "ellipsis" ? (
                    <span key={`ellipsis-${idx}`} className="px-1.5 font-mono text-xs text-zinc-500">
                      ⋯
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => goToPage(item)}
                      aria-current={item === safePage ? "page" : undefined}
                      className={`group/page relative flex h-8 min-w-8 items-center justify-center px-2 font-mono text-xs tabular-nums transition-colors ${
                        item === safePage ? "text-white" : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      <span className={item === safePage ? "font-semibold" : ""}>
                        {String(item).padStart(2, "0")}
                      </span>
                      <span
                        className={`pointer-events-none absolute right-2 -bottom-0.5 left-2 h-px origin-left bg-white transition-transform duration-300 ease-out ${
                          item === safePage ? "scale-x-100" : "scale-x-0 group-hover/page:scale-x-[0.2]"
                        }`}
                      />
                    </button>
                  ),
                )}

                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => goToPage(safePage + 1)}
                  aria-label="Next page"
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-700 text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white disabled:pointer-events-none disabled:opacity-30"
                >
                  <ChevronRight aria-hidden="true" className="h-4 w-4" />
                </button>
              </nav>
            </>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900/60">
            <FileSearch aria-hidden="true" className="h-6 w-6 text-zinc-400" />
          </div>
          <p className="mt-6 text-base font-medium text-zinc-300">No posts found</p>
          <p className="mt-2 max-w-sm text-center text-sm leading-relaxed text-zinc-400">
            No posts match the current filters.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {["release", "effect", "typescript"].map((suggestedId) => {
              const suggested = tags.find((t) => t.id === suggestedId)
              if (!suggested) return null
              return (
                <button
                  key={suggested.id}
                  type="button"
                  onClick={() => handleTagChange(suggested.id)}
                  className="inline-flex items-center rounded-md border border-zinc-800 px-3 py-1.5 font-mono text-[10px] tracking-[0.12em] text-zinc-400 uppercase transition-colors hover:border-zinc-500 hover:text-white"
                >
                  {suggested.name}
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={clearFilters}
            className="mt-6 rounded-md border border-zinc-700 px-4 py-2 font-mono text-xs tracking-wider text-zinc-300 uppercase transition-colors hover:border-zinc-500 hover:text-white"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  )
}
