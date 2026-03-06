# Visual Effect Code Snippets with Shiki Specification

## 1. Purpose

This specification defines the design and implementation plan for adding syntax-highlighted code snippets to the landing-page Visual Effect examples in `website-v4`, using Shiki.

The feature has two primary objectives:

1. Render readable, syntax-highlighted code next to each interactive Visual Effect example.
2. Preserve and improve the old hover-linked highlighting behavior so that hovering a step node highlights the corresponding code region.

This version explicitly updates the API so highlight selectors can be declared at the point of `addStep(...)`, removing the need for a separate mapping object.

## 2. Background and Legacy Review

### 2.1 Legacy implementation summary

The old website implemented code snippets and hover highlighting using the following components:

- `.repos/landing/src/components/CodeBlock.tsx`
- `.repos/landing/src/components/feedback/FloatingHighlight.tsx`
- `.repos/landing/src/components/display/EffectExample.tsx`

The old flow worked as follows:

1. `EffectExample` tracked the currently hovered visual effect node.
2. It looked up a text fragment from `effectHighlightMap`.
3. `FloatingHighlight` searched the rendered code text (`indexOf`) for that fragment.
4. It created a DOM `Range` and drew one animated rectangle around the matched content.

### 2.2 Legacy strengths

- The interaction felt responsive and understandable.
- The delayed hide behavior (`500ms`) reduced flicker when pointer transitions were fast.
- The floating box visual treatment was clear and fit the component design.

### 2.3 Legacy limitations that must be fixed

The old system had correctness issues:

- `indexOf` matching was first-hit only, so repeated text could map to the wrong location.
- Missing text did not fail fast at definition time.
- Highlight configuration was external to step definition, which created drift risk between step labels and highlight mappings.
- `CodeBlock` had unused API (`onLineHover`) that did not provide a complete link model.

## 3. Scope

### 3.1 In scope

- Landing-page Visual Effect examples (`src/components/landing/examples/*`).
- Example definition API (`src/lib/examples/constructors.ts`, catalog entries).
- Syntax highlighting implementation with Shiki.
- Hover-linked code region highlighting.

### 3.2 Out of scope

- Starlight documentation code block rendering pipeline.
- Replacing Astro markdown highlighting configuration.
- A full bidirectional hover contract (code hover driving node hover) in the first iteration.

## 4. Design Principles

1. **Bind highlight intent where the step is authored.**
2. **Fail at definition time, not at runtime.**
3. **Prefer deterministic selectors over fuzzy matching.**
4. **Use one long-lived Shiki highlighter instance.**
5. **Keep the old hover interaction feel.**

## 5. API Changes

## 5.1 Add snippet metadata to `defineExample`

`defineExample` input must include snippet metadata.

```ts
export interface ExampleCodeSnippetInput {
  readonly language: "typescript" | "javascript"
  readonly source: string
}

export interface DefineExampleInput {
  readonly label: string
  readonly subtitle?: string | undefined
  readonly description?: string | undefined
  readonly code: ExampleCodeSnippetInput
  readonly build: (ctx: BuildContext) => RenderableEffect<RenderableResult, RenderableResult>
}
```

This makes code snippets first-class example data rather than ad hoc UI props.

## 5.2 Extend `addStep(...)` options to include highlight selectors

`AddStepOptions` must gain an optional `highlight` field.

```ts
export type SnippetHighlightSelector =
  | {
      readonly _tag: "Text"
      readonly text: string
      readonly occurrence?: number // 1-based when text repeats
    }
  | {
      readonly _tag: "LineRange"
      readonly startLine: number // 1-based
      readonly endLine: number // inclusive
    }
  | {
      readonly _tag: "OffsetRange"
      readonly startOffset: number // 0-based
      readonly endOffset: number // exclusive
    }

export interface AddStepOptions {
  readonly label: string
  readonly highlight?: SnippetHighlightSelector | ReadonlyArray<SnippetHighlightSelector>
}
```

This is the key requested API change: highlights are authored inline with `addStep(...)`, so they are intrinsically tied to that step.

## 5.3 Add an API for result-node highlighting

Step highlights are now inline via `addStep`. The result node still needs a source of highlight selectors. The build context should therefore expose `setResultHighlight(...)`.

```ts
export interface BuildContext {
  readonly addStep: {
    <A extends RenderableResult, E extends RenderableResult>(
      self: RenderableEffect<A, E>,
      options: AddStepOptions,
    ): RenderableEffect<A, E>
    (
      options: AddStepOptions,
    ): <A extends RenderableResult, E extends RenderableResult>(
      self: RenderableEffect<A, E>,
    ) => RenderableEffect<A, E>
  }
  readonly setResultHighlight: (
    selectors: SnippetHighlightSelector | ReadonlyArray<SnippetHighlightSelector>,
  ) => void
}
```

This keeps highlight authorship in `build(...)` and avoids separate external maps entirely.

## 5.4 Example authoring with the new API

```ts
export const allExample = defineExample({
  label: "Effect.all",
  description: "Combine multiple effects into one",
  code: {
    language: "typescript",
    source: `const nyc = readTemperature("New York")
const berlin = readTemperature("Berlin")
const tokyo = readTemperature("Tokyo")
const london = readTemperature("London")

const result = Effect.all([nyc, berlin, tokyo, london])`,
  },
  build: ({ addStep, setResultHighlight }) => {
    const nyc = addStep(getTemperature(14, "900 millis"), {
      label: "nyc",
      highlight: { _tag: "Text", text: 'readTemperature("New York")' },
    })

    const berlin = addStep(getTemperature(11, "500 millis"), {
      label: "berlin",
      highlight: { _tag: "Text", text: 'readTemperature("Berlin")' },
    })

    const tokyo = addStep(getTemperature(18, "650 millis"), {
      label: "tokyo",
      highlight: { _tag: "Text", text: 'readTemperature("Tokyo")' },
    })

    const london = addStep(getTemperature(9, "400 millis"), {
      label: "london",
      highlight: { _tag: "Text", text: 'readTemperature("London")' },
    })

    setResultHighlight({
      _tag: "Text",
      text: "Effect.all([nyc, berlin, tokyo, london])",
    })

    return Effect.all([nyc, berlin, tokyo, london]).pipe(
      Effect.map((results) => new TemperatureArrayResult(results.map((r) => r.value))),
    )
  },
})
```

## 5.5 Example with repeated text and explicit occurrence

```ts
addStep(incrementEffect, {
  label: "increment3",
  highlight: {
    _tag: "Text",
    text: "Ref.updateAndGet(counter, n => n + 1)",
    occurrence: 3,
  },
})
```

This removes ambiguity for repeated expressions.

## 5.6 API semantics and invariants

The following behavior is required so implementation details remain deterministic:

- `highlight` in `addStep(...)` is optional. If omitted, hovering that step produces no code overlay.
- `setResultHighlight(...)` is optional. If omitted, hovering `result` produces no code overlay.
- `setResultHighlight(...)` may be called at most once per example build. A second call must fail during `defineExample(...)` compilation.
- A step can specify one selector or multiple selectors. Multiple selectors are merged into one range list for the same step target.
- Empty selector arrays are invalid and must fail at definition time.
- Example snippets are mandatory for every `defineExample(...)` call in this feature scope.

## 6. Data Model and Internal Representation

## 6.1 Add step IDs for stable target identity

`StepDefinition` should include a stable ID.

```ts
export interface StepDefinition {
  readonly id: string
  readonly label: string
}
```

The ID should be deterministic for each example definition, for example `step-0`, `step-1`, and so on.

## 6.2 Store resolved highlight ranges, not raw selectors

Resolved highlight ranges should be stored in the final example definition. UI code should not resolve selectors at hover time.

```ts
export interface ResolvedOffsetRange {
  readonly startOffset: number
  readonly endOffset: number
}

export interface ExampleCodeSnippet {
  readonly language: "typescript" | "javascript"
  readonly source: string
  readonly highlightsByTarget: Readonly<Record<string, ReadonlyArray<ResolvedOffsetRange>>>
}
```

Target keys should use a stable scheme:

- step target key: `step:${stepId}`
- result target key: `result`

## 7. Definition-Time Compilation and Validation

All selector resolution and validation must happen inside `defineExample(...)`.

## 7.1 Compilation algorithm

Given snippet source and selectors:

1. Normalize source according to a documented policy.
2. Convert each selector into one or more offset ranges.
3. Validate every range against source bounds.
4. Save only resolved ranges in `ExampleDefinition`.

## 7.2 Normalization policy

The normalization policy must be explicit and shared by selector resolution and display rendering. The implementation should use one helper function and avoid independent trimming in multiple layers.

Example:

- preserve internal whitespace exactly
- remove one leading newline from template literals if present
- remove one trailing newline if present

## 7.3 Selector resolution rules

### `Text`

- Find all exact matches in normalized source.
- If zero matches are found, throw a definition-time error.
- If multiple matches are found and `occurrence` is missing, throw a definition-time error.
- If `occurrence` is provided, validate it is in range.

### `LineRange`

- Convert line bounds to offsets using newline indices.
- Validate `startLine >= 1`, `endLine >= startLine`, and `endLine <= lineCount`.

### `OffsetRange`

- Validate `0 <= startOffset < endOffset <= source.length`.

## 7.4 Error model

Definition errors should be explicit and include enough context to fix quickly.

```ts
import { Schema } from "effect"

export class SnippetHighlightResolutionError extends Schema.TaggedError<SnippetHighlightResolutionError>()(
  "SnippetHighlightResolutionError",
  {
    exampleLabel: Schema.String,
    targetKey: Schema.String,
    selector: Schema.String,
    reason: Schema.Literal("NoMatch", "AmbiguousMatch", "InvalidRange"),
    matches: Schema.optional(Schema.Number),
  },
) {}
```

All selector-compilation failures must use tagged errors. The implementation should not throw untyped `Error` values for validation failures.

In addition, compilation should define and use specific tagged errors for structural mistakes:

- `DuplicateResultHighlightError`
- `EmptyHighlightSelectorsError`
- `InvalidSnippetLanguageError`

Each error payload must include `exampleLabel` and enough context to fix authoring quickly.

Suggested error text format:

`[Effect.all] target=step:step-2 selector=Text("Ref.updateAndGet...") is ambiguous; 5 matches found; provide occurrence`.

## 7.5 Definition compilation pseudocode

The following pseudocode is the required internal control flow for `defineExample(...)`:

```ts
const steps: Array<StepDefinition> = []
const selectorsByTarget: Record<string, Array<SnippetHighlightSelector>> = {}
let resultHighlightSet = false

const addStep = (effect, options) => {
  const step = makeStep(options.label) // assigns deterministic step.id
  steps.push(step)

  if (options.highlight !== undefined) {
    selectorsByTarget[`step:${step.id}`] = normalizeSelectorInput(options.highlight)
  }

  return annotateEffectWithExampleStep(effect, step)
}

const setResultHighlight = (selectors) => {
  if (resultHighlightSet) throw new DuplicateResultHighlightError(...)
  resultHighlightSet = true
  selectorsByTarget.result = normalizeSelectorInput(selectors)
}

const program = input.build({ addStep, setResultHighlight })
const normalizedCode = normalizeSnippetSource(input.code.source)
const highlightsByTarget = resolveAllSelectors(normalizedCode, selectorsByTarget)

return {
  ...exampleMetadata,
  steps,
  program,
  code: {
    language: input.code.language,
    source: normalizedCode,
    highlightsByTarget,
  },
}
```

This section is intentionally explicit so a fresh coding session can implement constructor changes without reverse engineering.

## 8. Shiki Integration

## 8.1 Dependency

Add `shiki` to project dependencies.

No additional transformer package is required for the first iteration.

## 8.2 Custom theme

The new implementation must define a custom Shiki theme that mirrors the old Prism color language used by `.repos/landing/src/components/CodeBlock.tsx`.

The theme should be defined in a dedicated module, for example `src/components/landing/examples/shiki-theme.ts`, and loaded by the singleton highlighter.

```ts
import type { ThemeRegistrationAny } from "shiki"

export const effectShikiTheme: ThemeRegistrationAny = {
  name: "effect-dark",
  type: "dark",
  colors: {
    "editor.foreground": "#d4d4d8",
    "editor.background": "#00000000",
  },
  tokenColors: [
    {
      scope: ["keyword", "storage", "keyword.operator", "entity.name.tag"],
      settings: { foreground: "#a78bfa" },
    },
    {
      scope: ["string", "string.quoted", "meta.attribute", "template.expression"],
      settings: { foreground: "#34d399" },
    },
    {
      scope: ["comment", "punctuation.definition.comment"],
      settings: { foreground: "#71717a", fontStyle: "italic" },
    },
    {
      scope: ["entity.name.function", "entity.name.type"],
      settings: { foreground: "#f4f4f5" },
    },
    {
      scope: ["constant.numeric", "constant.language.boolean"],
      settings: { foreground: "#fbbf24" },
    },
    {
      scope: ["punctuation", "meta.brace"],
      settings: { foreground: "#a1a1aa" },
    },
    {
      scope: ["variable", "support.constant", "entity.other.attribute-name"],
      settings: { foreground: "#d4d4d8" },
    },
  ],
}
```

The exact scope list can be refined during implementation, but the output should visually match the old palette: violet keywords, emerald strings, muted zinc comments, amber numbers, and zinc punctuation.

## 8.3 Highlighter lifetime and caching

Implement `src/components/landing/examples/shiki-singleton.ts` and cache one highlighter promise for the React island lifecycle.

The highlighter must not be recreated per render.

```ts
let highlighterPromise: Promise<HighlighterGeneric<never, never>> | undefined = undefined

export const getHighlighter = () => {
  if (highlighterPromise !== undefined) {
    return highlighterPromise
  }

  highlighterPromise = createHighlighter({
    themes: [effectShikiTheme],
    langs: ["typescript", "javascript"],
  })

  return highlighterPromise
}
```

## 8.4 Tokenization strategy

Use `codeToTokens(...)` or `codeToTokensBase(...)` and render React spans directly.

Do not use `dangerouslySetInnerHTML`.

Rationale:

- Token data includes stable absolute offsets (`ThemedToken.offset`), which align with resolved highlight ranges.
- React-driven rendering keeps composition and styling in one system.

## 8.5 Token result caching

Cache tokenization by `(language, source)` key to avoid repeat work while tabs change.

Suggested key:

```ts
const key = `${language}::${source}`
```

## 9. Rendering and Interaction Model

## 9.1 New component structure

The user interface layer will introduce three new components and one updated container:

- `src/components/landing/examples/VisualEffect.tsx` (updated)
- `src/components/landing/examples/VisualEffectCodeSnippet.tsx` (new)
- `src/components/landing/examples/FloatingCodeHighlight.tsx` (new)
- `src/components/landing/examples/useSnippetHoverState.ts` (new)

The existing provider structure (`ExampleContext` and `StepContext`) remains the propagation backbone.

## 9.2 End-to-end propagation pipeline

Highlight metadata propagation must follow this exact lifecycle:

1. **Definition phase (`defineExample`)**
   - `addStep(..., { highlight })` captures selector metadata together with the created step definition.
   - `setResultHighlight(...)` captures result-node selectors.
   - `defineExample(...)` resolves selectors into offset ranges and stores them in `example.code.highlightsByTarget`.

2. **Catalog phase (`EXAMPLES_CATALOG`)**
   - Compiled `ExampleDefinition` objects are stored in the category catalog.

3. **Selection phase (`VisualEffects`)**
   - The active example tab selects a specific `ExampleDefinition`.
   - That definition is passed to `<VisualEffect example={example} />`.

4. **Context phase (`VisualEffect`)**
   - `ExampleContext.Provider` publishes the active `ExampleDefinition` to all descendant UI nodes.
   - Each rendered step is wrapped in `StepContext.Provider` with its `StepDefinition`.

5. **Hover phase (node components)**
   - Hovering a step node emits target key `step:${step.id}`.
   - Hovering result node emits target key `result`.
   - `VisualEffect` stores this as `hoveredTarget` and derives `delayedTarget` via `useSnippetHoverState`.

6. **Snippet phase (`VisualEffectCodeSnippet`)**
   - Reads `example.code.source`, `example.code.language`, and `example.code.highlightsByTarget`.
   - Tokenizes source via Shiki and renders spans with offsets.
   - Looks up active ranges by `delayedTarget` and passes them to `FloatingCodeHighlight`.

7. **Overlay phase (`FloatingCodeHighlight`)**
   - Resolves DOM geometry for active ranges.
   - Renders one animated union rectangle.
   - Hides when no active target or no ranges are available.

This is the authoritative flow from authored highlight selector to on-screen highlight rectangle.

## 9.3 Concrete propagation contract in code

The following code sketch describes the required data path through `VisualEffect`.

```ts
function VisualEffectSurface() {
  const example = useExampleDefinition()
  const [hoveredTarget, setHoveredTarget] = React.useState<string | null>(null)
  const delayedTarget = useSnippetHoverState(hoveredTarget, 500)

  return (
    <>
      <VisualEffectNodes onHoverTargetChange={setHoveredTarget} />
      <VisualEffectCodeSnippet
        snippet={example.code}
        activeTarget={delayedTarget}
      />
    </>
  )
}
```

Step node plumbing must be explicit:

```ts
function VisualEffectStepNode({ onHoverTargetChange }: { onHoverTargetChange: (target: string | null) => void }) {
  const step = useStepDefinition()
  const target = `step:${step.id}`

  return (
    <VisualEffectNode
      label={step.label}
      onMouseEnter={() => onHoverTargetChange(target)}
      onMouseLeave={() => onHoverTargetChange(null)}
    />
  )
}
```

Result node plumbing must use `result` as target key:

```ts
<VisualEffectNode
  label="result"
  onMouseEnter={() => onHoverTargetChange("result")}
  onMouseLeave={() => onHoverTargetChange(null)}
/>
```

## 9.4 Hover target flow

The runtime target lookup is deterministic:

1. UI emits target key.
2. Snippet component runs `const ranges = highlightsByTarget[target] ?? []`.
3. Empty range set means no overlay.
4. Non-empty range set drives overlay geometry.

There is no text search at hover time.

## 9.5 Delayed hide behavior

The implementation must preserve the legacy delayed hide behavior:

- Show immediately on hover enter.
- On hover leave, keep highlight visible for `500ms`.
- If another target is entered during that delay, cancel hide and switch immediately.

This behavior must be implemented centrally in `useSnippetHoverState.ts` so all nodes share one consistent policy.

## 9.6 Geometry computation

The overlay box is computed as the union of all token-span rectangles that intersect active ranges.

Implementation guidance:

1. Render token spans with `data-start` and `data-end` offsets.
2. Select spans where `spanStart < rangeEnd && spanEnd > rangeStart`.
3. Read `getBoundingClientRect()` for all selected spans.
4. Compute one union rectangle.
5. Convert viewport rect to snippet-container-local coordinates.

This replaces fragile text-node traversal and guarantees that the UI uses the same offsets produced during selector compilation.

## 9.7 Visual style

Keep the old visual language for the first version:

- background: `rgba(56, 189, 248, 0.15)`
- border: `1px solid rgba(56, 189, 248, 0.6)`
- soft glow shadow
- spring animation for x/y/width/height and opacity

## 9.8 UI placement and event ownership

To avoid ambiguity in implementation, the snippet panel must be rendered inside the same bordered card as controls and nodes.

Required layout order in `VisualEffect.tsx`:

1. `VisualEffectControls`
2. `VisualEffectNodes`
3. `VisualEffectCodeSnippet`

The snippet section should be separated by a border and use the same card background family so the interaction reads as one component.

Hover events must originate from `VisualEffectNode` itself (or its immediate wrapper in `VisualEffectStepNode` / `VisualEffectResultNode`). The source of truth for active target remains in `VisualEffectSurface`, not in individual nodes.

On touch devices, hover may not occur; this is acceptable. The snippet still renders normally, and no fallback tap-to-highlight behavior is required in this iteration.

## 10. Accessibility and UX

The following requirements are mandatory:

- Snippet text must remain selectable.
- Highlight overlay must set `pointer-events: none`.
- The snippet must be readable without hover.
- Reduced-motion users must get a non-jarring transition.

Reduced-motion policy:

- Keep highlight visibility toggles functional.
- Reduce or remove spring movement where possible.

## 11. Styling Requirements

Code snippet styling should be aligned with existing landing styles and must not affect docs code blocks.

Minimum style contract:

- `font-mono` and existing JetBrains Mono family.
- Horizontal scroll for long lines.
- No forced wrapping that breaks offsets.
- Consistent line height to stabilize overlay geometry.

## 12. Migration Plan

## 12.1 Source migration

Existing legacy examples used this shape:

```ts
const effectHighlightMap = {
  nyc: { text: 'readTemperature("New York")' },
}
```

New examples must define highlight selectors directly inside `addStep(...)` and `setResultHighlight(...)`.

## 12.2 Mechanical migration example

Before:

```ts
const nyc = useVisualEffect("nyc", ...)
const taskHighlightMap = {
  nyc: { text: 'readTemperature("New York")' },
}
```

After:

```ts
const nyc = addStep(getTemperature(...), {
  label: "nyc",
  highlight: { _tag: "Text", text: 'readTemperature("New York")' },
})
```

## 13. Implementation Plan

## Phase 1: API and model updates

1. Extend `DefineExampleInput` with `code`.
2. Extend `AddStepOptions` with `highlight`.
3. Add `setResultHighlight(...)` to `BuildContext`.
4. Add `step.id` and resolved snippet model to `ExampleDefinition`.

## Phase 2: Selector resolution and validation

1. Implement `src/lib/examples/snippet-highlights.ts`.
2. Resolve selectors at definition time.
3. Throw explicit errors on mismatch/ambiguity.

## Phase 3: Shiki renderer

1. Add `shiki` dependency.
2. Add singleton highlighter module.
3. Build token renderer component.
4. Add loading and error fallbacks.

## Phase 4: Hover highlight overlay

1. Add delayed-hover state hook.
2. Add floating overlay component.
3. Integrate node hover target propagation in `VisualEffect.tsx`.

## Phase 5: Catalog migration

1. Update each file in `src/lib/examples/catalog/*.tsx`.
2. Move highlight intent into `addStep(...)` calls.
3. Add `setResultHighlight(...)` where result mapping is needed.

## 14. File-Level Change Plan

- `src/lib/examples/constructors.ts`
  - Add code snippet input fields.
  - Add `highlight` support in `AddStepOptions`.
  - Add `setResultHighlight(...)` to build context.
  - Add `id` to `StepDefinition`.

- `src/lib/examples/snippet-highlights.ts` (new)
  - Selector resolution.
  - Validation and errors.
  - Offset range compilation.

- `src/lib/examples/catalog/*.tsx`
  - Add `code` to each example definition.
  - Move step highlight selectors into `addStep(...)`.

- `src/components/landing/examples/VisualEffect.tsx`
  - Add snippet panel and hover state wiring.

- `src/components/landing/examples/VisualEffectNode.tsx`
  - Surface hover enter/leave callbacks with stable target keys.

- `src/components/landing/examples/VisualEffectCodeSnippet.tsx` (new)
  - Shiki token rendering.
  - Range-to-rect element mapping.

- `src/components/landing/examples/FloatingCodeHighlight.tsx` (new)
  - Animated overlay rendering.

- `src/components/landing/examples/useSnippetHoverState.ts` (new)
  - Immediate show + delayed hide logic.

- `src/components/landing/examples/shiki-theme.ts` (new)
  - Custom Shiki theme mirroring old Prism palette.

- `src/components/landing/examples/shiki-singleton.ts` (new)
  - Highlighter lifecycle and token cache.

- `src/styles/global.css`
  - Snippet-specific utility classes and overlay refinements, scoped to landing examples.

## 15. Testing Strategy

The repository currently does not define a unit test runner script in `package.json`. For this feature, implementation may proceed with:

- pure-function tests if a test runner is introduced as part of the change, or
- strict compile-time validation plus manual verification if introducing a new test framework is deemed out of scope.

In both cases, the behavior listed below is mandatory to verify before completion.

## 15.1 Unit tests (pure logic)

Create tests for selector resolution:

- `Text` selector resolves unique match.
- `Text` selector fails on no match.
- `Text` selector fails on ambiguity without `occurrence`.
- `Text` selector resolves requested occurrence.
- `LineRange` selector validates line bounds.
- `OffsetRange` selector validates offset bounds.

Create tests for delayed hover behavior:

- Enter shows immediately.
- Leave hides after 500ms.
- Re-enter before timeout cancels pending hide.

## 15.2 Integration checks

- Hovering each step node highlights the expected snippet region.
- Result node highlight works where configured.
- Repeated expressions map correctly with `occurrence`.
- Long lines remain scrollable and highlight geometry remains correct.
- Token colors visually match the old website palette expectations.

## 15.3 Build checks

- `pnpm check`
- `pnpm lint`
- `pnpm build`

## 16. Acceptance Criteria

The feature is accepted when all of the following are true:

1. Every Visual Effect example can render a syntax-highlighted snippet from `defineExample(...).code`.
2. Step highlight selectors are authored directly in `addStep(...)` calls.
3. No separate step-to-highlight mapping object is required.
4. Hovering a step or result node highlights the intended code region.
5. Ambiguous or missing selectors fail at definition time with actionable errors.
6. The old hover feel (including delayed hide) is preserved.
7. The snippet color language is provided by a custom Shiki theme matching legacy Prism styling.
8. The docs rendering pipeline remains unchanged.

## 17. Fresh-Session Execution Checklist

This checklist is included so a new coding agent can implement without prior context:

1. Update constructor types (`AddStepOptions`, `BuildContext`, `StepDefinition`, `ExampleDefinition`, `defineExample` input).
2. Implement selector normalization/resolution module with tagged errors.
3. Compile selectors during `defineExample(...)` into `highlightsByTarget`.
4. Add snippet metadata and inline `highlight` selectors across catalog examples.
5. Add custom Shiki theme module and singleton highlighter module.
6. Build `VisualEffectCodeSnippet` token renderer with data offsets.
7. Add floating overlay and delayed hover state hook.
8. Wire node hover target propagation through `VisualEffect.tsx`.
9. Verify behavior manually across categories and run `pnpm check`, `pnpm lint`, `pnpm build`.

## 18. Open Questions

None.
