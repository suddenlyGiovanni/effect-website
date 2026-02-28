# EffectExample v4 Port Plan

## Goal

Port legacy `EffectExample` UX from `.repos/landing` into `website-v4` interactive examples with Astro-first boundaries, strict typing, accessible controls, and mobile-polished behavior, while switching examples to Effect v4 patterns.

## Current State Snapshot

- Legacy source component: `.repos/landing/src/components/display/EffectExample.tsx`
- Current interactive examples codebase state:
  - `src/components/landing/examples/InteractiveExamples.tsx` exists and is the shell boundary (tabs/subtabs frame + indicator behavior).
  - Runtime/example implementation modules are intentionally treated as greenfield for this migration.
- New implementation should be treated as greenfield across interactive examples UI and runtime modeling.
- Reference repo added for v4 examples: `.repos/effect-smol`, in particular `.repos/effect-smol/LLMS.md`

## Architecture Plan (Astro-first)

1. Keep section shell and rails in Astro (`InteractiveExamples.astro` + page layout).
2. Keep tab/subtab framing in React where stateful interaction is required.
3. Hydrate only interactive example bodies (single island boundary per tab content, not page-wide if avoidable).
4. Keep pure presentational wrappers server-renderable where possible; isolate runtime Effect execution hooks to client-only components.

## Migration Scope

### 1) Legacy Feature Audit -> v4 Mapping

- Inventory each `EffectExample` capability from legacy:
  - header + description + variant labels
  - run/stop/reset controls
  - node graph states (idle/running/success/fail/death/interrupted)
  - code pane + highlight affordance
  - multi-node flow (`effects -> result`) and result labeling
  - optional timeline/scope/ref sections
- Mark each capability as:
  - `P0`: required for first parity pass
  - `P1`: keep if low-cost and still design-aligned
  - `P2`: defer (if high complexity / low user value)
- Define exact non-goals to avoid porting legacy-only bugs.

### 2) Typed Domain Model Upgrade

- Define `ExampleId` and metadata unions for full tab/subtab matrix.
- Add discriminated unions for example renderer needs (single node, pipeline, fallback-chain, schedule, ref/scope).
- Build typed view-model builders to make illegal UI states unrepresentable.
- Keep all error/defect surfaces explicit (`unknown` at boundaries, parsed to safe display models).

### 3) Example Catalog + Effect v4 Programs

- Build a centralized catalog keyed by tab/subtab IDs (manifest + program factories) with:
  - title/description/code
  - node layout spec
  - executable program factory (Effect v4 APIs)
  - optional visual metadata (timers/highlight anchors)
- Source v4 idioms from `.repos/effect-smol` and align naming/snippets to current Effect docs language.
- Keep code snippets local and deterministic for SSR render; runtime randomness only when intentionally demoing behavior.

### 4) Component Implementation Plan

- Build tab/subtab content renderers from scratch.
- Preserve smooth indicator behavior and mobile horizontal tab UX.
- Build card/panel UI primitives from scratch with legacy visual language: zinc layering, dividers, spacing, typography parity.
- Ensure keyboard-accessible action controls and focus-visible treatments.
- Add/upgrade focused subcomponents as needed (node row, result badge, optional timeline/ref panels), minimizing prop surface.
- Keep reduced-motion-safe transitions (`motion-reduce:*`) and avoid heavy animation libs unless already used.

### 5) Interaction + Accessibility

- Keyboard:
  - tabs/subtabs reachable and operable by keyboard
  - run/stop/reset buttons accessible with descriptive labels
- Screen reader:
  - meaningful labels for node state and result changes
  - avoid color-only state communication
- Motion/perf:
  - respect reduced motion settings
  - avoid unnecessary re-renders (memoized selectors, stable callbacks)
  - keep hydration payload minimal by scoping island state

### 6) Routing/Content Future-Proofing

- Keep example IDs/content decoupled from route paths.
- Prepare shared content structure usable by future `/podcast/episodes/<episode>/` pages:
  - avoid hardcoded landing-only assumptions in data layer
  - prefer colocated local assets under `src/assets` for episode/example media.

## Implementation Sequence

1. Add full v4-backed manifest/types for all tab/subtab entries.
2. Implement deterministic program factories and view-model adapters.
3. Build tab/subtab rendering layer and card UI from scratch.
4. Port missing `EffectExample` behaviors judged `P0`.
5. Apply styling parity pass against current Astro shell (rails/dividers/spacing).
6. A11y + mobile polish pass.
7. Validate with `pnpm lint` and `pnpm build`.

## Acceptance Criteria

- No placeholder/stub copy remains in interactive examples tab panels.
- All configured tab/subtab examples render and execute with typed state transitions.
- Visual language matches existing landing shell (dark zinc, rails, dividers, spacing rhythm).
- Keyboard navigation + focus states + reduced-motion behavior verified.
- TypeScript remains strict with no `any`, no unsafe assertions.
- `pnpm lint` and `pnpm build` pass.

## Risks / Watchouts

- Over-porting legacy behavior can reintroduce old UX bugs; keep parity intent-driven, not bug-for-bug.
- Complex example orchestration can bloat island runtime; prefer data-driven small primitives.
- Result/error formatting can drift across examples; centralize formatter logic.

## Validation Checklist

- `pnpm lint`
- `pnpm build`
- Manual checks:
  - mobile tab scrolling and subtab wrapping
  - keyboard-only run/stop/reset flow
  - reduced-motion OS setting behavior
  - empty/error/failure/death state readability

## Decisions (Resolved)

- Legacy `scope` + `refs` visual panels: **Defer to P1**.
- Audio interaction cues in parity pass: **Move to follow-up**.
- Code highlighting approach: **Include hover-linked highlight map in P0**.

## Phase 0 Findings (Baseline + Inventory)

### Legacy `EffectExample` capability inventory (`.repos/landing`)

- Core composition: card shell with header, optional configuration panel, optional refs panel, main node visualization, optional schedule timeline, optional scope panel, code pane.
- Header behavior: single primary action toggles run/stop/reset based on node state; supports title, variant, description, and idle/running/reset hint text.
- Node layout behavior:
  - single-node mode when only one effect/result.
  - multi-node mode for input `effects` -> arrow -> optional `resultEffect`.
  - result node can show elapsed-time label from timer-enabled effect.
- Node runtime states surfaced visually: `idle`, `running`, `completed`, `failed`, `interrupted`, `death`.
- Error/defect surfacing: failed/death states render distinct bubbles; non-error notifications render transient bubbles.
- Code highlighting: hover on a node maps to `effectHighlightMap` target text and renders floating highlight over code block; highlight hide is delayed.
- Optional advanced visuals: refs strip (`RefDisplay`), schedule timeline (`ScheduleTimeline`), scope finalizer stack (`ScopeStack`).

### Retained shell audit (`src/components/landing/examples/InteractiveExamples.tsx`)

- Keep as shell boundary: top-level tabs + subtabs framing, tab order, indicator motion, and mobile horizontal scroll behavior.
- Preserve top-tab indicator mechanics:
  - measures selected trigger rect relative to tabs list.
  - updates on tab changes, resize observer events, and font-load completion.
  - uses motion-reduce-safe transition (`transition-[left,width]` + `motion-reduce:transition-none`).
- Preserve existing tab taxonomy and IDs in this file as source IDs for v4 catalog mapping.
- Current subtab/content panels are stubs and should be replaced by greenfield runtime/content renderer.
- No strong reason found to alter shell ownership/state boundaries in Phase 0.

### P0 feature matrix (preserve / replace / defer)

| Capability                                                            | Legacy source                                                                        | Target in v4                                                                                       | Decision | Priority  |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- | -------- | --------- |
| Top-level tabs frame + order + mobile horizontal scroll               | n/a (new shell)                                                                      | `src/components/landing/examples/InteractiveExamples.tsx`                                          | Preserve | P0        |
| Top-tab active indicator measurement + animation behavior             | n/a (new shell)                                                                      | `src/components/landing/examples/InteractiveExamples.tsx`                                          | Preserve | P0        |
| Subtab rail structure + keyboard tab semantics via `Tabs*` primitives | n/a (new shell)                                                                      | `src/components/landing/examples/InteractiveExamples.tsx`                                          | Preserve | P0        |
| Subtab panel content stubs                                            | `EffectExample` did full rendering                                                   | New runtime/content modules under `src/lib/examples/` and UI in `src/components/landing/examples/` | Replace  | P0        |
| Header content (name/variant/description + action hint copy)          | `.repos/landing/src/components/HeaderView.tsx`                                       | New example card header component (greenfield)                                                     | Replace  | P0        |
| Run/stop/reset control state machine wiring                           | `.repos/landing/src/components/HeaderView.tsx`, `.repos/landing/src/VisualEffect.ts` | New v4 runtime orchestration layer + action controls                                               | Replace  | P0        |
| Node state model (`idle/running/completed/failed/interrupted/death`)  | `.repos/landing/src/VisualEffect.ts` + node components                               | New typed runtime/view-model unions                                                                | Replace  | P0        |
| Single-node + multi-node (`effects -> result`) layout                 | `.repos/landing/src/components/display/EffectExample.tsx`                            | New node strip renderer                                                                            | Replace  | P0        |
| Result label sourcing from timer-enabled effect                       | `.repos/landing/src/components/display/EffectExample.tsx`                            | New node/result view model                                                                         | Replace  | P0        |
| Code pane with hover-linked highlight map                             | `.repos/landing/src/components/display/EffectExample.tsx`, `FloatingHighlight.tsx`   | New code pane + highlight adapter                                                                  | Replace  | P0        |
| Optional configuration panel slot                                     | `.repos/landing/src/components/display/EffectExample.tsx`                            | Omit in parity pass                                                                                | Defer    | P2        |
| Schedule timeline panel                                               | `.repos/landing/src/components/ScheduleTimeline.tsx`                                 | Revisit after baseline parity                                                                      | Defer    | P1        |
| Refs panel                                                            | `.repos/landing/src/components/display/RefDisplay.tsx`                               | Revisit post-P0                                                                                    | Defer    | P1        |
| Scope/finalizer panel                                                 | `.repos/landing/src/components/scope/ScopeStack.tsx`                                 | Revisit post-P0                                                                                    | Defer    | P1        |
| Option-key copy-link behavior                                         | `.repos/landing/src/components/HeaderView.tsx`                                       | Omit from first parity pass                                                                        | Defer    | P2        |
| Interaction sounds                                                    | legacy sounds hooks across runtime/header/ref/scope                                  | Keep disabled in parity pass                                                                       | Defer    | Follow-up |

### Phase 1 implementation notes (completed)

- Runtime/data/types moved out of UI folder into `src/lib/examples/`.
- Current module split:
  - `src/lib/examples/ids.ts` (`TabId`, `ExampleId`, tab/subtab config)
  - `src/lib/examples/model.ts` (typed layout + execution/view/error models)
  - `src/lib/examples/runtime.ts` (renderer/program binding map + ID coverage guard)
- `src/components/landing/examples/InteractiveExamples.tsx` remains shell/UI boundary and imports tab config from `@/lib/examples/ids`.

### Phase 2 implementation notes (completed)

- Added full v4 catalog in `src/lib/examples/runtime.ts` as `EXAMPLE_CATALOG` keyed by `ExampleId`.
- Each entry now includes normalized metadata:
  - `title`
  - `description`
  - `snippet`
  - `nodeSpec`
  - `executionKind`
  - `layout`
  - `makeProgram`
- Program factories are implemented for all tab/subtab IDs using Effect v4 APIs (`Effect.gen`, `Effect.all`, `Effect.race`, `Effect.retry`, `Effect.repeat`, `Ref`, `Schedule`, etc.).
- Determinism policy is explicit per entry via `deterministic`; all current entries are deterministic (`true`).
- Catalog coverage guard added (`assertCatalogCoverage`) to ensure all `ExampleId` values are mapped.
- Program field is non-lazy (`program: Effect.Effect<...>`), no factory compatibility layer retained.

### Phase 3 implementation notes (completed)

- Added orchestration hook in `src/lib/examples/orchestrator.ts`:
  - typed run/stop/reset handlers
  - Exit/Cause mapping into explicit runtime states (`succeeded`/`failed`/`died`/`interrupted`)
  - fiber lifecycle cleanup on reset/unmount
  - stable callbacks + memoized controller object
- Wired runtime orchestration into subtab panels in `src/components/landing/examples/InteractiveExamples.tsx`:
  - replaced subtab stub body with `ExampleRuntimePanel`
  - panel now executes catalog programs via run/stop/reset
  - status updates are announced with `aria-live="polite"`
  - code snippet rendering now sourced from catalog

### Phase 4 implementation notes (completed)

- Replaced subtab panel internals with an example card layout in `src/components/landing/examples/InteractiveExamples.tsx`:
  - header row (title, description, id context, state badge)
  - action row (run/stop/reset)
  - node strip (input/result node chips + arrows)
  - code pane + status/details pane split
  - divider rhythm aligned to existing zinc rail style
- Added hover/focus-linked code highlighting:
  - hovering/focusing node chips sets a highlight anchor
  - code pane highlights first matching anchor token with a deterministic inline mark
  - reduced-motion-safe transitions retained (`motion-reduce:*`)
- Parity pass follow-up applied:
  - restored single primary run/stop/reset control style + contextual header hint
  - restored node-strip emphasis with icon-first nodes + labeled result rail
  - added schedule-only timeline rail row for visual rhythm parity
  - aligned `Effect.retry` / `Effect.repeat` titles + variants to legacy naming
  - fixed global mono font variable (`var(--font-jetbrains-mono)`)

### Frozen non-goals (do not port in P0)

- Sound effects for run/fail/success/ref/scope/copy interactions.
- Option-key hover/click mode for copy-link and success checkmark animation.
- Legacy configuration panel slot until a concrete product need appears.
- Full schedule timeline visualizer in initial parity pass.
- Refs and scope/finalizer panels in initial parity pass (already resolved to P1).
- Legacy visual bugs tied to imperative DOM/highlight timing edge cases; keep highlight deterministic and typed.

## Detailed Todo List

### Phase 0 - Baseline + Inventory

- [x] Audit legacy `EffectExample` behaviors in `.repos/landing/src/components/display/EffectExample.tsx`.
- [x] Audit retained shell behavior in `src/components/landing/examples/InteractiveExamples.tsx` and mark what must be preserved vs replaced.
- [x] Build feature matrix: legacy capability -> target component/file -> priority (`P0`/`P1`/`P2`).
- [x] Freeze non-goals list (legacy bugs/behaviors to not port).

### Phase 1 - Types + Data Model (P0)

- [x] Define `ExampleId` union for all configured tab/subtab examples.
- [x] Add typed example layout union (single node | pipeline | fallback chain | schedule | ref/scope).
- [x] Add typed view-models for node display, status badges, and result labels.
- [x] Ensure task/result/death/error models are explicit; parse `unknown` at display boundary only.
- [x] Add compile-time guard so every manifest ID is mapped to a renderer + program factory.

### Phase 2 - v4 Program Catalog (P0)

- [x] Author full tab/subtab example manifest from scratch.
- [x] Author Effect v4 program factories from scratch.
- [x] Normalize example metadata: title, description, snippet, node spec, execution kind.
- [x] Align snippets/APIs with `.repos/effect-smol` conventions.
- [x] Keep deterministic behavior by default; mark intentional randomness explicitly.

### Phase 3 - Runtime Orchestration (P0)

- [x] Build island/runtime orchestration from scratch around catalog-driven execution.
- [x] Implement typed action handlers per execution kind (run/stop/reset).
- [x] Keep stable callbacks/selectors to reduce re-renders.
- [x] Preserve current mobile/nav smoothness and tab transition behavior.

### Phase 4 - UI Port in Current Design Language (P0)

- [x] Build tab/subtab content and example card layout from scratch: header/action row, node strip, code pane, dividers.
- [x] Add hover-linked code highlight map support in code pane/card UI.
- [x] Ensure zinc palette, rail/divider rhythm, spacing/typography parity with current Astro shell.
- [x] Keep reduced-motion-safe transitions (`motion-reduce:*`).

### Phase 5 - Accessibility + Mobile Polish (P0)

- [ ] Verify keyboard operation for tabs/subtabs/buttons.
- [ ] Add/verify focus-visible styles for all interactive controls.
- [ ] Add SR-friendly labels for state/result updates (not color-only communication).
- [ ] Validate small-screen behavior: tab overflow, subtab readability, node wrap.
- [ ] Validate contrast/readability across idle/running/success/fail/death states.

### Phase 6 - Deferred Items (P1)

- [ ] Reintroduce `scope` visualization panel (if still design-aligned).
- [ ] Reintroduce `refs` visualization panel (if still design-aligned).
- [ ] Confirm cost/benefit before enabling per-example optional panels globally.

### Follow-up

- [ ] Re-evaluate interaction sounds; keep isolated and optional.
- [ ] If enabled later, add mute/disable control + reduced-motion/low-stimulus alignment.

### Validation + Exit Criteria

- [ ] Run `pnpm lint`.
- [ ] Run `pnpm build`.
- [ ] Manual QA: keyboard-only flow, reduced-motion, mobile tabs/subtabs, node state clarity.
- [ ] Confirm zero stubs remain in interactive examples tab panels.
