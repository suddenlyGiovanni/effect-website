# Blog Index Page — Migration Specification

## Intent

Bring `effect-website/src/pages/blog/index.astro` to **visual + functional parity** with `landing/src/components/landing/BlogPage.tsx`, while staying Astro-native:

- Data comes from **content collections** (`getCollection`), never landing's static `BLOG_POSTS`/`BLOG_TAGS`.
- **Static parts are server-rendered Astro**; only the genuinely interactive surface is a **React island**.
- Page chrome **reuses `PageLayout`** — the same layout home (`src/pages/index.astro`) and podcast (`src/pages/podcast/index.astro`) use. Do **not** hand-roll `BaseLayout` + overlays + nav + footer.
- Icons use **lucide** (`@lucide/astro` server, `lucide-react` island). No remixicon, no `ri-*`.

**Landing is the source of truth for design** (layout, spacing, styling, interactions). When this spec and landing disagree, landing wins. effect-website chrome/data conventions win over landing's chrome/data.

## Static vs dynamic split

| Surface | Where | Why |
|---|---|---|
| Page chrome (overlays, nav, footer, `<main>`) | `PageLayout` | shared, no per-page JS |
| Hero (kicker + title) | Astro `<section>` | static |
| Featured post (incl. `<Image>`) | Astro `<section>` | static, always shown, image optimization |
| TWIE rail (cards) | Astro `<section>` | static content (no scroll-arrow JS — out of scope) |
| Header controls (category dropdown, sort, RSS link) | React island | stateful |
| Filtered/sorted/paginated post grid | React island | stateful |
| Empty state | React island | depends on filter state |
| URL `?category=` sync | React island | client-only |

One island only (`BlogControls`, `client:load`). TWIE "View all" links to the island's section anchor; it does **not** drive island filter state (decoupled, landing's TWIE rail and the grid filter share state but effect-website keeps TWIE server-static — "View all" is a plain `#blog-grid` anchor).

## Mandatory references

### effect-website (project)
- `src/pages/blog/index.astro` — target page (current baseline; Featured + TWIE already styled to landing, see Current state)
- `src/layouts/PageLayout.astro` — **the layout to reuse**
- `src/pages/index.astro`, `src/pages/podcast/index.astro` — exemplars of `PageLayout` + section structure + hero `.hero-grid`/`.hero-fade` pattern
- `src/content.config.ts` — `blog`, `blogAuthors`, `blogTags` schema
- `src/content/blog/tags.json` — tag taxonomy (id → name + color)
- `src/lib/constants/skip-link.ts` — `PAGE_TITLE_ID` (= `_top`, lives on `PageLayout`'s `<main>`)
- `astro.config.ts` — `@astrojs/react` enabled
- `package.json` — `react@^19`, `lucide-react@^0.577`, `@lucide/astro@^0.577`

### landing (read-only, design source of truth)
- `landing/src/components/landing/BlogPage.tsx` — canonical layout/styling/interactions
- `landing/src/data/blog.ts` — data **shape** only; effect-website uses content collections

> Always diff landing `BlogPage.tsx` before starting — landing churns. Last sync: landing HEAD `7bd50db`.

## Locked decisions

| # | Decision |
|---|---|
| 1 | Landing is design source of truth; re-verify before each phase |
| 2 | Data = content collections (`getCollection("blog"|"blogTags")`); never port `BLOG_POSTS`/`BLOG_TAGS`/`getAssetPath` |
| 3 | **Reuse `PageLayout`** for chrome. Remove the hand-rolled `BaseLayout`/`DitheredOverlay`/`GridRails`/`Navigation`/skip-link/`Footer`/`SectionDivider` block from `index.astro` |
| 4 | Static Astro: hero, Featured, TWIE rail. Dynamic React island: header controls + grid + pagination + empty state |
| 5 | Exactly one island (`BlogControls`, `client:load`) |
| 6 | Icons = lucide only (`@lucide/astro` server, `lucide-react` island). No remixicon/`ri-*` |
| 7 | Tag chip = landing **outlined monospace pill** (no color dot, no bg fill) |
| 8 | **Single column**. No sidebar. Remove the current `<aside>` Categories block |
| 9 | Add **sort newest/oldest** (landing) |
| 10 | URL state = single `?category=<tagId>` param; `sort`/`page` not synced |
| 11 | `featuredPost` = newest non-TWIE post with `featured: true`; exclude it from the grid |
| 12 | All post links are local relative: `/blog/${id}`. No external `effect.website` URLs |
| 13 | Links never serialize avatars/authors into the island (cards don't show them) |

## Current state (baseline already shipped)

In `src/pages/blog/index.astro` today:
- ✅ Content collections wired (`getCollection("blog"|"blogTags")`, tag/author refs resolved).
- ✅ `featuredCandidates`/`featuredPost` selection logic (decision 11) with DEV warn on >1.
- ✅ Hero: kicker `// Effect Blog`, title "Releases, write-ups, and notes / from the Effect team".
- ✅ Featured post: outlined monospace `Release` pill + outlined tag chips (excludes `effect`/`release`), `<Image>` cover, neutral hover, no authors/date row, wrapper `border-t border-zinc-800 py-5 md:py-6`.
- ✅ TWIE rail: plain `<h2>This Week in Effect</h2>` + monospace "View all" → `#blog-grid`; flat dark outlined cards w/ issue number + date + excerpt.
- ⚠️ Chrome is **hand-rolled** (BaseLayout + overlays + nav + skip-link + main + SectionDivider + Footer) → **migrate to `PageLayout`** (Phase A).
- ❌ "Latest" list still uses **color-dot bg pills** (old style) and a **sidebar `<aside>`** → replaced wholesale by the island (Phase B); chip style becomes outlined monospace inside the island.
- ❌ No category dropdown, sort, pagination, RSS link, or URL sync.

## Target `index.astro` structure

```astro
---
import { Image } from "astro:assets"
import { getCollection, getEntries, type CollectionEntry } from "astro:content"
import PageLayout from "@/layouts/PageLayout.astro"
import BlogControls from "@/components/blog/BlogControls"
// ...existing collection + featured + twie + categories logic stays...

// Build island props (serializable):
const serializedTags: SerializedTag[] = categories.map((c) => ({
  id: c.id, name: c.name, color: c.color, count: getTagCount(c.id),
})) // includes "all" first

const gridPosts = nonTwiePosts.filter((p) => !p.data.featured)
const serializedPosts: SerializedPost[] = gridPosts.map((post) => ({
  id: post.id,
  title: post.data.title,
  excerpt: post.data.excerpt,
  date: formatDate(post.data.date),
  dateMs: post.data.date.getTime(),
  href: `/blog/${post.id}`,
  tags: post.tags.map((t) => ({ id: t.id, name: t.data.name })),
}))
---

<PageLayout title="Blog | Effect" description="Get with the latest updates from the Effect ecosystem">
  <!-- Hero section: kicker + h1, with .hero-grid/.hero-fade bg (podcast pattern) -->
  <section class="relative overflow-hidden"> ... </section>

  <!-- Featured (server, <Image>) -->
  { featuredPost && <section> ... </section> }

  <div class="h-px w-full bg-zinc-800"></div>

  <!-- TWIE rail (server) -->
  { twiePosts.length > 0 && (<section aria-label="This Week in Effect posts"> ... </section>
     <div class="h-px w-full bg-zinc-800"></div>) }

  <!-- Interactive island: header controls + grid + pagination + empty -->
  <section id="blog-grid" class="relative">
    <div class="mx-auto w-full max-w-295 px-4">
      <BlogControls client:load posts={serializedPosts} tags={serializedTags} />
    </div>
  </section>
</PageLayout>

<style>
  .hero-grid { /* copy current blog hero-grid */ }
  .hero-fade { /* copy current blog hero-fade */ }
</style>
```

Notes:
- `PageLayout` already provides `DitheredOverlay`, `GridRails`, `Navigation`, `<main id={PAGE_TITLE_ID} class="... pt-16">`, and `Footer`. Delete those from `index.astro`.
- Drop the hand-rolled skip-link `<a>` — match home/podcast which rely on `PageLayout`/`Navigation`.
- Containers use `mx-auto w-full max-w-295 px-4` (already current).
- Keep the avatar `import.meta.glob` only if Featured still needs it; landing Featured shows no avatar → likely removable. Verify; remove if unused.

## Island data types

```ts
type SerializedTag = { id: string; name: string; color: string; count: number }
type SerializedPost = {
  id: string
  title: string
  excerpt: string
  date: string     // display, via formatDate()
  dateMs: number   // sort key
  href: string     // `/blog/${id}`
  tags: Array<{ id: string; name: string }>
}
```

## Phase A — Chrome → `PageLayout`

**File:** `src/pages/blog/index.astro`

- Replace the hand-rolled chrome wrapper with `<PageLayout title description>`.
- Move hero / featured / TWIE into `<section>`s inside `PageLayout` (keep their current markup + `.hero-grid`/`.hero-fade` `<style>`).
- Remove imports + markup now provided by `PageLayout`: `BaseLayout`, `DitheredOverlay`, `GridRails`, `Navigation`, `Footer`, `SectionDivider`, the skip-link `<a>`, and the outer `<main>`/wrapper `<div>`.
- Keep all collection/featured/twie/categories frontmatter logic.

**Acceptance:** page renders identically (hero/featured/TWIE) but through `PageLayout`; no duplicated nav/footer/overlays; `direnv exec . pnpm astro check` clean.

## Phase B — React island: header controls + grid + pagination + empty

**Mount:** replace the current "Latest" `<h2>` + list + `<aside>` sidebar block (everything inside `#blog-grid` after the TWIE divider) with `<BlogControls client:load posts tags />`.

**Files (new):** `src/components/blog/`
- `BlogControls.tsx` — island root (state + header + grid + pagination + empty)
- `PostCard.tsx` — single-row card
- `TagChip.tsx` — `TagChip` + `OverflowChip` helpers

**Layout:** single column, no sidebar. Landing ref `BlogPage.tsx:609-628`.

**Island props:** `{ posts: SerializedPost[]; tags: SerializedTag[] }` (tags includes `all` first).
**Island state:** `{ tag: string /* id|"all" */, sort: "newest"|"oldest", page: number }`.

### B1. Header row (landing `BlogPage.tsx:619-704`)
- Container: `mt-16 md:mt-20 flex flex-wrap items-baseline justify-between gap-4 border-b border-zinc-700/80 pb-4`.
- Left `<h2>`: `tag === "all" ? "All posts" : <tag name>`, `text-2xl font-semibold tracking-tight text-white`.
- Right group `flex flex-wrap items-baseline gap-x-4 gap-y-3 sm:gap-x-6`:
  - **Category dropdown** (`BlogPage.tsx:625-681`): trigger `Category: <name>` + `ChevronDown` (rotate when open); menu `<ul role="listbox">` absolute, each row = name + zero-padded count (`String(count).padStart(3,"0")`) + animated underline; click-outside + Escape close (useRef + `mousedown`/`keydown`). Sort tag rows by count desc, `all` first.
  - **Sort toggle** (`BlogPage.tsx:683-693`): cycles newest↔oldest, label `Newest`/`Oldest` (landing) + `ArrowUpDown` icon.
  - **RSS link** (`BlogPage.tsx:695-702`): `<a href="/rss.xml" aria-label="RSS feed">` `RSS` + `Rss` icon, monospace uppercase.

### B2. PostCard (landing `BlogPage.tsx:291-338`)
- Wrapper `<a href={post.href}>`: `group block -mx-4 border-t border-zinc-700/80 px-4 py-6 transition-colors first:border-t-0 hover:bg-zinc-900/60`.
- 12-col grid: left 8 = title + excerpt; right 4 (md+, `md:items-end md:flex-col`) = tags + date.
- Title: `text-lg font-semibold text-white`, animated underline + slide-in `ArrowRight` on hover.
- Excerpt: `mt-2 line-clamp-2 text-base leading-relaxed text-zinc-400 group-hover:text-zinc-200`.
- Tags: first 2 (alphabetical by id) via `TagChip`, plus `OverflowChip` for `+N` when `>2`.
- Date: `shrink-0 font-mono text-xs text-zinc-400 tabular-nums`.

### B3. TagChip helpers (decision 7; landing `BlogPage.tsx:316-329`)
```tsx
export function TagChip({ name }: { name: string }) {
  return <span className="inline-flex items-center rounded-md border border-zinc-600 px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] text-zinc-200 uppercase">{name}</span>
}
export function OverflowChip({ count }: { count: number }) {
  return <span className="inline-flex items-center rounded-md border border-zinc-700 px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] text-zinc-400 uppercase">+{count}</span>
}
```

### B4. Pagination (landing `BlogPage.tsx:719-789`)
- `POSTS_PER_PAGE = 12`; render only when `totalPages > 1`.
- Prev/Next: `h-8 w-8 rounded-md border border-zinc-700 ... disabled:opacity-30` + `ChevronLeft`/`ChevronRight`; disabled at bounds.
- Number buttons: monospace zero-padded (`padStart(2,"0")`), animated underline, `aria-current="page"` on active.
- Ellipsis `···` (U+22EF) zinc-500; window logic per landing (`<=7` show all; else 1 … window … last).
- Reset to page 1 on filter/sort change.
- On page change, smooth-scroll to grid top **only if** scrolled past header (`getBoundingClientRect().top < navbarHeight≈64`); never unconditionally.

### B5. Empty state (landing `BlogPage.tsx:793-831`)
- `FileSearch` icon, "No posts found", suggested tag buttons (`Release`/`Effect`/`TypeScript` outlined-monospace), "Clear all filters" outlined button → resets `tag=all`, `page=1`.

### Filter pipeline
1. `tag !== "all"` → keep `posts` where `tags.some(t => t.id === tag)`.
2. Sort by `dateMs` (`newest` desc / `oldest` asc).
3. Slice by page.

### Icons (lucide-react named)
```ts
import { ChevronDown, ChevronLeft, ChevronRight, ArrowRight, ArrowUpDown, Rss, FileSearch } from "lucide-react"
```

**Hydration:** `client:load`. SSR first paint = default state (`tag=all`, `sort=newest`, `page=1`).

**Acceptance:** header matches landing; single column, no sidebar; dropdown filters + closes on outside-click/Escape; sort reorders; PostCard hover anim; pagination bounds + conditional scroll; empty state + clear works; `astro check` clean.

## Phase C — URL sync `?category=<tagId>` (landing `BlogPage.tsx:432-503`)

Inside `BlogControls.tsx`:
- Lazy init: read `?category=` from `window.location.search`; if valid tag id (in `tags` prop) seed `tag`, else `all`.
- `syncUrl(tagId)`: set/delete `category`, `history.pushState({category}, "", url)`.
- `handleTagChange` → `syncUrl` + reset page + conditional scroll.
- `clearFilters` → `syncUrl("all")`.
- `popstate` listener (mount/cleanup) → re-read + reset page.
- Validate param against `tags` before applying. `sort`/`page` not synced. Use `pushState` (back-button navigable).

**Acceptance:** `/blog?category=effect` pre-filters; clicks update URL; back/forward navigates; refresh preserves.

## Phase D — RSS endpoint (optional, independent of design)

The header RSS link points to `/rss.xml`, which does not exist yet (neither does podcast's). Independent of the design migration — implement only if in scope for this pass.

- `pnpm add @astrojs/rss` (lockfile present → pnpm, not bun).
- New `src/pages/rss.xml.ts`: `getCollection("blog")`, newest-first, items `{title, description: excerpt, pubDate: date, link: /blog/${id}/, categories: tag ids}`, `site: context.site`, `customData: <language>en-us</language>`. No stylesheet, no enclosure.
- **Acceptance:** `GET /rss.xml` → 200 `application/xml`; all posts newest-first; `pnpm build` emits `dist/rss.xml`.

## Risks / gotchas

- Diff landing `BlogPage.tsx` before each phase (churn).
- Use lucide only; `lucide-react` tree-shakes via **named** imports.
- Pagination scroll is **conditional**, not always-on.
- Dropdown needs `useRef` + `mousedown`/`keydown` (Escape) click-outside.
- Island props must be JSON-serializable → dates pre-formatted (`date`) + numeric (`dateMs`); no `Date`/`ImageMetadata` objects passed.
- Featured image stays in Astro `<Image>`; do not pass it into the island.
- `PAGE_TITLE_ID = "_top"` is on `PageLayout`'s `<main>` — don't re-add a `<main>`.
- Package manager = **pnpm** via `direnv exec . pnpm`. Not bun.
- TWIE test post exists: `src/content/blog/this-week-in-effect-107/index.mdx`. Don't delete.

## Out of scope

Search bar; author sidebar/filter; collapsible/any sidebar; mobile `<select>`; TWIE conditional hide (always shown); TWIE rail scroll arrows / fade affordances / swipe hint; author bio popovers; tag color dots; comments/reactions; RSS featured-image enclosure; TWIE-only RSS feed.
