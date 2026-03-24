# Podcast Chapter Playback + Effect Atom Plan

## Intent

This plan covers the narrow integration gap between the existing React podcast episode surface and the existing Effect Atom-backed YouTube embed runtime.

Primary goal: make chapter controls in `src/features/podcast/components/PodcastChapters.tsx` drive real YouTube playback and stay synchronized with player time, without introducing a second ad-hoc state model.

Secondary goal: establish the same wiring pattern so transcript controls can plug into it next.

## Current setup review

### Episode composition

`src/features/podcast/components/PodcastEpisode.tsx` already renders the right pieces in one React tree:

- `YouTubeEmbed`
- `PodcastChapters`
- `PodcastTranscript`

That is good news. The parent boundary does not need a route-level refactor first.

### What already exists in the YouTube feature

The YouTube embed runtime is already Effect Atom-backed:

- `src/features/youtube/atoms/state.ts` stores iframe element, connection phase, load state, and `playerSnapshot`
- `src/features/youtube/atoms/controls.ts` exposes command atoms for `connect`, `disconnect`, `play`, and `pause`
- `src/features/youtube/runtime/YouTubeEmbedManager.ts` owns the iframe `postMessage` handshake and writes player state back into atoms
- `src/features/youtube/components/YouTubeEmbed.tsx` mounts the iframe and connects the runtime when `enableJSApi` is on

This means the hard part already exists: there is a typed external-runtime bridge and a canonical player snapshot atom.

### What is missing in podcast today

`src/features/podcast/components/PodcastChapters.tsx` is still local-only UI:

- it tracks `activeChapter` with `React.useState`
- click only updates local highlight
- it does not call player commands
- active state is not derived from playback time

`src/features/podcast/components/PodcastTranscript.tsx` has the same shape:

- it tracks `activeIndex` locally
- click only updates local highlight
- it is not connected to player time

### Main integration blocker

`YouTubeEmbed.tsx` generates its own private `connectionId` with `useId()` and keeps that identifier internal.

That makes the current YouTube atoms impossible to control from sibling podcast components, because `PodcastChapters` has no stable way to address:

- `playerSnapshotAtom(connectionId)`
- `playAtom(connectionId)`
- future `seekToAtom(connectionId)`

This is the key architectural issue to solve first.

### Capability gaps in the current YouTube runtime

For chapter linking, current runtime support is close but incomplete:

- `play` exists
- `pause` exists
- `currentTime` is already observed via `playerSnapshotAtom`
- `seekTo` does not exist yet
- there is no podcast-facing atom family or adapter that packages YouTube state into episode-level player state

## Architecture decision

Do not add chapter state directly inside `PodcastChapters.tsx`.

Do not duplicate playback state into a second podcast-local mutable store.

Instead:

1. keep YouTube runtime as the low-level external-system adapter
2. expose a stable player connection identity to the podcast feature
3. add podcast-scoped atoms that derive chapter state from the canonical YouTube snapshot
4. wire chapter clicks through command atoms, not local React state

In short: YouTube atoms stay source-of-truth for raw player lifecycle; podcast atoms become a thin domain layer over them.

## Recommended target shape

### 1. Introduce a shared episode player id

Add an explicit `playerId` owned by `PodcastEpisode.tsx` and passed into both the embed and the playback-aware sidebar components.

Recommended change:

- extend `YouTubeEmbed` with optional `connectionId?: string`
- if provided, use it instead of internal `useId()` generation
- in `PodcastEpisode.tsx`, create one stable id per island instance and pass it to:
  - `YouTubeEmbed`
  - `PodcastChapters`
  - `PodcastTranscript`

Why this shape:

- smallest change to current architecture
- keeps YouTube feature reusable outside podcast
- avoids context-only hidden coupling
- gives sibling components a stable address into existing atom families

Alternative: a React context that stores the generated `connectionId`.

Not preferred as first step. It hides the real dependency and still does not solve missing command atoms.

### 2. Add missing YouTube command support

Extend `src/features/youtube/runtime/YouTubeEmbedManager.ts` and `src/features/youtube/atoms/controls.ts` with:

- `seekTo(connectionId, seconds)`
- optionally `playFrom(connectionId, seconds)` if product wants click-to-seek-and-play as one semantic action

Recommended API:

```ts
export interface SeekToInput {
  readonly connectionId: string
  readonly seconds: number
}
```

Implementation notes:

- send YouTube `seekTo` command via the same `postMessage` channel already used for `playVideo` / `pauseVideo`
- clamp negative time to `0`
- optimistically update snapshot `currentTime` after command send, or leave runtime event to confirm; pick one policy and use it consistently
- if autoplay after seek matters, either send `seekTo` then `playVideo`, or encode separate commands instead of overloading one atom ambiguously

Recommendation: keep `seekTo` and `play` separate atoms, then add one podcast-facing command atom for “jump to chapter and play”.

### 3. Add podcast player atoms as a thin integration layer

Create a feature-local file, recommended:

- `src/features/podcast/atoms/player.ts`

Add atoms/selectors that depend on `playerId` plus normalized chapter data.

Recommended responsibilities:

- `activeChapterAtom(playerId, chapters)` derived from `playerSnapshotAtom(playerId).currentTime`
- `canControlPlaybackAtom(playerId)` derived from connection phase/status
- `jumpToChapterAtom({ playerId, chapterStartSeconds })`
- later: `activeTranscriptCueAtom`

Important rule: `activeChapter` should be derived from time, not stored mutably.

Recommended derivation:

- choose the last chapter where `chapter.startSeconds <= currentTime`
- if time is before first chapter, first chapter is active

### 4. Normalize chapter data before control wiring

Current chapter model only exposes string timestamps:

```ts
{
  start: string
  title: string
}
```

That is insufficient for player control code.

Add normalized chapter view data with stable numeric time:

```ts
export interface PodcastChapterView {
  readonly id: string
  readonly title: string
  readonly startLabel: string
  readonly startSeconds: number
}
```

Recommended location:

- `src/features/podcast/lib/chapters.ts` for parsing/normalization helpers
- or `src/features/podcast/model/chapters.ts` if keeping pure domain types there

Server-side normalization is preferred because:

- timestamp parsing runs once
- client code stays simpler
- chapter buttons can stay purely view-driven

### 5. Rework `PodcastChapters.tsx` into a controlled playback view

Replace local `useState` in `src/features/podcast/components/PodcastChapters.tsx` with atom reads/writes.

Recommended props:

```ts
interface PodcastChaptersProps {
  readonly playerId: string
  readonly chapters: ReadonlyArray<PodcastChapterView>
}
```

Component behavior:

- read active chapter from derived atom
- render active styling from derived chapter id
- on click, call podcast command atom to seek to chapter
- optionally call play after seek if paused / ready
- keep UI fully controlled by atoms

This removes the current fake active state and guarantees highlight follows real playback.

### 6. Reuse same player bridge for transcript next

Do not solve chapters in a way transcript cannot reuse.

Once `playerId` and `seekTo` exist, transcript can follow the same pattern:

- derived active cue from `currentTime`
- click cue -> seek command
- no local `activeIndex`

That is why the integration layer should live in feature atoms, not in chapter component internals.

## Detailed implementation phases

### Phase 1 - Expose a stable player identity

- [ ] Update `YouTubeEmbed` to accept optional external `connectionId`
- [ ] Keep current auto-generated fallback for non-podcast callers
- [ ] In `PodcastEpisode.tsx`, create a stable `playerId`
- [ ] Pass `playerId` into `YouTubeEmbed`, `PodcastChapters`, and `PodcastTranscript`

Done when sibling components can address the same YouTube atom families as the embed.

### Phase 2 - Add seek support to the YouTube runtime

- [ ] Extend `ConnectionEntry` with `sendSeekTo`
- [ ] Add low-level message helper for `seekTo`
- [ ] Add `seekTo` method on `YouTubeEmbedManager`
- [ ] Export `seekToAtom` from `src/features/youtube/atoms/controls.ts`
- [ ] Decide command semantics for seek-only vs seek-and-play

Done when any component can seek the playing iframe by `connectionId`.

### Phase 3 - Normalize podcast chapter data

- [ ] Add timestamp parser for chapter `start`
- [ ] Produce `startSeconds`
- [ ] Produce stable `id`
- [ ] Update `PodcastEpisode` input flow to pass normalized chapters into chapter UI

Done when `PodcastChapters` no longer parses or reasons about raw timestamp strings.

### Phase 4 - Add podcast integration atoms

- [ ] Create `src/features/podcast/atoms/player.ts`
- [ ] Add selector for current player snapshot by `playerId`
- [ ] Add `activeChapterAtom`
- [ ] Add `jumpToChapterAtom`
- [ ] Add optional readiness selector to disable controls before connection

Done when chapter behavior can be implemented without local component state.

### Phase 5 - Convert chapter UI to real playback control

- [ ] Remove `activeChapter` local state from `PodcastChapters.tsx`
- [ ] Read active chapter from atom
- [ ] Fire seek command on click
- [ ] Preserve current visual design and accessibility labels
- [ ] Decide whether chapter click should also force play

Recommended default: chapter click should seek and play. That matches user expectation for chapter navigation in media UIs.

Done when chapter highlight tracks actual playback time and chapter click changes the video position.

### Phase 6 - Use the same bridge for transcript

- [ ] Add transcript normalization with numeric start/end seconds if not already present
- [ ] Add derived active cue selector from current time
- [ ] Replace `activeIndex` local state in `PodcastTranscript.tsx`
- [ ] Wire cue click to `seekTo`
- [ ] Later add follow-scroll rules on active cue change only

Done when transcript and chapters use the same player state graph.

## State model rules

These rules should hold after the work:

1. `playerSnapshotAtom(playerId)` remains canonical playback time source.
2. Active chapter is derived, never manually stored.
3. Chapter clicks dispatch commands; they do not set visual state directly.
4. Podcast feature may add derived atoms, but should not mirror YouTube runtime state unnecessarily.
5. Raw iframe `postMessage` remains isolated inside `src/features/youtube/runtime/YouTubeEmbedManager.ts`.

## Suggested file changes

### Update

- `src/features/podcast/components/PodcastEpisode.tsx`
- `src/features/podcast/components/PodcastChapters.tsx`
- `src/features/podcast/components/PodcastTranscript.tsx`
- `src/features/youtube/components/YouTubeEmbed.tsx`
- `src/features/youtube/atoms/controls.ts`
- `src/features/youtube/runtime/YouTubeEmbedManager.ts`

### Add

- `src/features/podcast/atoms/player.ts`
- `src/features/podcast/lib/chapters.ts` or `src/features/podcast/model/chapters.ts`

## Behavior decisions to lock in

### Chapter click semantics

Recommended:

- chapter click seeks immediately
- chapter click starts playback if not already playing

Reason: users usually treat chapter taps as a jump into content, not a passive preselection.

### Active chapter policy

Recommended:

- active chapter is last chapter at or before current playback time
- first chapter is active before first boundary

### Control disabled state

Recommended:

- chapter buttons stay clickable once iframe is mounted and JS API connection is live
- if player is not yet connected, keep buttons enabled visually but no-op only if unavoidable; better is queueing or forcing embed load first

Practical default for first pass:

- if embed is still previewing, chapter click should trigger embed load, then seek once ready

That requires a tiny command queue or deferred intent atom.

## Follow-up improvement: pending chapter intent

There is one product detail worth planning early.

Because `YouTubeEmbed` supports a preview/loading state, a user may click a chapter before the YouTube connection is ready.

Recommended follow-up atom:

- `pendingSeekAtom(playerId)` storing optional target seconds

Behavior:

- if chapter clicked before ready, set pending seek intent
- when connection becomes ready, flush seek intent and optionally play

This avoids dead clicks and keeps chapter controls feeling responsive even before the iframe handshake completes.

## Validation

### Unit

- chapter timestamp parsing
- active chapter derivation across boundary times
- pending seek behavior if added

### Integration

- chapter click seeks current video
- chapter click starts playback if policy says so
- active chapter changes while video plays
- active chapter updates after manual seek from player controls
- transcript can reuse same `playerId` and command atoms

### Manual

- load one episode page and click several chapters out of order
- confirm chapter highlight tracks playback while video runs
- confirm chapter click works before and after player is fully connected
- confirm mobile and desktop duplicated chapter UIs both stay in sync if both are mounted

## Risks

### Duplicate chapter mounts

`PodcastEpisode.tsx` renders `PodcastChapters` twice: once for mobile and once for desktop.

That means both instances must read the same atom state and must not own local playback state. Moving to derived atom state fixes this naturally.

### Optimistic vs confirmed seek time

If `seekTo` updates UI optimistically before YouTube confirms new `currentTime`, highlight may jump instantly.

That is usually acceptable, but choose one policy deliberately.

### Preview-state clicks

If preview mode remains, chapter clicks before full connection need deferred intent handling or they will feel broken.

## Acceptance criteria

This plan is complete when all are true:

1. `PodcastChapters` no longer uses local active state.
2. Chapter clicks control the actual YouTube embed.
3. Active chapter highlight is derived from canonical playback time.
4. The same player wiring can be reused by `PodcastTranscript`.
5. All playback commands still flow through the existing Effect Atom + YouTube runtime boundary.

## Recommended order

1. expose `connectionId`
2. add `seekTo`
3. normalize chapters
4. add podcast integration atoms
5. convert `PodcastChapters`
6. convert `PodcastTranscript`

## Unresolved questions

- Should chapter click always autoplay after seek?
- Queue pre-ready chapter clicks, or force player load first?
