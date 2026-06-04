# Blog Entry (post) Page — Migration Specification

## Intent

Create `effect-website/src/pages/blog/[...slug].astro` (does not exist yet) with the **visual design** of `landing/src/pages/blog/[slug].astro` + `landing/src/components/landing/BlogPostPage.tsx`, but Astro-native:

- **Real content.** Render each post's actual MDX via `render(post)`; build the "On this page" TOC from `render().headings`. **Discard** landing's hardcoded article body and hardcoded 8-item TOC (that is a mockup for the 4.0 post). Port only layout/structure/styling.
- **Static-first.** Everything server-rendered Astro except two small islands: TOC scroll-spy and copy-link button.
- **Reuse `PageLayout`** (same chrome as home/podcast/blog-index).
- **Dark-only.** effect-website is dark. Translate landing's light/dark classes to the **dark** value as the base; drop light-mode utilities.
- **Icons = lucide** (`@lucide/astro` server, `lucide-react` island). Brand X/LinkedIn use the existing logo SVGs. No remixicon / `ri-*`.

**Landing is the design source of truth** for layout/spacing/styling. effect-website data + chrome conventions win over landing's. The companion index migration is described in `blog-index-migration-spec.md` — match its conventions.

## Critical: route is `[...slug]`, not `[slug]`

Blog collection ids contain slashes. The `blog` glob loader (`src/content.config.ts`) uses pattern `["*/index.mdx", "releases/effect/*.mdx"]`, so ids are e.g. `effect-2025-in-review`, `this-week-in-effect-107`, **`releases/effect/4.0-beta`**. The blog index links `/blog/${post.id}` → `/blog/releases/effect/4.0-beta`. Therefore:
- File: `src/pages/blog/[...slug].astro` (rest param).
- `getStaticPaths`: `params: { slug: post.id }`, `props: { post }`.

This also wires up the detail route that the index currently links to (previously 404).

## Mandatory references

### effect-website (project)
- `src/pages/podcast/episodes/[slug].astro` — **canonical detail-page pattern**: `getStaticPaths` from `getCollection`, `const { Content } = await render(entry)`, `<PageLayout>`, sections in `mx-auto max-w-295 px-4`, prose `prose prose-zinc dark:prose-invert`, lucide via `@lucide/astro`. Mirror it.
- `src/pages/blog/index.astro` — sibling page; tag chip style, `formatDate`, breadcrumb `?category=<tagId>` target, hero `.hero-grid`/`.hero-fade` `<style>`.
- `src/layouts/PageLayout.astro` — chrome (provides `DitheredOverlay`/`GridRails`/`Navigation`/`<main id="_top">`/`Footer`). Do not hand-roll.
- `src/content.config.ts` — `blog` (title, excerpt, date, readingTime?, tags refs, authors refs, featured, featuredImage?), `blogAuthors` (name, title, url), `blogTags` (name, color).
- `src/content/blog/authors.json` — keyed by author id (e.g. `mirela_prifti`).
- `src/assets/authors/<authorId>.png` — avatars (e.g. `mirela_prifti.png`). Resolve via `import.meta.glob("../../assets/authors/*.png", { eager: true })`, key `../../assets/authors/${author.id}.png`, render with Astro `<Image>`.
- `src/components/SocialLink.astro` — shows how brand logos import: `@/assets/logos/twitter/Twitter.svg`, `@/assets/logos/linkedin/LinkedIn.svg` (svgr enabled). Its hrefs are "follow Effect" — **do not** reuse the component for sharing; reuse only the logo SVGs.
- `src/styles/global.css` — `@plugin "@tailwindcss/typography"` registered (prose available).

### landing (read-only, design source of truth)
- `landing/src/components/landing/BlogPostPage.tsx` — layout: breadcrumb, 12-col title/sidebar/article grid, byline, TOC box, ShareButtons, PostNavigation, Community CTA, hero bg.
- `landing/src/pages/blog/[slug].astro` — thin wrapper (data shape only).

## Confirmed facts
- Astro auto-adds `id` to rendered headings (verified in built podcast HTML) → TOC anchors + scroll-spy work against `#${heading.slug}`.
- `render()` on blog `.mdx` works (MDX via starlight). `headings` = `{ depth, slug, text }[]`.
- `Astro.site` = `https://effect.website` → use for canonical share URL.
- 6 author avatars present; all `blogAuthors` keyed by id; titles + urls available.

## Locked decisions

| # | Decision |
|---|---|
| 1 | Real MDX `<Content/>` + TOC from `render().headings`. Discard landing's hardcoded article/TOC |
| 2 | Islands (2, minimal): `TableOfContents.tsx` (scroll-spy) + `CopyLinkButton.tsx` (clipboard). Everything else static Astro |
| 3 | X + LinkedIn share = static `<a>` with server-known URL (`new URL("/blog/"+id+"/", Astro.site)`). Brand logo SVGs from `@/assets/logos/...` |
| 4 | Route `src/pages/blog/[...slug].astro`; `getStaticPaths` over `getCollection("blog")` |
| 5 | Reuse `PageLayout`. No hand-rolled chrome/skip-link/`<main>` |
| 6 | Dark-only palette (translate landing `dark:` → base; drop light utilities) |
| 7 | Icons = lucide (`@lucide/astro` server, `lucide-react` island); brand SVG logos for X/LinkedIn. No `ri-*` |
| 8 | Breadcrumb tag chips link to `/blog?category=<tagId>` (matches index URL-sync param = tag **id**) |
| 9 | Post links are local relative `/blog/${id}`. Share/external links absolute |
| 10 | No "post not found" branch (every path is statically generated) |

## Target `[...slug].astro` structure

```astro
---
import { Image } from "astro:assets"
import { getCollection, getEntries, render } from "astro:content"
import { ChevronLeft, ChevronRight, ArrowRight, ArrowUpRight } from "@lucide/astro"
import TwitterLogo from "@/assets/logos/twitter/Twitter.svg"
import LinkedInLogo from "@/assets/logos/linkedin/LinkedIn.svg"
import PageLayout from "@/layouts/PageLayout.astro"
import TableOfContents from "@/components/blog/TableOfContents"
import CopyLinkButton from "@/components/blog/CopyLinkButton"

export async function getStaticPaths() {
  const posts = await getCollection("blog")
  return posts.map((post) => ({ params: { slug: post.id }, props: { post } }))
}

const { post } = Astro.props
const { Content, headings } = await render(post)

const [tags, authors, all] = await Promise.all([
  getEntries(post.data.tags),
  getEntries(post.data.authors),
  getCollection("blog"),
])

const avatars = import.meta.glob<{ default: ImageMetadata }>("../../assets/authors/*.png", { eager: true })

// prev/next over date-desc-sorted collection (include all posts)
const sorted = [...all].sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
const i = sorted.findIndex((p) => p.id === post.id)
const prevPost = i > 0 ? sorted[i - 1] : null
const nextPost = i < sorted.length - 1 ? sorted[i + 1] : null

const postUrl = new URL(`/blog/${post.id}/`, Astro.site).href
const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.data.title)}&url=${encodeURIComponent(postUrl)}`
const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`
const formatDate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
---

<PageLayout title={`${post.data.title} | Effect Blog`} description={post.data.excerpt}>
  <section class="relative overflow-hidden">
    <!-- hero grid bg overlay (top), reuse .hero-grid/.hero-fade -->
    <div class="relative z-10 mx-auto w-full max-w-295 px-4">
      <!-- Breadcrumb: Blog // <tag a href=/blog?category=id> ... -->
      <!-- 12-col grid: title+excerpt (col1-8 r1), sidebar aside (col10-12 r3),
           full-width divider (r2), article (col1-8 r3) -->
      <!-- article: mobile TOC island, then <div class="prose ..."><Content /></div>,
           then mobile share+last-updated, then PostNavigation -->
      <!-- aside: byline (Image avatar + name/title link), TOC island,
           share row (X + LinkedIn static <a> + <CopyLinkButton client:load/>),
           divider, Last updated <time> -->
    </div>
  </section>

  <!-- Community CTA (static): // Effect Community, Discord links, corner brackets -->
</PageLayout>

<style>
  /* .hero-grid / .hero-fade — copy from blog index.astro */
</style>
```

### Prose
Match podcast for consistency, dark-only: `class="prose prose-zinc dark:prose-invert max-w-none"` plus landing's structural tuning (translate, keep spacing/sizes, drop light color utilities), e.g. `prose-headings:font-semibold prose-headings:tracking-tight prose-h2:mt-14 prose-h2:mb-5 prose-h2:text-2xl prose-h3:mt-10 prose-h3:mb-4 prose-h3:text-xl prose-p:text-lg prose-p:leading-relaxed prose-li:text-lg prose-pre:rounded-xl`. Do not paste landing's `prose-*:text-zinc-700`/`dark:prose-*` color pairs — `prose-invert` handles dark colors.

### Breadcrumb
`<nav aria-label="Breadcrumb">`: `Blog` link → `/blog`; `//` separator; tag chips (sorted) as `<a href={`/blog?category=${tag.id}`}>{tag.data.name}</a>`. Dark text utilities (`text-zinc-400 hover:text-white`).

### Byline (static, both mobile + desktop variants)
Per author: `<a href={author.data.url}>` + `<Image src={avatars[`../../assets/authors/${author.id}.png`].default} ... class="h-10 w-10 rounded-md object-cover" />` + name (`text-zinc-200`) + title (`text-zinc-400`). Guard missing avatar.

### Share row (static X/LinkedIn + copy island)
"Share" label + X `<a href={xUrl} target=_blank>` (TwitterLogo) + LinkedIn `<a href={linkedInUrl} target=_blank>` (LinkedInLogo) + `<CopyLinkButton client:load />`. Button shell class (dark): `inline-flex h-10 w-10 items-center justify-center rounded-md border border-zinc-700 text-zinc-300 transition-colors hover:border-white hover:text-white`.

### PostNavigation (static)
2-col grid; Prev (`ChevronLeft` + "Previous" + `prevPost.data.title`, href `/blog/${prevPost.id}`) / Next (`ChevronRight` + "Next" + title, href `/blog/${nextPost.id}`). Render `<div/>` placeholder when one side missing. Dark borders.

### Community CTA (static)
`// Effect Community`, "Join the conversation on Discord", Discord button (`ArrowRight`) + `discord.gg/effect-ts` link (`ArrowUpRight`), corner brackets. Dark palette.

## Islands

### `src/components/blog/TableOfContents.tsx` (`lucide-react` if any icon; else none)
Props: `{ headings: Array<{ depth: number; slug: string; text: string }>; className?: string }`.
- Filter to `depth === 2 || depth === 3`; indent depth-3 with `pl-4`.
- Render `<nav class={cn("sticky top-[5.5rem]", className)}>` with box: `rounded-md border border-zinc-800 bg-zinc-900/40 p-5`, label "On this page" (`font-mono text-xs uppercase tracking-wider text-zinc-500`), divider, `<ul>` of `<a href={`#${slug}`}>`.
- Scroll-spy: `IntersectionObserver` over the heading elements (`document.getElementById(slug)`), `rootMargin: "-80px 0px -70% 0px"`, set `activeId` to topmost intersecting; active link `text-white underline underline-offset-4`, inactive `text-zinc-400 hover:text-white`.
- Mounted twice: desktop (sticky, in aside) and mobile (pass `className="static"`, no sticky). Both `client:load`.
- No effect-website `cn` import unless it exists; otherwise inline class concat. (Check `@/lib/utils` for `cn`.)

### `src/components/blog/CopyLinkButton.tsx` (`lucide-react`: `Link`, `Check`)
- `useState(copied)`; on click `navigator.clipboard.writeText(window.location.href)`, set copied 2s.
- `aria-label` toggles "Copy link"/"Link copied". Icon `Link` → `Check` when copied. Same dark button shell class as share buttons.

## Risks / gotchas
- **`[...slug]` rest route** — ids contain `/`. Using `[slug]` will break `releases/effect/4.0-beta`.
- Verify `cn` helper location (`@/lib/utils`) before importing in islands; inline if absent.
- Brand SVG import: follow `SocialLink.astro`'s import style (`import X from "@/assets/logos/.../X.svg"`; render `<X class=... />`). svgr is configured.
- Avatar key must match author id + `.png`; guard `undefined` (fallback: initial or hidden img).
- Dark-only: do not leave landing's `bg-white`/`text-zinc-900` light defaults; use the dark value as base.
- Two TOC observers (mobile+desktop) coexist fine.
- Keep `<Content />` wrapped in a `not-prose`-free `prose` container; MDX code blocks rely on starlight/shiki defaults already in the site.
- TWIE posts (e.g. `this-week-in-effect-107`) also render through this route — fine; TOC from their headings.

## Verify before done
- `direnv exec . pnpm astro check` — clean for touched files (ignore pre-existing repo-wide "Multiple versions of package effect" `ts(6)` baseline).
- `direnv exec . pnpm build` — succeeds; `dist/blog/releases/effect/4.0-beta/index.html` and other post pages emitted; heading `id`s present; TOC anchors resolve.
- Cannot browser-test: verify scroll-spy/copy by code review + build, do not claim visual verification.

## Out of scope
- Reading-time display (unless trivially from `post.data.readingTime`).
- Related-posts beyond prev/next.
- Comments/reactions, author bio popovers, featured-image hero in body.
- RSS (separate; see index spec Phase D).
- Editing the blog index page.
