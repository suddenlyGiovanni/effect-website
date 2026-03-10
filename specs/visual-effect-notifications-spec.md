# Visual Effect Notifications Specification

## 1. Intent

This specification defines how `website-v4` should finish support for visualizing runtime notifications in the landing-page visualizer.

A notification is a short, transient, non-terminal piece of runtime feedback associated with a running step. Notifications are not results, not failures, and not defects. They are lightweight signals such as "sleeping", "retrying soon", "new message", or any domain event emitted during execution.

The goal is to restore the old website's notification experience while fitting the new architecture:

- `defineExample(...)` remains the authoring entry point.
- `VisualEffectManager` remains the only execution authority.
- Step and example atoms remain the runtime source of truth.
- React stays responsible for presentation-only timing such as bubble enter and exit animation.
- Notification sound support aligns with `specs/visual-effect-sound-integration-spec.md` without coupling UI code to audio code.

## 2. Background

### 2.1 Old website behavior

The old site already proved the desired UX.

Relevant files:

- `.repos/landing/src/VisualEffect.ts`
- `.repos/landing/src/components/effect/EffectNode.tsx`
- `.repos/landing/src/components/feedback/NotificationBubble.tsx`

Legacy behavior:

- A running effect could show a small floating bubble above the node.
- Only one notification per effect was visible at once.
- A new notification replaced the previous one immediately.
- Default duration was `2000ms`.
- Notifications auto-dismissed.
- Notifications were hidden while failure or defect bubbles were shown.
- Raising a notification also played a gentle chime.

### 2.2 Current `website-v4` state

`website-v4` already has partial runtime support:

- `src/lib/examples/domain.ts:21` stores `notification: Option.Option<string>` on `VisualEffectState.Running`.
- `src/services/VisualEffectManager.ts:196` can set a step notification.
- `src/services/VisualEffectManager.ts:295` maps `span.event(name, ...)` to a notification.
- `src/services/VisualEffectManager.ts:321` marks `Effect.sleep(...)` with `"😴"`.

What is missing:

- No notification object model.
- No bubble UI.
- No React lifecycle for transient display.
- No example or step notification hooks.
- No current sound cue for notifications in runtime.
- No notification-focused authoring guidance.

## 3. Scope

### 3.1 In scope

This work includes:

- A first-class notification domain model.
- Runtime support for raising notifications from traced execution.
- Step-node UI for rendering notification bubbles.
- Bubble replacement semantics.
- Auto-dismiss behavior.
- Notification-specific tests.
- Alignment with the existing sound spec's `NotificationRaised` event and `Notification` cue.

### 3.2 Out of scope

This first version does not include:

- Queued or stacked notifications.
- Example-level global notification history.
- Persisting notifications after a step stops running.
- Rich notification layouts with buttons or interactions.
- Cross-node notification aggregation.
- Notification authoring APIs unrelated to traced step execution.

## 4. Design Principles

1. A notification belongs to one running node.
2. One node shows at most one visible notification at a time.
3. New notifications replace older notifications immediately.
4. Runtime owns semantic notification state.
5. React owns transient presentation timing and animation.
6. Failure and defect UI take precedence over notification UI.
7. Identical messages must still be able to retrigger if they are separate runtime events.
8. Sound is driven by semantic runtime events, not by React component mount effects.

## 5. Proposed Domain Model

The current `Option<string>` is too weak. It cannot represent identity.

Replace it with a richer value embedded in `VisualEffectState.Running`.

```ts
import * as Data from "effect/Data"
import * as DateTime from "effect/DateTime"
import * as Duration from "effect/Duration"
import * as Option from "effect/Option"

export interface VisualEffectNotification {
  readonly id: string
  readonly message: string
}

export type VisualEffectState = Data.TaggedEnum<{
  readonly Idle: {}
  readonly Running: {
    readonly startedAt: DateTime.Utc
    readonly notification: Option.Option<VisualEffectNotification>
  }
  readonly Succeeded: {
    readonly value: RenderableResult
    readonly endedAt: DateTime.Utc
    readonly duration: Duration.Duration
  }
  readonly Failed: {
    readonly error: RenderableResult
    readonly endedAt: DateTime.Utc
    readonly duration: Duration.Duration
  }
  readonly Interrupted: {
    readonly endedAt: DateTime.Utc
    readonly duration: Duration.Duration
  }
  readonly Died: {
    readonly defect: RenderableResult
    readonly endedAt: DateTime.Utc
    readonly duration: Duration.Duration
  }
}>
```

### 5.1 Why embed in `Running`

Embedding the current notification inside `Running` preserves the existing state machine shape and avoids inventing a second store.

This keeps the model simple:

- if a step is not running, it has no semantic notification,
- if a step is running, it may have one current notification,
- a newer runtime notification replaces the previous one.

### 5.2 Why `id` is required

A notification needs identity even if the message text repeats.

Without an `id`, this sequence cannot retrigger correctly:

```ts
yield* Effect.sleep("500 millis") // emits "😴"
yield* Effect.sleep("500 millis") // must emit a fresh "😴", not be ignored
```

The current `setStepNotification(...)` dedupes by message text. That should be removed.

### 5.3 Why each field is required

The phase-one notification model should stay minimal.

```ts
export interface VisualEffectNotification {
  readonly id: string
  readonly message: string
}
```

#### `id`

`id` is required for correctness.

It solves three concrete problems:

1. Two different runtime notifications may have the same message text.
2. React animation and timeout logic needs stable identity for replacement.
3. A stale timeout must only hide the notification instance that created it.

Without `id`, this sequence is ambiguous:

```ts
yield* Effect.sleep("500 millis")
yield* Effect.sleep("500 millis")
```

Both notifications may render as `"😴"`, but they are not the same notification instance.

#### `message`

`message` is required because it is the actual user-facing payload.

Without `message`, the notification system would have no content to render and no meaningful data to forward through `NotificationRaised`.

This is the smallest possible visible notification:

```ts
{
  id: "01JQ...",
  message: "retrying"
}
```

### 5.4 Fields intentionally excluded from phase one

The following fields are useful later, but not required to ship the first version.

#### `raisedAt`

Not required for phase one.

Why it is not needed yet:

- replacement order is already defined by the latest state write,
- UI timeout can start when React receives the notification,
- sound should fire from the runtime event, not by comparing timestamps.

`raisedAt` becomes useful only if we later need persistent history, analytics, or cross-client ordering.

#### `duration`

Not required for phase one.

Why it is not needed yet:

- the old site already had a sensible default lifetime,
- a single constant such as `2000ms` is enough for an initial implementation,
- keeping timeout policy in one place makes the first rollout easier to reason about.

If we later add author-controlled notifications or want sleep bubbles to stay visible for the full sleep duration, `duration` can be added then.

#### `icon`

Not required for phase one.

Why it is not needed yet:

- emoji can live directly in `message`,
- current runtime already uses `"😴"` as a complete notification payload,
- a separate icon field adds rendering rules without adding essential capability.

If we later want richer visual styling such as `"sleeping"` plus a separate emoji or icon component, `icon` can be added then.

## 6. Runtime Behavior

### 6.1 Notification raise helper

`src/services/VisualEffectManager.ts` should centralize notification creation in one helper.

```ts
const makeNotification = (message: string): VisualEffectNotification => ({
  id: crypto.randomUUID(),
  message,
})

const raiseStepNotification = (
  details: ExampleStep["Service"],
  message: string,
): void => {
  const atom = stepStateAtom(details.step)
  const previous = registry.get(atom)

  if (previous._tag !== "Running") {
    return
  }

  const notification = makeNotification(message)

  registry.set(
    atom,
    VisualEffectState.Running({
      startedAt: previous.startedAt,
      notification: Option.some(notification),
    }),
  )

  runSync(
    publishNotificationRaised(details.definition, details.step, notification).pipe(
      Effect.catchAllCause(() => Effect.void),
    ),
  )
}
```

`runSyncBestEffort(...)` was shorthand in the earlier draft, not an existing API. The real point is simpler: publish the event in a way that cannot break the visualizer if event publication fails.

### 6.2 Notification sources

Phase one should support these sources:

#### Tracer span events

Current code already maps `span.event(name, ...)` to a notification. Keep that, but raise a full object.

```ts
event(name, startTime, attributes) {
  span.event(name, startTime, attributes)
  raiseStepNotification(details, name)
}
```

#### Wrapped `Clock.sleep(...)`

Current code already uses `"😴"` when a running step sleeps.

```ts
sleep(duration) {
  return Effect.withFiber((fiber) => {
    const span = fiber.currentSpan
    const effect = clock.sleep(duration)

    if (!span || span._tag !== "Span") {
      return effect
    }

    const details = ServiceMap.getOrUndefined(span.annotations, ExampleStep)
    if (!details) {
      return effect
    }

    void duration
    raiseStepNotification(details, "😴")

    return effect
  })
}
```

The exact message text may differ. The important part is that sleep produces a fresh notification instance while the step is running.

#### Future helper APIs

Phase one does not require a new public `notify(...)` Effect helper, but the model should not block one later.

A future API could look like this:

```ts
export const notify = (input: {
  readonly message: string
}): Effect.Effect<void>
```

That is a follow-up, not a requirement for this spec.

### 6.3 Terminal transitions

When a step leaves `Running`, its notification disappears semantically because terminal states do not carry notifications.

No special cleanup state is needed in atoms.

This happens automatically when:

- `Running -> Succeeded`
- `Running -> Failed`
- `Running -> Interrupted`
- `Running -> Died`

### 6.4 Reset behavior

Reset should clear notifications because reset returns steps to `Idle`.

This already follows naturally if reset writes `Idle` to step atoms.

The UI must also cancel any local auto-dismiss timers when reset happens.

## 7. UI Behavior

### 7.1 Bubble location

Notifications render above the step node, centered horizontally, outside the node container.

The visual placement should match the old site closely:

- absolute positioning,
- centered above the node,
- high z-index,
- pointer events disabled.

```tsx
<div className="pointer-events-none absolute bottom-full left-1/2 z-20 -translate-x-1/2">
  <VisualEffectNotificationBubble notification={notification} />
</div>
```

### 7.2 Bubble visibility rules

A bubble is visible only when all of these are true:

- step state is `Running`,
- `state.notification` is `Some`,
- the bubble's local presentational timer has not expired,
- the step is not currently showing failure or defect UI.

If the step has terminal error UI, notification UI must not render.

```tsx
const isErrorState = state._tag === "Failed" || state._tag === "Died"
const notification =
  state._tag === "Running" && Option.isSome(state.notification)
    ? state.notification.value
    : undefined

const showNotification = !isErrorState && notification !== undefined && isVisible
```

### 7.3 Local presentation lifecycle

React should control transient display timing, but must not write timeout-driven dismissals back into atoms.

That means:

- runtime raises semantic notification object,
- UI shows it,
- UI starts a timer from `notification.id`,
- timer only hides the rendered bubble,
- atom state remains unchanged until runtime state changes again.

This avoids UI timers mutating semantic runtime state.

#### Recommended hook

```tsx
function useVisibleNotification(
  state: VisualEffectState,
): VisualEffectNotification | undefined {
  const [visible, setVisible] = React.useState<VisualEffectNotification | undefined>(undefined)
  const NOTIFICATION_DISPLAY_MS = 2000

  React.useEffect(() => {
    if (state._tag !== "Running" || Option.isNone(state.notification)) {
      setVisible(undefined)
      return
    }

    const current = state.notification.value
    setVisible(current)

    const timeout = window.setTimeout(() => {
      setVisible((previous) => (previous?.id === current.id ? undefined : previous))
    }, NOTIFICATION_DISPLAY_MS)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [state])

  return visible
}
```

#### Important rule

Use `notification.id`, not `message`, as the replacement key.

This supports repeated same-message notifications.

### 7.4 Animation

The old site's motion language is still the right target:

- enter: blur + scale + slight vertical offset,
- idle loop: soft float,
- exit: reverse of enter.

Suggested motion shape:

```tsx
<AnimatePresence initial={false}>
  {notification && (
    <motion.div
      key={notification.id}
      initial={{ opacity: 0, scale: 0.85, y: 12, filter: "blur(8px)" }}
      animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.85, y: 12, filter: "blur(8px)" }}
      transition={{
        type: "spring",
        bounce: 0.12,
        visualDuration: 0.28,
      }}
    >
      ...
    </motion.div>
  )}
</AnimatePresence>
```

And a subtle float loop:

```tsx
<motion.div
  animate={{ y: [0, -6, 0] }}
  transition={{
    duration: 1.6,
    repeat: Infinity,
    ease: "easeInOut",
  }}
>
  ...
</motion.div>
```

### 7.5 Visual styling

The old bubble used a bright blue badge. `website-v4` should preserve that feel while matching the new card system.

Recommended phase-one style:

- blue surface,
- white text,
- rounded corners,
- small pointer triangle,
- compact width,
- strong but tasteful glow.

Example:

```tsx
<div className="max-w-[220px] rounded-md bg-sky-500 px-3 py-2 text-sm font-medium text-white shadow-[0_10px_30px_rgba(0,0,0,0.35),0_4px_16px_rgba(14,165,233,0.35)]">
  <span>{notification.message}</span>
</div>
<div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-[7px] border-t-[8px] border-x-transparent border-t-sky-500" />
```

## 8. Component Structure

Recommended additions under `src/components/landing/examples/`:

- `VisualEffectNotificationBubble.tsx`
- possibly `useVisibleNotification.ts` if hook extraction feels cleaner

### `VisualEffectNode.tsx`

`VisualEffectNode.tsx` should render the bubble near the same layer that currently handles overlays and content.

A likely shape:

```tsx
export function VisualEffectNode(...) {
  const notification = useVisibleNotification(state)
  const isErrorState = state._tag === "Failed" || state._tag === "Died"

  return (
    <div onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <motion.div className="relative flex h-14 items-center justify-center">
        <AnimatePresence initial={false}>
          {!isErrorState && notification !== undefined ? (
            <VisualEffectNotificationBubble
              key={notification.id}
              notification={notification}
            />
          ) : null}
        </AnimatePresence>

        <VisualEffectContainer ...>
          <VisualEffectOverlay ... />
          <VisualEffectContent ... />
        </VisualEffectContainer>
      </motion.div>
      <VisualEffectLabel label={label} />
    </div>
  )
}
```

### `VisualEffectContent.tsx` interaction

The running state should still render `null` inside the node body unless a separate design choice is made later. The notification bubble is an external overlay, not node content.

## 9. Sound Integration

This spec should align with `specs/visual-effect-sound-integration-spec.md`.

That spec already proposes:

```ts
type VisualEffectSoundEvent =
  | { readonly _tag: "NotificationRaised"; readonly exampleKey: string; readonly stepId: string; readonly message: string }

type SoundCue =
  | { readonly _tag: "Notification"; readonly exampleKey: string; readonly stepId: string }
```

### 9.1 Required integration rule

`VisualEffectManager` should publish `NotificationRaised` when a notification is raised.

The UI must not call `SoundManager` directly.

```ts
const publishNotificationRaised = (
  example: ExampleDefinition,
  step: StepDefinition,
  notification: VisualEffectNotification,
) =>
  VisualEffectEventBus.use((bus) =>
    bus.publish({
      _tag: "NotificationRaised",
      exampleKey: example.key,
      stepId: step.id,
      message: notification.message,
    }),
  )
```

### 9.2 Cue mapping

The sound mapping layer should convert `NotificationRaised` into a `Notification` cue.

```ts
const toCue = (event: VisualEffectSoundEvent): SoundCue | undefined => {
  switch (event._tag) {
    case "NotificationRaised":
      return {
        _tag: "Notification",
        exampleKey: event.exampleKey,
        stepId: event.stepId,
      }
    default:
      return undefined
  }
}
```

### 9.3 Why runtime, not UI, should emit sound

If sound is triggered from a React mount effect, then sound behavior becomes tied to render timing, visibility rules, and animation restarts.

That would be wrong.

Sound should represent the semantic event:

- a runtime notification happened,
- therefore a notification cue may play.

## 10. Example Authoring Guidance

Authors should be able to produce notifications through normal traced execution.

### 10.1 Span-event-based notification

If an example raises a tracer event inside a step span, the node should show it.

Illustrative example:

```ts
const warmUp = Effect.gen(function* () {
  yield* Effect.annotateCurrentSpan("phase", "warmup")
  yield* Effect.log("warming cache")
  yield* Effect.sleep("300 millis")
  return new PrimitiveResult("ready")
})
```

If the implementation introduces an explicit span event helper later, it may look like:

```ts
const warmUp = Effect.gen(function* () {
  yield* Tracer.emitEvent("cache warmed")
  return new PrimitiveResult("ready")
})
```

The exact author API can evolve. The important behavior is that a step can raise transient notifications while running.

### 10.2 Sleep-driven notification

The existing `Clock.sleep(...)` wrapping should surface a sleep bubble automatically.

```ts
const checkInbox = Effect.gen(function* () {
  yield* Effect.sleep("2 seconds")
  return new PrimitiveResult("new message")
})
```

Expected UI behavior:

- step enters `Running`,
- bubble appears above node with sleep messaging,
- bubble auto-dismisses,
- result lands later.

### 10.3 Repeated notification example

The `repeatSpacedExample` already reads like a notification story and should become the canonical regression example.

`src/lib/examples/catalog/effect-repeat-spaced.tsx`:

```ts
const notifications = [
  "unknown caller",
  "calendar alert",
  "new message",
  "battery warning",
] as const
```

This example is ideal because it exercises:

- repeated step execution,
- schedule waiting,
- repeated notifications,
- final failure after notifications are exhausted.

## 11. Recommended Examples For Manual Verification

### Example A: sleep notification

```ts
const nap = Effect.gen(function* () {
  yield* Effect.sleep("1 second")
  return new PrimitiveResult("awake")
})
```

Expected behavior:

- running node shows sleep bubble,
- bubble fades away,
- success result lands.

### Example B: repeated same message

```ts
const pingTwice = Effect.gen(function* () {
  yield* notify({ message: "ping" })
  yield* Effect.sleep("300 millis")
  yield* notify({ message: "ping" })
  return new PrimitiveResult("done")
})
```

Expected behavior:

- first `"ping"` appears,
- second `"ping"` retriggers fresh bubble animation,
- second event is not deduped away.

### Example C: replacement before timeout

```ts
const multiEvent = Effect.gen(function* () {
  yield* notify({ message: "connecting..." })
  yield* Effect.sleep("250 millis")
  yield* notify({ message: "authorizing..." })
  yield* Effect.sleep("250 millis")
  yield* notify({ message: "ready" })
  return new PrimitiveResult("ok")
})
```

Expected behavior:

- each new event replaces the previous bubble,
- only one bubble is visible at a time,
- stale timers do not hide the newest bubble.

### Example D: terminal error wins

```ts
const crashAfterNotice = Effect.gen(function* () {
  yield* notify({ message: "last words" })
  return yield* Effect.fail(new ErrorResult("boom"))
})
```

Expected behavior:

- notification may appear briefly,
- failure state takes precedence,
- failure bubble replaces notification UI.

## 12. Testing Strategy

There are no current tests in this area. Add focused tests around runtime semantics and React behavior.

### 12.1 Runtime tests

Target file shape:

- `src/services/VisualEffectManager.test.ts`

Critical cases:

- raising a notification on a running step stores a `Some(notification)`,
- raising a second notification replaces the first,
- repeated same message still creates a new `id`,
- raising a notification when step is not `Running` is ignored,
- terminal transition removes semantic notification by leaving `Running`,
- sleep wrapping raises a sleep notification for traced step spans only.

Example assertion shape:

```ts
expect(state._tag).toBe("Running")
if (state._tag === "Running" && Option.isSome(state.notification)) {
  expect(state.notification.value.message).toBe("sleeping")
}
```

### 12.2 React component tests

Target file shape:

- `src/components/landing/examples/VisualEffectNotificationBubble.test.tsx`
- or `src/components/landing/examples/VisualEffectNode.test.tsx`

Critical cases:

- bubble renders when running notification exists,
- bubble hides after timeout,
- replacing notification cancels old timer,
- identical message with new `id` retriggers animation path,
- `Failed` and `Died` hide notification UI,
- reset clears visible bubble without timer leaks.

### 12.3 Sound integration tests

If the event bus lands first, add mapping tests:

- `NotificationRaised` maps to `Notification`,
- duplicate events are deduped only by cue rules, not by message text,
- event publication failure does not break state updates.

## 13. Implementation Plan

1. Replace `Option<string>` with `Option<VisualEffectNotification>` in `src/lib/examples/domain.ts`.
2. Add notification construction and raise helpers in `src/services/VisualEffectManager.ts`.
3. Remove message-based dedupe from `setStepNotification(...)`.
4. Publish `NotificationRaised` from the runtime helper if the event bus exists.
5. Add `Notification` cue to `src/lib/examples/sound.ts` if not already added by sound work.
6. Add `VisualEffectNotificationBubble.tsx`.
7. Add a local visibility hook keyed by `notification.id`.
8. Render the bubble from `src/components/landing/examples/VisualEffectNode.tsx`.
9. Add tests for runtime replacement, timeout cancellation, repeated same-message notifications, and error-state precedence.
10. Manually verify with `effect-repeat-spaced` and one sleep-focused example.

## 14. Acceptance Criteria

This feature is complete when all of the following are true:

- A running step can show a floating notification bubble above its node.
- Bubble content comes from runtime state, not component-local author data.
- Only one notification per node is visible at once.
- A newer notification replaces the older notification immediately.
- Repeated identical messages still retrigger correctly.
- Notifications auto-dismiss visually after the shared phase-one timeout.
- Terminal error states suppress notification UI.
- Reset leaves no stale notification bubble on screen.
- Notification sound is triggered semantically through runtime events, not via React mount effects.
- `effect-repeat-spaced` behaves like a notification demo instead of only a schedule demo.

## 15. Unresolved Questions

1. Keep sleep text as `"😴"` only, or switch to a word like `"sleeping"`?
2. Do we want a public `notify(...)` helper now, or only tracer/sleep support in phase one?
3. Should success states ever preserve the last notification for a short exit animation, or hide immediately on terminal transition?
