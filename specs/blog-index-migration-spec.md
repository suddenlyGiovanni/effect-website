# Blog Index Page — Migration Specification

## Intent

Bring `effect-website/src/pages/blog/index.astro` to **visual + functional parity** with the current `landing/src/components/landing/BlogPage.tsx`, while preserving Astro-native simplifications (content collections, server-rendered Featured + TWIE rail, lucide icons instead of remixicon).

**Landing is the source of truth.** Whenever this spec and current landing disagree, landing wins. Re-sync this spec when landing changes.

## Mandatory references before implementation

### Project files (effect-website)

- `effect-website/src/pages/blog/index.astro` — current target page
- `effect-website/src/content.config.ts` — blog collection schema (`blog`, `blogAuthors`, `blogTags`)
- `effect-website/src/content/blog/tags.json` — tag taxonomy (id → name + color)
- `effect-website/src/content/blog/authors.json` — author registry
- `effect-website/src/assets/authors/*.png` — author avatars consumed by `import.meta.glob`
- `effect-website/src/layouts/BaseLayout.astro`
- `effect-website/src/components/DitheredOverlay.astro`
- `effect-website/src/components/GridRails.astro`
- `effect-website/src/components/navigation/Navigation.astro`
- `effect-website/src/components/Footer.astro`
- `effect-website/src/components/layout/SectionDivider.astro`
- `effect-website/src/lib/constants/skip-link.ts` — `PAGE_TITLE_ID`
- `effect-website/astro.config.ts` — confirms `@astrojs/react` integration enabled
- `effect-website/package.json` — confirms `react@^19`, `lucide-react@^0.577`, `@lucide/astro@^0.577` available

### Reference implementation (landing — read-only, source of truth)

- `landing/src/components/landing/BlogPage.tsx` — canonical layout, styling, interactions
- `landing/src/data/blog.ts` — only for understanding data shape; `effect-website` uses content collections

## Decisions (locked)

| # | Decision |
|---|---|
| 1 | **Landing is source of truth.** Re-verify against landing before each phase |
| 2 | Interactive surface = **one React island** (`client:load`), not vanilla `<script>` |
| 3 | TWIE rail always visible (no longer hidden when `this-week-in-effect` tag active — landing changed this) |
| 4 | `featuredPost` selection logic tightened to guarantee exactly one (newest, non-TWIE, `featured: true`). Featured chip filter excludes `effect`+`release` tags |
| 5 | TWIE post for verification: `effect-website/src/content/blog/this-week-in-effect-107/index.mdx` (already created) |
| 6 | RSS endpoint missing — moves from hero to header row per landing. Phase 1.5 adds `/rss.xml` via `@astrojs/rss` |
| 7 | Tag chip style = landing's **outlined monospace pill** (no color dot, no background). Reverts effect-website's bg-pill style |
| 8 | Layout = **single column**. No sidebar. Sidebar removed from landing |
| 9 | No search bar. No author filter. No collapsible sidebar. No mobile `<select>`. All removed from landing |
| 10 | Add **sort by newest/oldest** to scope (new in landing) |
| 11 | URL state sync uses single `?category=X` param (matches landing) |

## Implementation output file plan

```
effect-website/
├── src/
│   ├── pages/
│   │   ├── blog/index.astro                      (edit: Phase 0, 1, 2 mount, 3 wiring)
│   │   └── rss.xml.ts                            (new — Phase 1.5)
│   └── components/blog/
│       ├── BlogControls.tsx                      (new — Phase 2 island: header + grid + pagination)
│       ├── PostCard.tsx                          (new — single-row card; inside island or .astro)
│       ├── TagChip.tsx / TagChip.astro           (new — canonical chip helper)
│       └── (optional) TwieCard.astro             (extract Phase 1 if file grows long)
```

New dependency: `@astrojs/rss` (Phase 1.5). Use `lucide-react` for island icons, `@lucide/astro` for server-rendered icons.

## Existing code interaction policy

- Treat current `index.astro` as baseline. Do not regress Astro-native simplifications: content collections, server-rendered Featured + TWIE rail, lucide icons.
- Do not introduce remixicon CSS or `ri-*` classes anywhere — translate every `ri-*` reference from landing to lucide.
- Do not port landing's `getAssetPath` / `BLOG_POSTS` array — data comes from `getCollection("blog")`.
- Do not port landing's hardcoded `BLOG_TAGS` — taxonomy comes from `getCollection("blogTags")`.
- Skip-to-main: keep current `PAGE_TITLE_ID` mechanism. Add visible focus styling.
- **Currently shipped Phase 1 work** (emerald Featured/Release badge, TWIE violet pill w/ bg) **conflicts with landing's new outlined-monospace direction** — Phase 1-revision item below.

## Phases

### Phase 0 — Tighten `featuredPost` selection ✅ done

**Status:** shipped.

**Reference:**
```ts
const featuredCandidates = allPosts
  .filter((post) => post.data.featured && !post.tags.some(isTWIE))
  .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())

if (import.meta.env.DEV && featuredCandidates.length > 1) {
  console.warn(
    `[blog] multiple posts marked featured (${featuredCandidates.length}): ` +
      featuredCandidates.map((p) => p.id).join(", ") +
      ` — using newest`,
  )
}

const featuredPost = featuredCandidates[0]
```

### Phase 1 — Server-side visual upgrades (no JS) ✅ done, but needs revision

**Original Phase 1 (shipped):**
- ✅ Featured badge "Release"/"Featured" emerald pill — **needs revision per Phase 1-R**
- ✅ TWIE rail header w/ `Newspaper` icon + subtitle + "View all" → `#blog-grid` — **needs revision per Phase 1-R**
- ✅ TWIE card violet accent + "TWIE" pill + hover `ArrowUpRight` — **needs revision per Phase 1-R**
- ✅ Skip-to-main link styled — keep as-is

### Phase 1-R — Re-sync visual upgrades to landing's new style

Landing pivoted to **outlined monospace pill aesthetic**. Update Phase 1 work to match.

**File:** `effect-website/src/pages/blog/index.astro`

#### Item 1: Featured "Release" badge → outlined monospace pill

Landing reference: `BlogPage.tsx:60-65`

```html
<span class="inline-flex items-center rounded-md border border-zinc-400 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-[0.18em] text-white uppercase">
  Release
</span>
```

- Drop emerald color, dot, ring
- Drop dynamic "Release"/"Featured" toggle — landing always shows "Release" on featured post; effect-website should match
- Label is literal `Release`

#### Item 2: Other featured tag chips (excluding `effect`+`release`) → outlined monospace pill

Landing reference: `BlogPage.tsx:66-73`

```html
<span class="inline-flex items-center rounded-md border border-zinc-400 px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] text-zinc-200 uppercase">
  {tag.name}
</span>
```

- Note: this is the **featured-context** variant (border zinc-400, text zinc-200, tracking 0.12em). PostCard variant differs slightly (Phase 1.75).
- Keep existing filter: skip tags w/ id `effect` or `release` (decision 4)
- Drop color dot. Drop bg.

#### Item 3: FeaturedPost body — drop authors row + meta row

Landing reference: shows FeaturedPost now has only label-row, title, excerpt (no authors, no date). Mobile cover image moved.

- Remove `featuredPost.authors.map(...)` block (`index.astro` Featured author rendering)
- Remove `<time>{formatDate(featuredPost.data.date)}</time>` block in featured
- Featured card hover: change from emerald-tinged shadow to landing's neutral hover: `hover:border-zinc-600 hover:bg-zinc-900/70 transition-colors duration-200` (drop `hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-emerald-500/[0.08]`)
- Card border: `border-zinc-800` (not `border-[#2D3138]`); bg: `bg-zinc-900/40` (not `bg-[#191C21]`)
- Card radius: `rounded-md` (not `rounded-lg`)

#### Item 4: TWIE rail header → simpler title-only + monospace "View all"

Landing reference: `BlogPage.tsx:171-201`

- Remove `Newspaper` icon + violet square + subtitle (shipped in Phase 1)
- Reduce to plain `<h2 class="text-xl font-semibold text-white">This Week in Effect</h2>`
- Right side: "View all" link styled as `font-mono text-xs tracking-wider text-zinc-200 uppercase transition-colors hover:text-white`
- Section padding: `pt-16 pb-8 md:pt-20 md:pb-10` (not `py-12`)
- TWIE rail always visible (drop any conditional hide). Already always rendered in current effect-website — no change needed there.

#### Item 5: TWIE card → use landing's flat dark style

Landing reference: `BlogPage.tsx:248-274` (current TWIE card markup w/ new styling)

- Card classes: `group relative flex w-[280px] shrink-0 flex-col justify-between overflow-hidden rounded-md border border-zinc-800 bg-zinc-900/40 p-4 pb-5 transition-colors duration-200 hover:border-zinc-600 hover:bg-zinc-900/70`
- Drop violet gradient top accent (shipped in Phase 1)
- Drop "TWIE" violet-dot pill (shipped in Phase 1). Landing keeps a simple uppercase "TWIE" badge — verify against landing source and port exact classes
- Drop bottom-row `ArrowUpRight` (shipped in Phase 1) unless landing has it; verify

#### Item 6: Hero title + RSS button

Landing reference: title is `"Releases, write-ups, and notes <br> from the Effect team"`. RSS button no longer in hero; moved to header row above Latest grid.

- Update hero `<h1>`:
  ```astro
  Releases, write-ups, and notes
  <br class="hidden md:block" />
  from the Effect team
  ```
- Update kicker `// Blog` → `// Effect Blog` (matches landing)
- **Remove RSS button from hero** (`index.astro:110-117`). RSS link is rendered by Phase 2 header row instead.

#### Item 7: Featured wrapper padding

- Wrapper: `border-t border-zinc-800 py-5 md:py-6` (not `py-8 md:py-10`)

**Acceptance:**
- All featured + TWIE styling matches landing visually
- No client JS added in this phase
- `bun run check` passes (no new errors)

### Phase 1.5 — RSS feed endpoint

**Problem:** RSS link 404s. Landing moved RSS button to header row (Phase 2 wires it). Endpoint must exist regardless.

**Scope:**
- New file: `effect-website/src/pages/rss.xml.ts`
- New dep: `@astrojs/rss` (install via repo's package manager — `pnpm-lock.yaml` present → `pnpm add @astrojs/rss`)
- Optional: TWIE-only feed at `src/pages/blog/twie/rss.xml.ts` — deferred

**Endpoint requirements:**

```ts
import rss from "@astrojs/rss"
import { getCollection, getEntries } from "astro:content"
import type { APIContext } from "astro"

export async function GET(context: APIContext) {
  const posts = await getCollection("blog")

  const items = await Promise.all(
    posts
      .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
      .map(async (post) => {
        const authors = await getEntries(post.data.authors)
        return {
          title: post.data.title,
          description: post.data.excerpt,
          pubDate: post.data.date,
          link: `/blog/${post.id}/`,
          author: authors.map((a) => a.data.name).join(", "),
          categories: post.data.tags.map((t) => t.id),
        }
      }),
  )

  return rss({
    title: "Effect Blog",
    description: "Latest updates from the Effect ecosystem",
    site: context.site!,
    items,
    customData: `<language>en-us</language>`,
  })
}
```

**Notes:**
- `context.site` resolves to `https://effect.website` from `astro.config.ts`
- Sort newest-first
- Tag categories use ids (slugs)
- Omit `stylesheet` reference (none authored)
- Defer featured image enclosure

**Acceptance:**
- `GET /rss.xml` returns 200, `Content-Type: application/xml`
- W3C feed validator passes
- All posts (incl TWIE) present, newest first
- `pnpm run build` succeeds, `dist/rss.xml` exists

### Phase 1.75 — Tag chip style: outlined monospace pill

Landing changed from filled-bg-pill-with-dot to outlined monospace pill. Establish canonical helper for all card contexts.

**Canonical chip (PostCard variant — `BlogPage.tsx:316-325`):**

```html
<!-- regular tag chip in PostCard -->
<span class="inline-flex items-center rounded-md border border-zinc-600 px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] text-zinc-200 uppercase">
  {tag.name}
</span>

<!-- overflow chip -->
<span class="inline-flex items-center rounded-md border border-zinc-700 px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] text-zinc-400 uppercase">
  +{N}
</span>
```

**Featured-context variant** — see Phase 1-R items 1 + 2.

**Suggested-tag chips (empty-state)** — `BlogPage.tsx:813-820`:

```html
<button class="inline-flex items-center rounded-md border border-zinc-800 px-3 py-1.5 font-mono text-[10px] tracking-[0.12em] text-zinc-400 uppercase transition-colors hover:border-zinc-500 hover:text-white">
  {tag.name}
</button>
```

**Required edits to `index.astro`:**

1. Latest list visible-tag chip (`index.astro:304-312`) → outlined monospace, no dot, no bg
2. Latest list overflow chip (`index.astro:313-317`) → outlined monospace
3. After Phase 2 island lands, PostCard inside island uses same classes — implement a `TagChip` helper to avoid duplication

**TagChip helper:**

```tsx
// PostCard variant
export function TagChip({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center rounded-md border border-zinc-600 px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] text-zinc-200 uppercase">
      {name}
    </span>
  )
}

export function OverflowChip({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center rounded-md border border-zinc-700 px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] text-zinc-400 uppercase">
      +{count}
    </span>
  )
}
```

**Open question:** landing drops the color dot, losing tag color affordance. Effect-website might want to retain tag colors elsewhere (sidebar). Defer; if dot is wanted, that's a deliberate divergence to negotiate later.

**Acceptance:**
- All card-context tag chips visually match landing's outlined monospace pill
- No dot, no bg fill in chip
- Phase 2 PostCard reuses helper

### Phase 2 — React island: header controls + single-column grid + pagination

**Mount point:** Replace effect-website's current "Latest" section + sidebar (`index.astro` lines ~282 through end of `</aside>`) with a single `<BlogControls client:load ... />`.

**Layout change:** single-column. No sidebar markup. Landing reference: `BlogPage.tsx:609-628`.

**Astro-side serialization:**

```ts
type SerializedPost = {
  id: string
  title: string
  excerpt: string
  date: string                // formatted via existing formatDate()
  dateMs: number              // for sort stability inside island
  href: string                // `/blog/${id}`
  tags: Array<{ id: string; name: string; color: string }>
}

type SerializedTag = { id: string; name: string; color: string; count: number }
```

- No authors serialization needed in island (PostCard no longer shows avatars)
- Build posts array from `nonTwiePosts.filter(p => !p.data.featured)`
- Build tags from existing `categories` array
- Sort posts newest-first server-side as default

**Island component (`BlogControls.tsx`):**

Props:
```ts
type Props = {
  posts: SerializedPost[]
  tags: SerializedTag[]    // includes "all" entry first
}
```

Internal state:
```ts
type SortOrder = "newest" | "oldest"
type State = {
  tag: string              // tag id or "all"
  sort: SortOrder
  page: number
}
```

**Sub-components (inside island):**

1. **Header row** (above grid; sticky-ish at top of section)
   - Left: dynamic `<h2>` = `activeTag === "all" ? "All posts" : tag.name`
   - Right group (`flex flex-wrap items-baseline gap-x-4 gap-y-3 sm:gap-x-6`):
     - **Category dropdown** (`BlogPage.tsx:625-678`)
       - Trigger: `<button>` showing `Category: <activeTag>` w/ chevron-down rotation when open
       - Menu: absolute-positioned `<ul role="listbox">` with each tag row showing `name` left + zero-padded count right (`String(count).padStart(3, "0")`) + animated underline on hover/active
       - Click outside closes menu (effect-ref pattern from landing)
     - **Sort toggle** — button cycling `newest ↔ oldest` w/ chevron-up-down lucide icon (`ArrowUpDown`). Label format: `Sort: NEWEST` / `Sort: OLDEST`
     - **RSS link** — `<a href="/rss.xml" aria-label="RSS feed">` w/ `RSS` label + `Rss` lucide icon, monospace uppercase
   - Bottom border on the entire header row: `border-b border-zinc-700/80 pb-4 mt-16 md:mt-20`

2. **PostCard** — single-row layout (`BlogPage.tsx:293-336`)
   - Wrapper: `group block -mx-4 border-t border-zinc-700/80 px-4 py-6 transition-colors first:border-t-0 hover:bg-zinc-900/60`
   - 12-col grid: left 8 cols = title + excerpt; right 4 cols (md+) = tags + date
   - Title: animated underline + slide-in `ArrowRight` icon on hover (translate `-translate-x-1 → translate-x-0`, opacity 0→100)
   - Excerpt: `line-clamp-2` (verify against landing's actual clamp)
   - Tags: top 2 sorted alphabetically + `+N` overflow chip — use `TagChip` from Phase 1.75
   - Date: monospace tabular nums

3. **Pagination** (`BlogPage.tsx:719-789`)
   - `POSTS_PER_PAGE = 12`
   - Prev/Next: `flex h-8 w-8 items-center justify-center rounded-md border border-zinc-700 text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white disabled:pointer-events-none disabled:opacity-30` w/ lucide `ChevronLeft`/`ChevronRight`
   - Number buttons: monospace, zero-padded (`String(page).padStart(2, "0")`), animated underline on hover/active. `aria-current="page"` on active
   - Ellipsis: `···` (U+22EF) in zinc-500
   - On filter/sort change → reset page to 1
   - On page change → smooth-scroll to `postListRef` top **only if** scrolled past header (landing's tab-like behavior at `BlogPage.tsx:497-503`)

4. **EmptyState** (`BlogPage.tsx:799-832`)
   - Lucide `FileSearch` icon, copy ("No posts found"), suggested tag buttons (Release/Effect/TypeScript outlined-monospace), "Clear all filters" outlined button
   - No search context — copy reflects only category filter

**Filter pipeline:**
1. If `tag !== "all"`: keep posts where `tags.some(t => t.id === tag)`
2. Sort: `newest` → `dateMs DESC`; `oldest` → `dateMs ASC`
3. Slice for pagination

**Icon imports (lucide-react):**
```ts
import {
  ChevronDown, ChevronLeft, ChevronRight,
  ArrowRight, ArrowUpDown, Rss, FileSearch,
} from "lucide-react"
```

**Astro changes inside `index.astro`:**
- After `categories` computation, build `serializedPosts` array
- Pass to island: `<BlogControls posts={serializedPosts} tags={serializedTags} client:load />`
- Remove old "Latest" grid + sidebar markup wholesale
- Keep TWIE rail + Featured server-rendered, untouched

**Hydration:**
- `client:load` — header controls are above-the-fold-ish after TWIE rail
- SSR skeleton renders default state (`tag=all`, `sort=newest`, `page=1`) so first paint matches

**Acceptance:**
- Header row matches landing layout (category dropdown + sort + RSS)
- Single-column grid; no sidebar
- Category click filters grid + closes dropdown
- Sort toggle reorders grid
- PostCard hover shows arrow + underline animation
- Pagination renders only when `totalPages > 1`; prev/next disabled at bounds; smooth-scroll only when needed
- Empty state appears when filter yields 0; "Clear all filters" resets state
- Click-outside closes category menu
- `pnpm run check` passes

### Phase 3 — URL state sync (single `?category=X` param)

Inside `BlogControls.tsx` — match landing's `BlogPage.tsx:432-501` impl:

- Lazy initial state: read `?category=X` from `window.location.search`. If valid tag id, seed `activeTag`. Default `all`.
- `syncUrl(tag)`: build URL, set/delete `category` param, `history.pushState({category: tag}, "", url)`
- `handleTagChange(tag)` → `syncUrl(tag)` + reset page + conditional scroll
- `clearFilters()` → `syncUrl("All")`
- `useEffect` on mount: register `popstate` listener → re-read URL → seed `activeTag` + reset page; cleanup on unmount

**Notes:**
- Use `pushState` not `replaceState` (landing uses push for back-button navigability)
- `sort` and `page` NOT in URL (landing doesn't sync them)
- Validate param against `tags` prop before applying

**Acceptance:**
- `/blog?category=effect` loads pre-filtered
- Clicking categories updates URL
- Back/forward navigates between filter states
- Refresh preserves view

### Phase 4 — polish (optional)

- Animate grid re-render via `key={filterSignature}` on grid wrapper
- Respect `prefers-reduced-motion` — disable scroll-into-view + animations
- Accessibility audit: focus rings, ARIA labels on icon-only buttons, `aria-current="page"` already in Phase 2
- Featured image as RSS `<enclosure>`
- TWIE-only RSS feed

## Risks / gotchas

- **Landing churn**: landing changes rapidly. Always diff `landing/src/components/landing/BlogPage.tsx` against last-known-good before starting a phase. This spec was synced at landing HEAD `7bd50db` (2026-05-26 23:30) and may need re-sync.
- **Avatar glob unused in Phase 2** since landing dropped avatars from cards. Keep the glob in `index.astro` for FeaturedPost (currently kept after Phase 1-R drops author row — verify if Featured still needs avatars per landing's latest cut).
- Don't import remixicon. Always lucide.
- `lucide-react` tree-shakes via named imports only.
- Pagination scroll behavior is conditional (`if (top < navbarHeight)`) — don't always-scroll.
- Category dropdown click-outside needs `useRef` + `mousedown` listener pattern.
- TWIE post for testing already exists. Don't delete.
- `pnpm` is the package manager (lockfile present) — use `pnpm` for installs in this project, not `bun`.

## Out of scope

- Search bar (landing removed)
- Author sidebar + filter (landing removed)
- Collapsible sidebar (landing removed)
- Mobile `<select>` (landing removed)
- TWIE conditional hide (landing always shows)
- RSS in hero (landing moved to header row)
- TWIE rail fade affordances + swipe hint
- Author bio popovers
- Tag color editor
- Comment system / reactions
- Featured image enclosure in RSS (defer to Phase 4)
- TWIE-only RSS feed
