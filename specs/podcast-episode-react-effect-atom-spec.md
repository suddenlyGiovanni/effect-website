# Podcast Episode React + Effect Atom Refactor Specification

## Intent

This spec defines a staged refactor of the podcast episode experience from Astro-driven interactive markup plus imperative custom-element wiring into a React island backed by Effect Atom.

Primary goal: preserve Astro for routing, content loading, and static SEO surface, while moving the player-linked interaction domain into a typed, explicit, React-managed runtime model that can support continued product growth.

This is not a full-site React migration. It is a targeted podcast episode interaction refactor.

## Scope

This specification covers:

- podcast episode page interaction architecture
- YouTube player integration
- chapter and transcript synchronization
- Effect Atom state model for episode playback UI
- migration boundaries between Astro and React
- phased implementation and validation

This specification does not require:

- changing podcast route URLs
- changing podcast content source format beyond what interaction needs
- redesigning the whole page visually
- introducing a global media player shared across the whole site in this phase

## Current situation

The current podcast episode route at `src/pages/podcast/episodes/[slug].astro` is Astro-first and server-renders correctly.

Interactive behavior currently lives inside `src/features/podcast/components/PodcastEpisodeLayout.astro` as custom-element script logic that coordinates:

- expand / collapse video
- chapter click -> seek
- transcript click -> seek
- transcript active-line highlighting
- transcript auto-scroll
- YouTube iframe API loading and polling

Transcript rendering currently lives in `src/features/podcast/components/PodcastTranscript.astro`, where SRT is parsed server-side and rendered into Astro markup.

This works, but feature growth is already pushing the current shape into an awkward middle ground:

- interaction state is real and cross-cutting
- DOM querying is carrying coordination logic
- player lifecycle, UI state, and derived state are mixed together
- future features will increase coupling rather than reduce it

## Why refactor now

The page is no longer a simple static document with one or two DOM enhancements.

It is becoming an interactive media surface with coupled state across:

- player readiness
- playback time
- active chapter
- active transcript cue
- user-initiated seek state
- transcript follow-scroll state
- video layout state

That kind of behavior is better modeled as a client runtime tree with explicit state than as imperative DOM orchestration attached to Astro markup.

The repo already uses React islands and already depends on `effect` plus `@effect/atom-react`, so the new implementation should lean into the existing stack rather than invent a second ad-hoc client architecture.

For Effect v4 patterns and reference implementation details, the local reference codebase at `.repos/effect-smol/` should be treated as an explorable source of truth during implementation.

## Architecture decision

The episode page should remain Astro at the route and server-content level.

The interactive podcast surface should move into one React island rendered from Astro.

The recommended boundary is:

- Astro owns route params, content collection reads, transcript file reads, SEO, and page shell
- React owns player runtime, chapters UI behavior, transcript interaction, and all playback-linked state
- Effect Atom is the source of truth for client state inside the island

This means the refactor is not “rewrite the page in React”. It is “replace imperative player wiring with one coherent React + Atom runtime”.

## Product intent

The podcast episode page should feel like a real listening / watching surface rather than a static blog post with embedded media.

Core user flows this architecture must support cleanly:

- click a chapter and jump playback
- click a transcript line and jump playback
- see the currently spoken transcript line highlighted while video plays
- keep transcript position following playback without feeling jittery
- keep chapter state synchronized with playback time
- expand and collapse the player without layout bugs
- support more advanced playback-linked features later without redoing the architecture again

Likely future features this refactor should make easier:

- active chapter highlighting
- URL deep-linking to timestamps
- transcript search / filtering
- copy link to current timestamp
- playback preferences
- mobile drawer / compact transcript modes
- persisted progress or resume behavior

## Recommended target structure

The route stays where it is:

- `src/pages/podcast/episodes/[slug].astro`

The interactive domain should be grouped under `src/features/podcast/` in a player-focused subtree.

Recommended structure:

```text
src/features/podcast/
  components/
    PodcastEpisodeLayout.astro
    PodcastEpisodeBody.astro
    PodcastGuestCard.astro
    PodcastEpisodePlayer.tsx
    PodcastPlayerShell.tsx
    PodcastPlayerVideo.tsx
    PodcastPlayerChapters.tsx
    PodcastPlayerTranscript.tsx
    PodcastPlayerTranscriptLine.tsx
    PodcastPlayerControls.tsx
  model/
    transcript.ts
    chapters.ts
    youtube.ts
    episode-player.ts
  state/
    podcast-player-atoms.ts
  runtime/
    youtube-player.ts
    transcript-follow.ts
  lib/
    transcript.ts
  utils.ts
```

Exact filenames may vary, but the split of concerns should remain:

- `model/` for typed domain data and selectors
- `state/` for Effect Atom graph
- `runtime/` for YouTube / browser lifecycle integration
- React components for rendering only

## Island boundary

`PodcastEpisodeLayout.astro` should stop implementing player behavior directly.

Instead it should:

1. receive `entry`
2. receive normalized chapter data
3. receive normalized transcript cue data
4. render static surrounding layout as needed
5. mount a single React island for the interactive subtree

Recommended shape:

- `PodcastGuestCard.astro` can stay Astro if it is static
- `PodcastEpisodeBody.astro` can stay Astro if it is static
- `PodcastEpisodePlayer.tsx` should own video + chapters + transcript interactive coordination

There are two valid layout options:

### Option A - Single island for only interactive sections

- Astro renders shell grid
- React island renders video control area, chapters, and transcript inside fixed slots

### Option B - Single island for the entire right/left interactive grid

- Astro renders the page shell and passes one payload into `PodcastEpisodePlayer.tsx`
- React renders video section, toggle, chapters, transcript
- Astro continues rendering episode notes below

Preferred option: **B**. It gives one coherent client tree for all player-linked UI and removes cross-boundary coordination hacks.

Decision refinement: the React island should own only player-linked widgets, not the guest card or the broader sidebar shell.

That means Astro should continue to render static surrounding surfaces, while the React island owns the video, expand control, chapters, transcript, and other playback-aware widgets.

## Data normalization requirements

Astro should normalize all server-derived podcast interaction data before it enters React.

That means the island should not receive raw SRT parser records.

Introduce explicit typed view models such as:

```ts
export interface PodcastChapterView {
  readonly id: string
  readonly title: string
  readonly startLabel: string
  readonly startSeconds: number
}

export interface PodcastTranscriptCueView {
  readonly id: string
  readonly startSeconds: number
  readonly endSeconds: number
  readonly startLabel: string
  readonly text: string
}

export interface PodcastEpisodePlayerPayload {
  readonly youtubeVideoId: string
  readonly youtubeTitle: string
  readonly chapters: ReadonlyArray<PodcastChapterView>
  readonly transcript: ReadonlyArray<PodcastTranscriptCueView>
}
```

Normalization responsibilities:

- parse timestamps once on the server
- guarantee stable ids for chapter and transcript items
- remove presentation-specific string parsing from client runtime
- make illegal states unrepresentable before hydration

## Effect Atom design

Effect Atom should be used as the source of truth for episode player state.

This should not be a pile of unrelated atoms. It should be a coherent domain model.

Recommended state buckets:

### 1) Static input atoms

- episode payload atom
- chapters atom
- transcript cues atom

These are effectively read-only atoms created from Astro payload.

### 2) Player lifecycle atoms

- player api readiness atom
- player status atom: `idle | loading | ready | playing | paused | ended | error`
- current time atom
- duration atom if available
- last seek request atom

### 3) UI state atoms

- expanded video atom
- transcript follow mode atom
- transcript user-scroll lockout atom
- highlighted cue id atom
- highlighted chapter id atom
- pending deep-link timestamp atom if later added

### 4) Derived atoms

- active transcript cue atom derived from current time
- active chapter atom derived from current time
- transcript viewport target atom
- visible transcript window atom if later needed

### 5) Command / write atoms

- `seekToAtom(seconds)`
- `playAtom`
- `pauseAtom`
- `toggleExpandedAtom`
- `setTranscriptFollowAtom`
- `reportPlayerReadyAtom`
- `reportPlayerStateAtom`
- `reportCurrentTimeAtom`

## Effect Atom modeling rules

The player state should follow these rules:

1. YouTube iframe object itself should not be the source of truth.
2. Atom state should represent app truth; the YouTube player is an external runtime dependency.
3. Browser effects should flow through clearly named command atoms or runtime adapters.
4. Derived selection such as active cue / active chapter must be computed from canonical current time, not separately tracked by ad-hoc event handlers.
5. Scroll behavior must be driven by derived intent plus suppression rules, not direct `querySelector` chains scattered across components.

## Runtime adapter plan

YouTube integration should move behind a dedicated runtime adapter.

Recommended file: `src/features/podcast/runtime/youtube-player.ts`

Responsibilities:

- load `https://www.youtube.com/iframe_api`
- create player instance
- translate YouTube events into atom writes
- expose typed commands for seek / play / pause / get current time
- manage cleanup on unmount

The React layer should not manually `postMessage` into iframes after this refactor. That behavior should be encapsulated in one runtime abstraction.

If the final implementation still uses the iframe API under the hood, that is acceptable, but the rest of the UI must consume a typed interface rather than raw DOM access.

## Transcript synchronization design

Transcript behavior should be modeled explicitly.

Required behaviors:

- active cue tracks current playback time
- active cue highlight updates predictably
- transcript can auto-follow the active cue
- clicking a cue seeks playback
- manual transcript scrolling can temporarily suspend auto-follow
- auto-follow can resume after a cooldown or explicit reset

Recommended state model:

- `transcriptFollowMode = "auto" | "paused-by-user"`
- `lastTranscriptUserScrollAt`
- derived `shouldAutoFollow`

Decision: transcript follow should auto-resume after a short idle timeout rather than requiring explicit user action.

Recommended starting policy:

- pause follow when user manually scrolls transcript
- resume automatically after roughly 4-6 seconds of no transcript interaction
- keep scroll-to-active behavior keyed to active cue changes only

Recommended runtime behavior:

- when current cue changes and `shouldAutoFollow` is true, scroll the active cue into view
- when user manually scrolls transcript container, suppress follow temporarily
- do not call smooth scroll every polling tick; only scroll when active cue id changes

## Chapter synchronization design

Chapter behavior should be derived, not manually toggled.

Required behaviors:

- click chapter -> seek playback
- active chapter follows playback time
- chapter UI can highlight current section

Recommended derivation:

- active chapter = last chapter whose `startSeconds <= currentTime`

No separate mutable “selected chapter” UI state should be needed except for transient hover / focus styling.

## React component plan

Recommended components:

### `PodcastEpisodePlayer.tsx`

Top-level island root.

Responsibilities:

- create atom scope / provider if needed
- mount runtime hooks
- render main player surface

### `PodcastPlayerShell.tsx`

Grid / layout component for video, toggle, chapters, transcript.

### `PodcastPlayerVideo.tsx`

Owns iframe host element and runtime mount point.

### `PodcastPlayerChapters.tsx`

Reads chapter list and active chapter atom.

### `PodcastPlayerTranscript.tsx`

Reads transcript cue list and active cue atom.

Responsibilities:

- transcript scroll container ref
- follow-scroll hookup
- render cues efficiently

### `PodcastPlayerTranscriptLine.tsx`

Small render unit for one cue.

### `PodcastPlayerControls.tsx`

Owns expand / collapse and any future media actions.

## Astro responsibilities after refactor

Astro should continue to do these jobs:

- `getStaticPaths`
- content collection reads
- transcript file loading
- transcript parsing
- payload normalization
- page metadata
- route-level composition
- rendering episode notes markdown / MDX
- rendering static guest / surrounding content where not interactive

Astro should stop doing these jobs for the player area:

- imperative event listeners
- custom-element player orchestration
- DOM queries for active transcript / chapters
- manual YouTube API lifecycle logic

## Existing file migration plan

### Keep, but simplify

- `src/pages/podcast/episodes/[slug].astro`
- `src/features/podcast/components/PodcastEpisodeBody.astro`
- `src/features/podcast/components/PodcastGuestCard.astro`

### Replace or heavily reduce

- `src/features/podcast/components/PodcastEpisodeLayout.astro`
- `src/features/podcast/components/PodcastVideo.astro`
- `src/features/podcast/components/PodcastChapters.astro`
- `src/features/podcast/components/PodcastTranscript.astro`

### Add

- `src/features/podcast/components/PodcastEpisodePlayer.tsx`
- `src/features/podcast/state/podcast-player-atoms.ts`
- `src/features/podcast/runtime/youtube-player.ts`
- `src/features/podcast/model/episode-player.ts`
- `src/features/podcast/lib/transcript.ts`

## State boundary rules

These rules should hold after migration:

### Astro -> React

Allowed:

- normalized serializable payload only

Not allowed:

- raw file paths
- parser instances
- DOM elements
- ad-hoc callback closures closing over Astro script state

### React components -> runtime

Allowed:

- typed commands and lifecycle hooks

Not allowed:

- direct `window.YT` manipulation in multiple components
- duplicated polling loops

### Atoms -> runtime

Preferred direction:

- runtime reports external state into atoms
- UI sends commands via write atoms / hooks

Avoid circular designs where components and runtime both fight for control of the same state.

## Implementation phases

### Phase 1 - Domain model and payload normalization

- [ ] Add typed chapter and transcript view models under `src/features/podcast/model/`
- [ ] Extract shared transcript parsing / normalization helpers from `PodcastTranscript.astro` into `src/features/podcast/lib/transcript.ts`
- [ ] Normalize chapter frontmatter into stable ids + parsed seconds
- [ ] Normalize SRT cues into stable ids + parsed seconds + display label
- [ ] Define one `PodcastEpisodePlayerPayload` type for Astro -> React handoff

Goal: get all player data into a stable serializable shape before moving UI.

### Phase 2 - Introduce Effect Atom player state

- [ ] Add `src/features/podcast/state/podcast-player-atoms.ts`
- [ ] Define payload atom, current time atom, player status atom, expanded atom, transcript follow atom
- [ ] Define derived active chapter atom
- [ ] Define derived active transcript cue atom
- [ ] Define write atoms / command helpers for seek, toggle expand, and runtime event reporting
- [ ] Keep atoms typed and local to podcast feature

Goal: codify one coherent player state graph before React UI grows around it.

### Phase 3 - Add React island root

- [ ] Create `src/features/podcast/components/PodcastEpisodePlayer.tsx`
- [ ] Accept normalized payload props from Astro
- [ ] Mount the player island from `PodcastEpisodeLayout.astro` or directly from route composition
- [ ] Keep Astro page shell intact
- [ ] Remove custom-element orchestration from layout component once island is in place

Goal: establish React as the only owner of player-linked interaction.

### Phase 4 - Migrate video runtime

- [ ] Create YouTube runtime adapter under `src/features/podcast/runtime/`
- [ ] Load iframe API exactly once
- [ ] Create player instance through a dedicated hook or adapter
- [ ] Feed player ready / playing / paused / ended / current time into atoms
- [ ] Replace `postMessage` orchestration with runtime-backed seek / play commands
- [ ] Ensure cleanup on unmount and route transitions

Goal: isolate YouTube behavior behind one typed integration layer.

### Phase 5 - Migrate chapters UI

- [ ] Rebuild chapters as React component reading atom state
- [ ] Wire chapter click to atom-backed seek command
- [ ] Add active chapter visual state derived from playback time
- [ ] Keep current slim design or revise separately after architecture stabilizes

Goal: make chapters a pure projection of canonical player state.

### Phase 6 - Migrate transcript UI

- [ ] Rebuild transcript as React component reading transcript cue list + active cue atom
- [ ] Wire cue click to atom-backed seek command
- [ ] Implement follow-scroll effect based on active cue changes only
- [ ] Add user-scroll suppression model for transcript follow
- [ ] Remove imperative transcript DOM queries from Astro script

Goal: make transcript highlighting and follow behavior predictable and extensible.

### Phase 7 - Expand / collapse and layout polish

- [ ] Move expand / collapse state into atom-backed UI control
- [ ] Ensure layout changes do not stretch controls or create grid bugs
- [ ] Keep mobile and desktop layout parity with current page
- [ ] Validate transcript / chapter behavior in expanded and collapsed layouts

Goal: unify layout state with the rest of the player domain.

### Phase 8 - Remove old imperative implementation

- [ ] Delete custom element registration from `PodcastEpisodeLayout.astro`
- [ ] Delete no-longer-needed imperative code from `PodcastVideo.astro`, `PodcastChapters.astro`, and `PodcastTranscript.astro`
- [ ] Remove temporary compatibility props / data attributes no longer needed
- [ ] Keep file boundaries clean; do not leave a half-Astro half-React hybrid runtime behind

Goal: one interaction architecture, not two.

## Effect Atom specifics

Because this project already uses Effect Atom elsewhere, the podcast player implementation should follow the same principles used by visual-effect runtime code:

- atoms should be typed and feature-local
- derived state should remain declarative
- browser-side imperative APIs should bridge into atom writes, not bypass them
- React components should read atoms with `@effect/atom-react`

Recommended follow-up design if complexity grows further:

- scope atoms per episode island instance
- keep player runtime and transcript runtime feature-local
- avoid turning podcast player atoms into app-global media atoms until a second real consumer exists

## Accessibility requirements

- Chapters and transcript lines must remain semantic `button` controls when clickable
- Active transcript cue must be visually clear without relying only on color
- Focus-visible treatment must remain obvious on chapter and transcript controls
- Expand / collapse control must keep correct `aria-expanded`
- Transcript auto-follow must not trap keyboard users or fight user scroll input
- Reduced-motion users should not get aggressive smooth-scroll behavior

## Performance requirements

- Do not update transcript scroll on every polling tick
- Recompute active cue / active chapter cheaply from current time
- Keep React rerenders constrained to components that depend on changing atoms
- If transcript size becomes large enough, evaluate virtualization later, but do not introduce it preemptively
- Avoid duplicate YouTube API loads per page instance

## Validation requirements

Implementation should be validated in five ways.

First, architecture validation should confirm Astro owns only static concerns and React owns all interactive player concerns.

Second, behavior validation should confirm chapters, transcript, highlighting, and expand state remain synchronized through normal playback and seeking.

Third, lifecycle validation should confirm YouTube player creation, teardown, and polling do not leak across navigations or hot reload.

Fourth, accessibility validation should confirm keyboard interaction, focus treatment, and reduced-motion behavior remain sound.

Fifth, responsive validation should confirm desktop and mobile layouts remain usable and stable in both collapsed and expanded states.

## Testing strategy

### Unit-level checks

- transcript timestamp normalization
- chapter timestamp normalization
- active cue selector
- active chapter selector
- transcript follow suppression selector logic

### Integration checks

- clicking chapter seeks player
- clicking transcript cue seeks player
- active cue updates when current time changes
- active chapter updates when current time changes
- transcript auto-follow runs only when active cue changes and follow mode allows it
- expand / collapse state updates layout without stretching controls

### Manual verification

- `pnpm check`
- `pnpm lint`
- `pnpm build`
- browser verification on at least one podcast page with transcript + chapters
- verify YouTube API readiness and playback sync in dev mode

## Acceptance criteria

This refactor is complete when all are true:

1. Podcast episode routing and content loading remain Astro-based.
2. The interactive player surface is rendered from a React island.
3. Player interaction state is modeled with Effect Atom, not custom-element DOM orchestration.
4. Chapters, transcript, and playback time stay synchronized through one canonical state model.
5. Transcript highlighting and follow-scroll behavior work without imperative Astro script glue.
6. Expand / collapse behavior is controlled by the new client state model and no longer causes layout stretching bugs.
7. The old imperative custom-element player wiring is removed.

## Fresh-session checklist

1. Extract transcript normalization helpers from Astro component.
2. Define player payload types and atom graph.
3. Add `PodcastEpisodePlayer.tsx` island and mount it from Astro.
4. Move YouTube lifecycle into runtime adapter.
5. Rebuild chapters and transcript UI against atoms.
6. Delete old custom-element orchestration.
7. Run `pnpm check`, `pnpm lint`, `pnpm build`, then verify in browser.

## Unresolved questions

None.
