# Project Structure Reorganization Specification

## Intent

This spec defines a staged reorganization of the repository so code is easier to locate, feature boundaries are clearer, and large domains can evolve without spreading across unrelated top-level buckets.

Primary goal: move the project toward a hybrid structure where framework-owned directories stay conventional, while product domains with real complexity are organized vertically by feature.

This is not a redesign of runtime behavior. It is a structural refactor plan.

## Scope

This specification covers:

- root-level information architecture
- `src/` directory organization
- shared-vs-feature module boundaries
- target structure for `visual-effect`
- migration phases and safety rules

This specification does not require:

- changing route behavior
- changing component behavior
- redesigning landing pages
- rewriting the entire app into a fully feature-sliced architecture in one pass

## Current structural problems

The current repo is readable, but several patterns will get expensive as the site grows.

### 1) Horizontal sprawl for one complex feature

`visual-effect` is split across many top-level buckets:

- `src/components/landing/examples`
- `src/lib/visual-effect`
- `src/hooks/visual-effect`
- `src/hooks/animation`
- `src/atoms/visual-effect.ts`
- `src/services/VisualEffectManager.ts`
- `src/services/SoundManager.ts`

This means a single feature change requires jumping across components, state, hooks, runtime services, and lib code.

### 2) `src/lib` mixes pure utilities with feature-owned code

`src/lib` currently contains both legitimate shared modules and full product domains.

Examples:

- good fit for shared lib: `src/lib/utils.ts`, `src/lib/install-command.ts`
- mixed/feature-owned: `src/lib/visual-effect`, `src/lib/podcast`

This blurs the meaning of `lib` and makes dependency direction hard to reason about.

### 3) State and runtime layers are coupled

Current coupling around sound/runtime state indicates weak boundaries:

- `src/atoms/visual-effect.ts`
- `src/services/SoundManager.ts`

App state should not need to own service internals, and services should not import feature atoms directly.

### 4) Oversized modules hide missing sub-structure

Large files indicate multiple responsibilities are packed together.

Known examples:

- `src/lib/visual-effect/constructors.ts`
- `src/services/VisualEffectManager.ts`
- `src/services/SoundManager.ts`

### 5) Placement rules are inconsistent

Examples:

- shared hook: `src/hooks/useTabsIndicator.ts`
- feature hook: `src/hooks/visual-effect/useSnippetHoverState.ts`
- component-local hook: `src/components/landing/examples/useContainerWidth.ts`

These may each be reasonable locally, but together they signal no stable placement rule.

### 6) Root-level docs/plans are partially scattered

The repo already has `specs/`, but planning docs also exist at root.

Example:

- `effect-example-v4-port-plan.md`

This weakens root clarity.

## Goals

- Keep Astro conventions obvious.
- Make complex domains locally coherent.
- Keep shared code actually shared.
- Reduce cross-folder hopping during feature work.
- Make dependency direction more obvious.
- Enable gradual migration, not big-bang churn.

## Non-goals

- Renaming every file in the repo.
- Introducing a large architecture framework for its own sake.
- Moving all code into `features/` immediately.
- Breaking stable public routes to satisfy folder aesthetics.

## Target architecture

Use a hybrid model:

1. keep framework-conventional directories where Astro expects them
2. keep shared UI and shared helpers at top level
3. move truly complex product domains into `src/features/`

## Target `src/` tree

```text
src/
  assets/
    fonts/
    images/
    logos/
  components/
    navigation/
    ui/
    SkipLink.astro
  content/
    docs/
  features/
    podcast/
      content/
      data/
      routes/
    visual-effect/
      catalog/
      components/
      hooks/
      model/
      runtime/
      state/
      ui/
  layouts/
  lib/
    constants/
    animation/
    navigation/
    open-graph/
    utils.ts
  pages/
    index.astro
    og/
    podcast/
  styles/
    global.css
  content.config.ts
```

Notes:

- `src/components` becomes shared/site-shell only.
- `src/features` holds feature-owned code.
- `src/lib` becomes shared and framework-agnostic where practical.
- `src/pages` remains route-first because Astro benefits from that convention.

## Directory contracts

### `src/components`

Use for shared presentation and site-shell composition only.

Allowed examples:

- global navigation
- reusable UI wrappers
- shell-level page sections used across domains

Not allowed:

- feature runtime orchestration
- feature-specific state atoms
- feature-specific hooks unless they are intentionally shared outside the feature

### `src/features`

Use for domains that have at least two of these traits:

- custom state
- runtime/service logic
- more than ~5 related modules
- dedicated UI surface
- domain-specific types or schemas

Each feature should prefer internal cohesion over global bucket purity.

### `src/lib`

Use for shared helpers with broad applicability.

Rules:

- prefer framework-agnostic modules
- no feature UI modules
- no feature runtime wiring
- no feature-specific catalogs unless intentionally cross-feature

### `src/hooks`

After migration, reserve for truly shared hooks only.

Feature hooks should live inside their feature.

### `src/services`

Preferred end state: delete this bucket if it becomes empty; otherwise keep only truly app-wide services.

For this repo, current service files are feature-owned and should move under `src/features/visual-effect/runtime`.

### `src/atoms`

Preferred end state: delete this bucket if it becomes empty; otherwise keep only truly app-wide atoms.

Feature atoms should live under feature `state/` folders.

## Target `visual-effect` structure

This is the highest-value reorganization target.

```text
src/features/visual-effect/
  catalog/
    index.ts
    effect-acquire-release.ts
    effect-add-finalizer.tsx
    effect-all-short-circuit.ts
    effect-all.tsx
    effect-catch.ts
    effect-die.ts
    effect-eventually.ts
    effect-fail.ts
    effect-for-each.ts
    effect-partition.ts
    effect-promise.ts
    effect-race-all.ts
    effect-race.ts
    effect-repeat-spaced.ts
    effect-repeat-while.ts
    effect-retry-exponential.ts
    effect-retry-recurs.ts
    effect-sleep.ts
    effect-succeed.ts
    effect-sync.ts
    effect-timeout.ts
    effect-validate.ts
  components/
    VisualEffect.tsx
    VisualEffects.tsx
    VisualEffectCodeSnippet.tsx
    VisualEffectCodeSnippetHighlight.tsx
    VisualEffectConfigPanel.tsx
    VisualEffectControls.tsx
    VisualEffectControlsIcon.tsx
    VisualEffectFinalizerCard.tsx
    VisualEffectFinalizerPanel.tsx
    VisualEffectNode.tsx
    VisualEffectNotificationBubble.tsx
    VisualEffectProvider.tsx
    VisualEffectScheduleTimeline.tsx
    VisualEffectSoundToggle.tsx
  hooks/
    useContainerWidth.ts
    useSnippetHoverState.ts
    animation/
      useEffectMotion.ts
      useEffectMotionValues.ts
      useEffectNodeAnimationController.ts
      useNodeTransitionFlags.ts
  model/
    constructors/
      code-snippets.ts
      controls.ts
      example-definition.ts
      finalizers.ts
      results.ts
      steps.ts
    domain.ts
    sound.ts
    snippet-highlights.ts
  runtime/
    SoundManager.ts
    VisualEffectManager.ts
    shiki-singleton.ts
    shiki-theme.ts
  state/
    atoms.ts
  ui/
    results/
      emoji.tsx
      error.tsx
      primitive.tsx
      temperature.tsx
```

The exact names may vary, but the separation of responsibilities must remain.

## Recommended module moves

### Move feature UI into feature folder

- `src/components/landing/examples/VisualEffect.tsx` -> `src/features/visual-effect/components/VisualEffect.tsx`
- `src/components/landing/examples/VisualEffects.tsx` -> `src/features/visual-effect/components/VisualEffects.tsx`
- `src/components/landing/examples/VisualEffectProvider.tsx` -> `src/features/visual-effect/components/VisualEffectProvider.tsx`

### Move feature hooks next to the feature

- `src/components/landing/examples/useContainerWidth.ts` -> `src/features/visual-effect/hooks/useContainerWidth.ts`
- `src/hooks/visual-effect/useSnippetHoverState.ts` -> `src/features/visual-effect/hooks/useSnippetHoverState.ts`
- `src/hooks/animation/*` -> `src/features/visual-effect/hooks/animation/*`

### Move runtime/state together

- `src/atoms/visual-effect.ts` -> `src/features/visual-effect/state/atoms.ts`
- `src/services/VisualEffectManager.ts` -> `src/features/visual-effect/runtime/VisualEffectManager.ts`
- `src/services/SoundManager.ts` -> `src/features/visual-effect/runtime/SoundManager.ts`

### Move feature model code out of shared lib

- `src/lib/visual-effect/domain.ts` -> `src/features/visual-effect/model/domain.ts`
- `src/lib/visual-effect/sound.ts` -> `src/features/visual-effect/model/sound.ts`
- `src/lib/visual-effect/snippet-highlights.ts` -> `src/features/visual-effect/model/snippet-highlights.ts`

### Split large modules while moving

- `src/lib/visual-effect/constructors.ts` -> `src/features/visual-effect/model/constructors/*`
- `src/lib/visual-effect/catalog.ts` -> `src/features/visual-effect/catalog/index.ts`

## Naming rules

Normalize multi-word filenames with full hyphenation.

Preferred examples:

- `effect-acquire-release.ts`
- `effect-race-all.ts`
- `effect-for-each.ts`
- `effect-add-finalizer.tsx`

Avoid compressed names like:

- `effect-acquirerelease.ts`
- `effect-raceall.ts`
- `effect-foreach.ts`

General file naming rules:

- React components: PascalCase
- hooks: camelCase with `use` prefix
- utility/model files: kebab-case
- folder names: kebab-case unless framework convention requires otherwise

## Shared structure cleanup

After feature extraction, tighten shared folders.

### `src/lib`

Recommended shared modules:

- `src/lib/utils.ts`
- `src/lib/install-command.ts`
- `src/lib/constants/*`

Optional subfolder normalization:

- `src/lib/animation.ts` -> `src/lib/animation/index.ts`
- `src/lib/navigation.ts` -> `src/lib/navigation/index.ts`
- `src/lib/open-graph.ts` -> `src/lib/open-graph/index.ts`

This is optional. Do not create index folders unless there is clear sub-structure.

### `src/components/landing`

Preferred end state:

- keep landing composition blocks/sections/layout here
- remove feature-heavy example internals from this folder

Possible target:

```text
src/components/landing/
  blocks/
  layout/
  sections/
    Examples.astro
```

`Examples.astro` can import the React island from `src/features/visual-effect/components/VisualEffects.tsx`.

## Root-level cleanup

Recommended root conventions:

```text
/
  specs/
  src/
  public/
  package.json
  astro.config.ts
  tsconfig.json
  flake.nix
```

Rules:

- move planning/refactor docs into `specs/`
- keep generated/runtime directories ignored and mentally out of project structure review
- avoid feature docs at root unless they are repository-level policies

Concrete move:

- `effect-example-v4-port-plan.md` -> `specs/effect-example-v4-port-plan.md`

## Route and config alignment

Reorganization should also fix obvious location drift.

Known issue:

- `src/lib/navigation.ts` links to `/podcasts/`
- route currently exists at `src/pages/podcast/index.astro`

This spec resolves the naming decision: `podcast` is the canonical term for now.

Migration must align navigation, route path, and feature folder naming to `podcast`.

Required direction:

- keep route naming as `podcast`
- update navigation config away from `/podcasts/`
- keep any future feature extraction under `src/features/podcast/`

## Dependency direction rules

These rules should hold after migration.

### Shared -> feature imports

Forbidden by default.

Shared code in `src/lib` and `src/components/ui` should not import from `src/features/*`.

### Feature -> shared imports

Allowed.

Examples:

- feature components importing `src/components/ui/*`
- feature code importing `src/lib/utils.ts`

### Feature internals

Prefer this direction:

- `model` has no dependency on `components`
- `runtime` may depend on `model`
- `state` may depend on `model` and `runtime`
- `components` may depend on `hooks`, `state`, `model`, `ui`

### Route files

`src/pages/*` should be thin composition layers where possible.

## Migration strategy

Do this in phases. Avoid one giant move.

### Phase 1: codify folder semantics

- [ ] add this spec to `specs/`
- [ ] align team understanding of `components`, `features`, `lib`, `hooks`, `services`, `atoms`
- [ ] stop adding new `visual-effect` modules to old locations during migration

### Phase 2: create feature shell

- [ ] add `src/features/visual-effect/`
- [ ] create subfolders: `catalog`, `components`, `hooks`, `model`, `runtime`, `state`, `ui`
- [ ] move files without major logic changes first
- [ ] update imports only

Goal: establish the new home before deeper refactors.

### Phase 3: split oversized files while inside new home

- [ ] split `constructors.ts` into smaller model files
- [ ] split `VisualEffectManager.ts` by orchestration concern
- [ ] split `SoundManager.ts` if still carrying unrelated responsibilities

Suggested `VisualEffectManager` split:

```text
src/features/visual-effect/runtime/
  VisualEffectManager.ts
  event-reducer.ts
  run-lifecycle.ts
  notifications.ts
  schedules.ts
  finalizers.ts
```

Suggested constructors split:

```text
src/features/visual-effect/model/constructors/
  example-definition.ts
  controls.ts
  code-snippets.ts
  results.ts
  finalizers.ts
  steps.ts
```

### Phase 4: remove old top-level feature buckets

- [ ] remove `src/lib/visual-effect`
- [ ] remove `src/hooks/visual-effect`
- [ ] remove feature-owned files from `src/hooks/animation`
- [ ] remove `src/atoms/visual-effect.ts`
- [ ] remove `src/services/VisualEffectManager.ts`
- [ ] remove `src/services/SoundManager.ts`

This phase only completes once imports no longer reference the old paths.

### Phase 5: tighten shared folders

- [ ] audit remaining `src/hooks/*` for shared-only usage
- [ ] audit `src/lib/*` for feature ownership leaks
- [ ] keep `src/components/landing` as composition only
- [ ] move root planning docs into `specs/`

### Phase 6: optional second feature extraction

If `podcast` grows beyond route helpers and simple data, extract it into:

```text
src/features/podcast/
  components/
  data/
  model/
```

Do not do this preemptively unless there is real complexity.

## Refactor safety rules

- preserve runtime behavior while moving files
- do not combine architecture moves with unrelated logic rewrites
- update imports in small reviewable batches
- keep route paths stable unless route rename is intentional and coordinated
- run typecheck after each migration phase

## Verification checklist

- [ ] `src/features/visual-effect` contains all feature-owned modules
- [ ] `src/lib` no longer contains `visual-effect`
- [ ] `src/services` contains no feature-owned `visual-effect` service
- [ ] `src/atoms` contains no feature-owned `visual-effect` atom
- [ ] `src/components/landing/examples` is removed or reduced to a thin compatibility surface during transition
- [ ] import graph follows shared -> feature prohibition
- [ ] route naming and nav naming are aligned
- [ ] root planning docs live in `specs/`
- [ ] typecheck passes
- [ ] build passes

## Suggested implementation order

For a low-risk sequence, use this order:

1. create `src/features/visual-effect/`
2. move components
3. move hooks
4. move model files
5. move runtime/state files
6. update route-level and section-level imports
7. split oversized modules
8. delete empty legacy folders
9. clean root docs and naming drift

## Acceptance criteria

This spec is complete when:

- feature-owned `visual-effect` code lives under one coherent feature root
- `src/lib` has a clear shared meaning again
- `src/components` is shared/site-shell oriented
- feature hooks/state/runtime no longer leak across unrelated top-level buckets
- oversized modules have an obvious home for future splitting
- root structure is cleaner and planning docs are under `specs/`

## Unresolved questions

None.
