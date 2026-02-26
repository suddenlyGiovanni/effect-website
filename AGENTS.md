# AGENTS.md

Code for [https://effect.website](https://effect.website) -- the Effect documentation site and landing page.

## Stack

- **Astro 5** + **Starlight** (docs framework)
- **React 19** islands for interactive components (`client:load`)
- **Tailwind CSS v4** via Vite plugin, oklch color system
- **Effect** for typed services (e.g. OG image generation pipeline)
- **TypeScript** (strict), path alias `@/*` -> `./src/*`
- **pnpm**, **Oxc** toolchain (oxlint, oxfmt), **Nix** dev shell

## Project Structure

```
src/
  assets/          # Fonts (OG image gen), brand SVG logos
  components/
    astro/         # .astro-only components
    navigation/    # Nav bar: Astro wrappers + React islands
    ui/            # Shadcn components (Base UI primitives)
  content/docs/    # Starlight markdown/mdx content
  layouts/         # BaseLayout.astro (root HTML shell)
  lib/             # Utilities (cn(), constants, navigation ADTs)
  pages/           # Astro routes (index, OG image endpoint)
  services/        # Effect services (OpenGraph)
  styles/          # global.css (Tailwind + Shadcn theme + scroll lock)
```

## Reference Repos (`.repos`)

- `.repos/` is a local, gitignored workspace for reference codebases.
- Use it to compare old implementations/patterns before changing UI.
- The old landing site should exist at `.repos/landing`.
- If missing, clone it first: `git clone git@github.com:mirelaprifti/landing.git .repos/landing`

## Interactive UI Components

High-interactivity React components use **Shadcn** (`base-nova` style) with **Base UI** (`@base-ui/react`) as the headless primitive layer. Components live in `src/components/ui/` and are generated via `npx shadcn add`.

- `components.json` configures Shadcn with `"style": "base-nova"`
- Variants use `class-variance-authority` (CVA)
- `cn()` from `@/lib/utils` merges classes via `clsx` + `tailwind-merge`

Reference: [Shadcn llms.txt](https://ui.shadcn.com/llms.txt)
