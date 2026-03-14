# Quotes Section Port Specification

## Goal

This specification defines how to port the legacy quotes carousel from `.repos/landing/src/components/landing/QuotesSection.tsx` into the new Astro landing page at `src/components/landing/sections/Quotes.astro`.

The new implementation must preserve the spirit of the legacy section, but it must do so with an Astro-first architecture. React must not be reintroduced for this section unless a later constraint proves that a non-React solution is not viable. The preferred implementation is static Astro markup plus a small progressive-enhancement layer, ideally as a custom HTML element because the carousel behavior is self-contained and DOM-driven.

## Source of Truth

The primary behavioral source of truth is the `QuotesGridSection` export in `.repos/landing/src/components/landing/QuotesSection.tsx`.

The older `QuotesSection` export in the same file should be treated as historical reference only. It is useful for copy review and visual comparison, but it should not drive the new implementation because it lacks the richer auto-scrolling, infinite-loop, and interaction behavior present in `QuotesGridSection`.

## Current New-Site Context

The target file `src/components/landing/sections/Quotes.astro` is currently empty.

The section is rendered on the landing page from `src/pages/index.astro` after `CodingWithAi` and before the final `SectionDivider`. This means the quotes section must visually fit the same full-width, dark zinc marketing surface used by the surrounding Astro sections.

The new site already prefers Astro section shells with limited client-side behavior. The quotes port must follow that pattern and avoid a React island for a carousel that only needs imperative DOM coordination.

## Product Intent

The section exists to provide community proof and qualitative social validation near the bottom of the landing page.

It should feel like a living stream of endorsement rather than a static testimonial grid. The continuous horizontal movement is part of the storytelling because it implies breadth of adoption and ongoing momentum in the community.

The implementation should therefore preserve three things together: the editorial content, the horizontal card rail, and the sensation of a mostly self-running carousel that respectfully yields to user interaction.

## Recommended Architecture

The new section should be split into two layers.

The first layer should be server-rendered Astro markup that contains the heading, arrow controls, quote cards, fade overlays, and all quote data needed for first paint. This layer must render meaningful content even when JavaScript is unavailable.

The second layer should be a very small client enhancement that upgrades the static rail into an interactive infinite carousel. A custom element is the preferred shape because it encapsulates refs, timers, event listeners, cleanup, and configuration without introducing React hydration. A plain inline module script attached to a single section root is acceptable only if it stays equally self-contained.

## Content Requirements

The section should use the eight quotes defined in the legacy `QuotesGridSection` implementation.

The specification should preserve the longer, more recent copy from that export, including the following authors and companies: Dillon Mulroy / Cloudflare, Zach Warunek / Twitter, Matt Pocock / Total TypeScript, Cor / Union Build, Ethan Niser / Vercel, Samuel Briole / Spiko, David Golightly / Masterclass, and Matthew Phillips / Astro.

The implementation should preserve per-item logo presence rules. Zach Warunek should continue to use the fallback X icon instead of a company logo. David Golightly should continue to use the smaller logo treatment.

The section heading should follow the newer legacy variant: the eyebrow should read `// Community` and the title should read `What developers are saying...`.

## Data Modeling Requirements

Quote content should be defined once in Astro frontmatter or in a colocated typed data structure imported by `Quotes.astro`.

Each quote record should include the testimonial text, author name, company name, optional logo reference, and optional logo-size modifier. The structure should be intentionally close to the legacy data model so future editorial updates remain simple.

The data model should also support rendering a stable duplicate list for seamless looping. The duplication should be derived from one canonical array instead of hand-authoring repeated markup.

## Asset Requirements

The legacy section depends on logo assets that do not currently exist in the new site asset tree.

Before implementation, the port must audit and migrate the required logos from `.repos/landing/public/assets/quotes-logos/` and `.repos/landing/public/assets/test-logos/` into the new website asset structure. The migration should place assets in a stable, intentional location inside the new repo instead of continuing to reference legacy public paths.

The asset plan should cover at least these files or equivalent replacements: `Cloudflare_logo_wht 2.svg`, `total-typescript-logo.png`, `union-build.svg`, `vercel-logotype-dark.svg`, `spiko-logo.svg`, `masterclass-noM.svg`, and `Astro.svg`.

If a better normalized asset naming scheme is introduced during migration, the implementation may rename files, but the rendered visual output must remain equivalent.

## Layout Requirements

The section should remain full width, with the heading aligned to the same maximum content width used by other landing sections such as `Hero.astro` and `Testimonials.astro`.

The heading row should contain the section copy on the left and arrow navigation controls on the right. On narrow screens, the heading and controls may wrap or reflow, but they must remain legible and tappable.

The carousel rail should break out visually from the constrained heading container so that cards can scroll across the viewport while still appearing aligned to the central content column through responsive left and right padding.

The fade masks at the rail edges should be preserved because they hide the loop seam and communicate horizontal overflow. The mobile behavior may simplify the left fade if needed, but the rail should still feel intentionally framed.

## Card Design Requirements

Each quote card should remain a fixed-width, shrink-0 card in the scrolling rail.

The card should contain the quote text first and the attribution row pinned to the bottom. The attribution row should include the author name, a spacer or divider treatment, and the company logo or fallback icon.

The visual language should match the new site rather than copying old Tailwind classes verbatim. However, it should still feel like a sibling to the rest of the landing page through zinc surfaces, subtle borders, restrained contrast, and clean typography.

The new implementation should keep card heights visually consistent across the rail, but it must not truncate essential attribution content. Quote text may clamp if needed for layout discipline, though the final clamp behavior should be chosen to avoid awkward half-sentences.

## Interaction Requirements

The legacy behavior pauses and resumes based on visibility, hover, drag, touch, manual scrolling, and arrow-button use. The new implementation should preserve that interaction model in spirit, but it may simplify internal mechanics so long as the user-facing behavior remains consistent.

The carousel should auto-scroll only when the section is meaningfully in view. An `IntersectionObserver` remains the correct mechanism for this behavior.

The carousel should initialize from the middle copy of a triplicated card list so it can move left or right without immediately hitting a hard boundary.

The carousel should continuously advance horizontally at a slow, calm pace when active. The movement should feel ambient, not attention-seeking.

When the user hovers the rail, presses an arrow button, drags with a mouse, touches the rail, or manually scrolls, auto-scroll should pause. After a short period of inactivity, auto-scroll should resume if the section is still in view.

The implementation should preserve manual drag-to-scroll on pointer-capable devices because it is part of the current affordance. This behavior may be implemented with pointer events instead of separate mouse-only logic if that produces simpler and more robust code.

Arrow buttons should scroll by approximately one card plus gap. After manual navigation, the infinite-loop position should be normalized if the scroll offset has drifted near either duplicated edge.

## Infinite Loop Requirements

The loop must be visually seamless. Users should never encounter a hard stop at either edge of the rail.

The new implementation should keep the legacy duplication strategy of rendering three copies of the canonical quotes array. This is the simplest non-React approach and avoids DOM mutation during runtime.

The enhancement layer should maintain a measured single-set width and use that measurement to reposition the scroll container when the active scroll offset nears either extreme of the triplicated content.

The repositioning must happen without visible flicker. The user should perceive one continuous stream of cards.

## Progressive Enhancement Requirements

Without JavaScript, the section should still render as a horizontally scrollable strip of quote cards with visible arrow controls or, if that is not possible accessibly, with the arrow controls hidden from non-enhanced mode.

The non-enhanced state must not rely on JavaScript for the testimonial content itself. All quotes should be present in the HTML response.

JavaScript should enhance behavior only. It should not be responsible for generating cards, injecting content, or building the section from scratch.

## Accessibility Requirements

The section must remain keyboard accessible.

Arrow controls must be semantic `button` elements with clear accessible names. They must show visible focus treatment consistent with the rest of the landing page.

The scrollable region should remain usable with keyboard and assistive technology. If a custom element is used, it must not interfere with native semantics of the inner buttons and rail.

Logos must have appropriate alternative text. Decorative fallback icons should be hidden from assistive technology when the surrounding context already conveys the company.

Auto-scrolling motion must respect user comfort. Reduced-motion users should not receive continuous automatic movement.

## Reduced Motion Requirements

If `prefers-reduced-motion: reduce` is active, the carousel should not auto-scroll.

In reduced-motion mode, the section should still allow manual horizontal scrolling and arrow-button navigation. The rail should remain fully functional; only ambient motion should be removed.

Any animated snapping or smooth scrolling should be toned down or disabled in reduced-motion mode if that produces a more comfortable experience.

## Responsive Behavior Requirements

The section must work well on mobile, tablet, and desktop.

On mobile, cards should remain readable without becoming so wide that only a tiny fraction of the next card is visible. The rail should invite horizontal exploration.

On desktop, the heading row should feel balanced, and the fade masks should reinforce the panoramic card stream.

The rail padding should align the first visible card with the site content column while still allowing the rail to span the viewport width. This alignment should be implemented in a way that matches the max-width conventions already used across the new landing page.

## Styling Requirements

The port should preserve the overall tonal feel of the legacy section, but it should express that feel with the new site's patterns and spacing scale.

The section should continue to use the dark zinc palette, subtle border treatments, and muted mono eyebrow styling already present in `Testimonials.astro` and other landing sections.

The card styling should feel slightly premium and intentional rather than like a generic slider. The port should avoid introducing a bright accent color or an unrelated background treatment that breaks the continuity of the current page.

If the legacy section relied on utility combinations that no longer match the new site exactly, the implementation should adapt rather than copy blindly.

## Implementation Boundaries

The port should live primarily inside `src/components/landing/sections/Quotes.astro`.

If the client enhancement logic becomes large enough to deserve its own file, it should be extracted into a small colocated script or utility module dedicated to the quotes carousel. It should not become a generic abstraction unless a second real use case exists.

The implementation should not introduce a third-party carousel library. The legacy behavior is simple enough to own directly, and a library would add unnecessary weight to the landing page.

The implementation should not introduce a React island, global store, or cross-section dependency.

## Validation Requirements

Implementation should be validated in four ways.

First, visual verification should confirm that the section matches the legacy content and preserves the intended full-width carousel presentation.

Second, interaction verification should confirm that auto-scroll starts only in view, pauses on interaction, resumes after inactivity, and remains seamless through loop normalization.

Third, accessibility verification should confirm keyboard operability, focus visibility, semantic buttons, and reduced-motion behavior.

Fourth, responsive verification should confirm that the section remains polished on narrow screens and large desktops.

## Acceptance Criteria

The port is complete when `src/components/landing/sections/Quotes.astro` renders a fully styled quotes section that matches the legacy `QuotesGridSection` content and behavior without relying on React.

The port is complete when the section server-renders all testimonial content, enhances to an infinite carousel on the client, pauses respectfully on user interaction, and disables ambient auto-scroll for reduced-motion users.

The port is complete when the required logos are migrated into the new repo and the section fits visually with the rest of the Astro landing page.

## Explicit Non-Goals

This port does not need to preserve the unused legacy `QuoteCard` component structure exactly.

This port does not need to preserve React hook structure, React state names, or React event-handler boundaries.

This port does not need to create a reusable carousel framework for the rest of the site.

## Decisions (Resolved)

The migrated quote logo assets should live under `src/assets` in an appropriate landing-specific directory. The recommended destination is a dedicated path such as `src/assets/landing/quotes/` or `src/assets/logos/quotes/`, so the assets stay colocated with the new site rather than depending on legacy public files.

If filenames are normalized during migration, the new names should be clear, stable, and editorially maintainable.

## Detailed Todo List

### Phase 1 - Content and Assets

- [ ] Copy the eight quote entries from legacy `QuotesGridSection` into the new Astro section data model.
- [ ] Preserve the newer long-form quote copy, author names, company names, and per-item logo rules.
- [ ] Migrate all required quote logos from `.repos/landing/public/assets/quotes-logos/` and `.repos/landing/public/assets/test-logos/` into a dedicated directory under `src/assets`.
- [ ] Normalize asset filenames only if the renamed files remain clear and easy to maintain.

### Phase 2 - Astro Markup

- [ ] Implement the full section shell in `src/components/landing/sections/Quotes.astro`.
- [ ] Render the eyebrow, heading, navigation buttons, scroll rail, quote cards, and fade overlays in server-rendered Astro markup.
- [ ] Keep quote data canonical and derive the triplicated list from that single source.
- [ ] Ensure all testimonial content is present in the HTML before any JavaScript enhancement runs.

### Phase 3 - Carousel Enhancement

- [ ] Add a minimal client enhancement layer without React, preferably as a custom HTML element.
- [ ] Initialize the rail from the middle copy of the triplicated content.
- [ ] Measure one quote-set width and use it to normalize scroll position near either loop boundary.
- [ ] Implement ambient auto-scroll only while the section is in view.
- [ ] Pause auto-scroll on hover, pointer drag, touch interaction, manual scroll, and arrow-button navigation.
- [ ] Resume auto-scroll after a short idle delay when the section remains in view.
- [ ] Support pointer-based drag-to-scroll behavior on pointer-capable devices.
- [ ] Make arrow buttons move by roughly one card plus gap and re-normalize loop position after manual navigation.

### Phase 4 - Accessibility and Motion

- [ ] Keep arrow controls as semantic `button` elements with clear accessible names.
- [ ] Ensure focus-visible styles are obvious and consistent with the rest of the landing page.
- [ ] Keep logos and fallback icons accessible, including decorative handling where appropriate.
- [ ] Disable ambient auto-scroll when `prefers-reduced-motion: reduce` is active.
- [ ] Preserve manual scrolling and button-based navigation in reduced-motion mode.

### Phase 5 - Visual Integration

- [ ] Align the heading container width and rail padding with existing landing section conventions.
- [ ] Match the current site visual language rather than copying legacy classes blindly.
- [ ] Preserve the panoramic fade-mask presentation and polished dark zinc card styling.
- [ ] Tune mobile card sizing and desktop balance so the section feels deliberate at all breakpoints.

### Phase 6 - Validation

- [ ] Verify the section visually against legacy `QuotesGridSection` for content and overall behavior parity.
- [ ] Verify the infinite loop remains seamless and never exposes a hard boundary.
- [ ] Verify auto-scroll starts only when in view and pauses/resumes correctly during user interaction.
- [ ] Verify keyboard access, focus treatment, and reduced-motion behavior.
- [ ] Verify mobile, tablet, and desktop layouts manually.

## Unresolved Questions

None.
