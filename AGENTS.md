# AGENTS.md

Code for [https://effect.website](https://effect.website) -- the Effect documentation site and landing page.

## Stack

- **Astro 5** + **Starlight** (docs framework)
- **React 19** islands for interactive components (`client:load`)
- **Tailwind CSS v4** via Vite plugin, oklch color system
- **Effect** for typed services (e.g. OG image generation pipeline)
- **TypeScript** (strict), path alias `@/*` -> `./src/*`
- **pnpm**, **Oxc** toolchain (oxlint, oxfmt), **Nix** dev shell

## Reference Repos (`.repos`)

- `.repos/` is a local, gitignored workspace for reference codebases.
- The old website should exist at `.repos/landing`.
  - If missing, clone it first: `git clone git@github.com:mirelaprifti/landing.git .repos/landing`
  - Use it to reference previous implementations of website components / logic
- Effect v4 reference examples should exist at `.repos/effect-smol`.
  - If missing, clone it first: `git clone https://github.com/Effect-TS/effect-smol .repos/effect-smol`
  - Use it to reference how to work with Effect v4, in particular the `.repos/effect-smol/LLMS.md`

## Interactive UI Components

High-interactivity React components use **Shadcn** (`base-nova` style) with **Base UI** (`@base-ui/react`) as the headless primitive layer. Components live in `src/components/ui/` and are generated via `pnpm dlx shadcn@latest add <component>`.

- `components.json` configures Shadcn with `"style": "base-nova"`
- Variants use `class-variance-authority` (CVA)
- `cn()` from `@/lib/utils` merges classes via `clsx` + `tailwind-merge`
- Prefer `cn()` over template literal interpolation when composing Tailwind classes with conditional or dynamic values

Reference: [Shadcn llms.txt](https://ui.shadcn.com/llms.txt)

<!-- effect-language-service:start -->

## Effect Language Service

The Effect Language Service comes in with a useful CLI that can help you with commands to get a better understanding your Effect Layers and Services, and to help you compose them correctly.

<!-- effect-language-service:end -->
