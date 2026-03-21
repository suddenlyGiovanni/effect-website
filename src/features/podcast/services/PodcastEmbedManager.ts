import * as Array from "effect/Array"
import * as Duration from "effect/Duration"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Queue from "effect/Queue"
import * as RcRef from "effect/RcRef"
import * as Schedule from "effect/Schedule"
import * as Schema from "effect/Schema"
import * as SchemaGetter from "effect/SchemaGetter"
import * as SchemaTransformation from "effect/SchemaTransformation"
import * as ServiceMap from "effect/ServiceMap"
import * as Atom from "effect/unstable/reactivity/Atom"
import * as AtomRegistry from "effect/unstable/reactivity/AtomRegistry"
import type { PodcastEpisode } from "../domain"

const IFRAME_ALLOW = "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
const IFRAME_REFERRER_POLICY = "strict-origin-when-cross-origin"
export const YOUTUBE_NOCOOKIE_URL = "https://www.youtube-nocookie.com"

export class PodcastEmbedManager extends ServiceMap.Service<
  PodcastEmbedManager,
  {
    readonly debugAtom: Atom.Atom<ReadonlyArray<string>>
    readonly stateAtom: Atom.Atom<EmbedState>
    readonly connect: Atom.AtomResultFn<HTMLElement, void, never>
    readonly play: Atom.AtomResultFn<void, void, never>
    readonly pause: Atom.AtomResultFn<void, void, never>
    readonly seekTo: Atom.AtomResultFn<number, void, never>
  }
>()("PodcastEmbedManager", {
  make: Effect.fnUntraced(function* (episode: PodcastEpisode) {
    const queue = yield* Queue.unbounded<EmbedCommand>()
    const debugAtom = Atom.make<ReadonlyArray<string>>([])
    const stateAtom = Atom.make<EmbedState>(makeInitialEmbedState())
    const atomRegistry = yield* AtomRegistry.AtomRegistry

    const services = yield* Effect.services()
    const runFork = Effect.runForkWith(services)
    const decodeEvent = Schema.decodeUnknownEffect(Schema.fromJsonString(YouTubeEvent))
    const encodeCommand = Schema.encodeUnknownEffect(Schema.fromJsonString(EmbedCommand))

    const getIframeSrc = (episode: PodcastEpisode): string => {
      const videoId = globalThis.encodeURIComponent(episode.youtube.id)
      const url = new URL(`/embed/${videoId}`, YOUTUBE_NOCOOKIE_URL)
      url.searchParams.set("autoplay", "1")
      url.searchParams.set("enablejsapi", "1")
      return url.toString()
    }

    const ref = yield* RcRef.make({
      acquire: Effect.gen(function* () {
        const iframe = document.createElement("iframe")

        const sendListeningRequest = () => {
          const message = JSON.stringify({ event: "listening", id: 1 })
          iframe.contentWindow?.postMessage(message, YOUTUBE_NOCOOKIE_URL)
        }

        let connected = false

        const attemptHandshake = Effect.repeat(Effect.sync(sendListeningRequest), {
          times: 5,
          schedule: Schedule.exponential("200 millis"),
          while: () => Effect.succeed(connected),
        })

        const handleMessage = (event: MessageEvent): void => {
          runFork(
            Effect.ignore({ log: "Error" })(
              Effect.gen(function* () {
                if (event.origin !== YOUTUBE_NOCOOKIE_URL) return
                if (event.source !== iframe.contentWindow) return

                atomRegistry.update(debugAtom, Array.append(event.data))

                // After validating that an event originates from our iframe,
                // mark connection as established
                if (!connected) {
                  connected = true
                }

                const data = yield* decodeEvent(event.data)
                atomRegistry.update(stateAtom, (state) => reduceEmbedState(state, data))
              }),
            ),
          )
        }

        const handleLoad = () => {
          atomRegistry.update(stateAtom, beginHandshake)
          runFork(attemptHandshake)
        }

        window.addEventListener("message", handleMessage)
        iframe.addEventListener("load", handleLoad)

        // Attach the iframe `src` _after_ attaching the `"load"` event listener
        iframe.src = getIframeSrc(episode)
        iframe.allow = IFRAME_ALLOW
        iframe.allowFullscreen = true
        iframe.title = episode.title
        iframe.referrerPolicy = IFRAME_REFERRER_POLICY

        yield* Effect.addFinalizer(() =>
          Effect.sync(() => {
            window.removeEventListener("message", handleMessage)
            iframe.removeEventListener("load", handleLoad)
          }),
        )

        return iframe
      }),
      idleTimeToLive: Duration.infinity,
    })

    yield* Queue.take(queue).pipe(
      Effect.flatMap(
        Effect.fnUntraced(function* (command) {
          const iframe = yield* RcRef.get(ref)
          const message = yield* encodeCommand(command)
          iframe.contentWindow?.postMessage(message, YOUTUBE_NOCOOKIE_URL)
        }, Effect.scoped),
      ),
      Effect.forever,
      Effect.forkScoped,
    )

    const connect = Effect.fn("EmbedManager.connect")(function* (element: HTMLElement) {
      const iframe = yield* RcRef.get(ref)
      element.appendChild(iframe)
      atomRegistry.update(stateAtom, markMounted)
    })

    const offerCommand = Effect.fn("EmbedManager.offerCommand")(function* (
      command: EmbedCommand,
      updateState: (state: EmbedState) => EmbedState,
    ) {
      atomRegistry.update(stateAtom, updateState)
      yield* Queue.offer(queue, command)
    })

    return {
      debugAtom,
      stateAtom,
      connect: Atom.fn<HTMLElement>()((element) => connect(element)),
      play: Atom.fn<void>()(() =>
        offerCommand(new PlayVideoCommand(), (state) =>
          setPendingCommand(state, new PlayRequested()),
        ),
      ),
      pause: Atom.fn<void>()(() =>
        offerCommand(new PauseVideoCommand(), (state) =>
          setPendingCommand(state, new PauseRequested()),
        ),
      ),
      seekTo: Atom.fn<number>()((seconds) =>
        offerCommand(new SeekToCommand({ args: [seconds, true] }), (state) =>
          setPendingCommand(state, new SeekRequested({ seconds })),
        ),
      ),
    } as const
  }),
}) {
  static readonly layer = (episode: PodcastEpisode) => Layer.effect(this, this.make(episode))
}

export const embedManagerAtom = Atom.family((episode: PodcastEpisode) => {
  const runtime = Atom.runtime(PodcastEmbedManager.layer(episode))
  return runtime.atom(PodcastEmbedManager.asEffect())
})

export const PlayerStateCode = Schema.Union([
  Schema.Literal(-1),
  Schema.Literal(0),
  Schema.Literal(1),
  Schema.Literal(2),
  Schema.Literal(3),
  Schema.Literal(5),
])
export type PlayerStateCode = typeof PlayerStateCode.Type

const errorCode = <N extends number, C extends string>(n: N, c: C) =>
  Schema.Literal(n).pipe(
    Schema.decodeTo(
      Schema.Literal(c),
      SchemaTransformation.make({
        decode: SchemaGetter.succeed(c),
        encode: SchemaGetter.succeed(n),
      }),
    ),
  )

export const ErrorCode = Schema.Union([
  errorCode(2, "INVALID_PARAM"),
  errorCode(5, "HTML5_ERROR"),
  errorCode(100, "VIDEO_NOT_FOUND"),
  errorCode(101, "NOT_EMBEDDABLE"),
  errorCode(150, "NOT_EMBEDDABLE_DISGUISED"),
  errorCode(153, "REFERRER_NOT_FOUND"),
])
export type ErrorCode = typeof ErrorCode.Type

export const VideoDataPatch = Schema.Struct({
  author: Schema.optional(Schema.String),
  title: Schema.optional(Schema.String),
  video_id: Schema.optional(Schema.String),
})

export const PlayerInfoPatch = Schema.Struct({
  apiInterface: Schema.optional(Schema.Array(Schema.String)),
  availableQualityLevels: Schema.optional(Schema.Array(Schema.String)),
  currentTime: Schema.optional(Schema.Number),
  currentTimeLastUpdated_: Schema.optional(Schema.Number),
  duration: Schema.optional(Schema.Number),
  muted: Schema.optional(Schema.Boolean),
  playbackQuality: Schema.optional(Schema.String),
  playbackRate: Schema.optional(Schema.Number),
  playerState: Schema.optional(PlayerStateCode),
  translationLanguages: Schema.optional(Schema.Array(Schema.String)),
  videoData: Schema.optional(VideoDataPatch),
  videoLoadedFraction: Schema.optional(Schema.NullOr(Schema.Number)),
  videoUrl: Schema.optional(Schema.String),
  volume: Schema.optional(Schema.Number),
})
export type PlayerInfoPatch = typeof PlayerInfoPatch.Type

export const EventEnvelope = {
  channel: Schema.optional(Schema.Literal("widget")),
  id: Schema.optional(Schema.Number),
} as const

export class YouTubeInitialDeliveryEvent extends Schema.Class<YouTubeInitialDeliveryEvent>(
  "YouTubeInitialDeliveryEvent",
)({
  ...EventEnvelope,
  event: Schema.Literal("initialDelivery"),
  info: PlayerInfoPatch,
}) {}

export class YouTubeInfoDeliveryEvent extends Schema.Class<YouTubeInfoDeliveryEvent>(
  "YouTubeInfoDeliveryEvent",
)({
  ...EventEnvelope,
  event: Schema.Literal("infoDelivery"),
  info: PlayerInfoPatch,
}) {}

export const VideoReceiver = Schema.Struct({
  key: Schema.String,
  name: Schema.String,
})
export type VideoReceiver = typeof VideoReceiver.Type

export class YouTubeApiInfoDeliveryEvent extends Schema.Class<YouTubeApiInfoDeliveryEvent>(
  "YouTubeApiInfoDeliveryEvent",
)({
  ...EventEnvelope,
  event: Schema.Literal("apiInfoDelivery"),
  info: Schema.Struct({
    captions: Schema.Struct({
      options: Schema.Array(Schema.String),
      track: Schema.Record(Schema.String, Schema.Unknown),
      tracklist: Schema.Array(Schema.String),
      translationLanguages: Schema.Array(Schema.String),
    }),
    namespaces: Schema.Array(Schema.String),
    remote: Schema.optional(
      Schema.Struct({
        casting: Schema.Boolean,
        currentReceiver: VideoReceiver,
        options: Schema.Array(Schema.String),
        quickCast: Schema.Boolean,
        receivers: Schema.Array(VideoReceiver),
      }),
    ),
  }),
}) {}

export class YouTubeReadyEvent extends Schema.Class<YouTubeReadyEvent>("YouTubeReadyEvent")({
  ...EventEnvelope,
  event: Schema.Literal("onReady"),
}) {}

export class YouTubeStateChangeEvent extends Schema.Class<YouTubeStateChangeEvent>(
  "YouTubeStateChangeEvent",
)({
  ...EventEnvelope,
  event: Schema.Literal("onStateChange"),
  info: PlayerStateCode,
}) {}

export class YouTubeErrorEvent extends Schema.Class<YouTubeErrorEvent>("YouTubeErrorEvent")({
  ...EventEnvelope,
  event: Schema.Literal("onError"),
  info: ErrorCode,
}) {}

export const YouTubeEvent = Schema.Union([
  YouTubeInitialDeliveryEvent,
  YouTubeInfoDeliveryEvent,
  YouTubeApiInfoDeliveryEvent,
  YouTubeReadyEvent,
  YouTubeStateChangeEvent,
  YouTubeErrorEvent,
])
export type YouTubeEvent = typeof YouTubeEvent.Type

export class PlayVideoCommand extends Schema.Class<PlayVideoCommand>("PlayVideoCommand")({
  event: Schema.tag("command"),
  func: Schema.tag("playVideo"),
  id: Schema.tag(1),
}) {}

export class PauseVideoCommand extends Schema.Class<PauseVideoCommand>("PauseVideoCommand")({
  event: Schema.tag("command"),
  func: Schema.tag("pauseVideo"),
  id: Schema.tag(1),
}) {}

export class SeekToCommand extends Schema.Class<SeekToCommand>("SeekToCommand")({
  event: Schema.tag("command"),
  func: Schema.tag("seekTo"),
  args: Schema.Tuple([Schema.Number, Schema.Boolean]),
  id: Schema.tag(1),
}) {}

export const EmbedCommand = Schema.Union([PlayVideoCommand, PauseVideoCommand, SeekToCommand]).pipe(
  Schema.toTaggedUnion("func"),
)
export type EmbedCommand = typeof EmbedCommand.Type

// =============================================================================
// Embed State Model
// =============================================================================

export class NoPendingCommand extends Schema.Class<NoPendingCommand>("NoPendingCommand")({
  _tag: Schema.tag("None"),
}) {}

export class PlayRequested extends Schema.Class<PlayRequested>("PlayRequested")({
  _tag: Schema.tag("PlayRequested"),
}) {}

export class PauseRequested extends Schema.Class<PauseRequested>("PauseRequested")({
  _tag: Schema.tag("PauseRequested"),
}) {}

export class SeekRequested extends Schema.Class<SeekRequested>("SeekRequested")({
  _tag: Schema.tag("SeekRequested"),
  seconds: Schema.Number,
}) {}

export const PendingCommand = Schema.Union([
  NoPendingCommand,
  PlayRequested,
  PauseRequested,
  SeekRequested,
]).pipe(Schema.toTaggedUnion("_tag"))
export type PendingCommand = typeof PendingCommand.Type

export class PlaybackUnstarted extends Schema.Class<PlaybackUnstarted>("PlaybackUnstarted")({
  _tag: Schema.tag("Unstarted"),
}) {}

export class PlaybackCued extends Schema.Class<PlaybackCued>("PlaybackCued")({
  _tag: Schema.tag("Cued"),
  currentTimeSeconds: Schema.Number,
}) {}

export const PlaybackTimeFields = {
  currentTimeSeconds: Schema.Number,
} as const

export class PlaybackPlaying extends Schema.Class<PlaybackPlaying>("PlaybackPlaying")({
  _tag: Schema.tag("Playing"),
  ...PlaybackTimeFields,
}) {}

export class PlaybackPaused extends Schema.Class<PlaybackPaused>("PlaybackPaused")({
  _tag: Schema.tag("Paused"),
  ...PlaybackTimeFields,
}) {}

export class PlaybackBuffering extends Schema.Class<PlaybackBuffering>("PlaybackBuffering")({
  _tag: Schema.tag("Buffering"),
  ...PlaybackTimeFields,
}) {}

export class PlaybackEnded extends Schema.Class<PlaybackEnded>("PlaybackEnded")({
  _tag: Schema.tag("Ended"),
  currentTimeSeconds: Schema.Number,
}) {}

export const PlaybackState = Schema.Union([
  PlaybackUnstarted,
  PlaybackCued,
  PlaybackPlaying,
  PlaybackPaused,
  PlaybackBuffering,
  PlaybackEnded,
])
export type PlaybackState = typeof PlaybackState.Type

export class EmbedStateNotMounted extends Schema.Class<EmbedStateNotMounted>(
  "EmbedStateNotMounted",
)({
  _tag: Schema.tag("NotMounted"),
}) {}

export class EmbedStateMounting extends Schema.Class<EmbedStateMounting>("EmbedStateMounting")({
  _tag: Schema.tag("Mounting"),
}) {}

export class EmbedStateHandshaking extends Schema.Class<EmbedStateHandshaking>(
  "EmbedStateHandshaking",
)({
  _tag: Schema.tag("Handshaking"),
}) {}

export class EmbedStateActive extends Schema.Class<EmbedStateActive>("EmbedStateActive")({
  _tag: Schema.tag("Active"),
  playback: PlaybackState,
  pending: PendingCommand,
}) {}

export class EmbedStateFailed extends Schema.Class<EmbedStateFailed>("EmbedStateFailed")({
  _tag: Schema.tag("Failed"),
}) {}

export const EmbedState = Schema.Union([
  EmbedStateNotMounted,
  EmbedStateMounting,
  EmbedStateHandshaking,
  EmbedStateActive,
  EmbedStateFailed,
]).pipe(Schema.toTaggedUnion("_tag"))
export type EmbedState = typeof EmbedState.Type

function makeInitialEmbedState(): EmbedState {
  return new EmbedStateNotMounted()
}

function makeDefaultPlaybackState(): PlaybackState {
  return new PlaybackUnstarted()
}

function makeNoPendingCommand(): PendingCommand {
  return new NoPendingCommand()
}

function markMounted(state: EmbedState): EmbedState {
  switch (state._tag) {
    case "NotMounted":
      return new EmbedStateMounting()
    case "Mounting":
      return new EmbedStateMounting()
    default:
      return state
  }
}

function beginHandshake(state: EmbedState): EmbedState {
  switch (state._tag) {
    case "NotMounted":
    case "Mounting":
      return new EmbedStateHandshaking()
    default:
      return state
  }
}

function setPendingCommand(state: EmbedState, pending: PendingCommand): EmbedState {
  if (state._tag !== "Active") {
    return state
  }
  return new EmbedStateActive({
    playback: state.playback,
    pending,
  })
}

function reduceEmbedState(state: EmbedState, event: YouTubeEvent): EmbedState {
  switch (event.event) {
    case "onError":
      return new EmbedStateFailed()
    case "onReady":
      return ensureActiveState(state)
    case "apiInfoDelivery":
      return ensureActiveState(state)
    case "initialDelivery":
    case "infoDelivery":
      return applyPlayerInfoPatchToState(state, event.info)
    case "onStateChange":
      return applyPlayerInfoPatchToState(state, {
        playerState: event.info,
      })
  }
}

function ensureActiveState(state: EmbedState): EmbedState {
  if (state._tag === "Active") {
    return new EmbedStateActive({
      playback: state.playback,
      pending: state.pending,
    })
  }

  return new EmbedStateActive({
    playback: makeDefaultPlaybackState(),
    pending: makeNoPendingCommand(),
  })
}

function applyPlayerInfoPatchToState(state: EmbedState, patch: PlayerInfoPatch): EmbedState {
  const activeState = ensureActiveState(state)
  if (activeState._tag !== "Active") {
    return activeState
  }

  const playback = applyPlayerInfoPatch(activeState.playback, patch)

  return new EmbedStateActive({
    playback,
    pending: resolvePendingCommand(activeState.pending, playback),
  })
}

function applyPlayerInfoPatch(playback: PlaybackState, patch: PlayerInfoPatch): PlaybackState {
  const playerState = patch.playerState ?? getPlayerStateCode(playback)
  const currentTime = patch.currentTime ?? getCurrentTimeSeconds(playback)

  switch (playerState) {
    case -1:
      return new PlaybackUnstarted()
    case 0:
      return new PlaybackEnded({
        currentTimeSeconds: currentTime ?? patch.duration ?? 0,
      })
    case 1:
      return makeTimedPlaybackState(PlaybackPlaying, currentTime)
    case 2:
      return makeTimedPlaybackState(PlaybackPaused, currentTime)
    case 3:
      return makeTimedPlaybackState(PlaybackBuffering, currentTime)
    case 5:
      return new PlaybackCued({
        currentTimeSeconds: currentTime ?? 0,
      })
  }
}

function makeTimedPlaybackState<A extends PlaybackPlaying | PlaybackPaused | PlaybackBuffering>(
  ctor: new (fields: { currentTimeSeconds: number }) => A,
  currentTime: number | undefined,
): A {
  return new ctor({ currentTimeSeconds: currentTime ?? 0 })
}

function resolvePendingCommand(pending: PendingCommand, playback: PlaybackState): PendingCommand {
  switch (pending._tag) {
    case "None":
      return pending
    case "PlayRequested":
      return playback._tag === "Playing" ? makeNoPendingCommand() : pending
    case "PauseRequested":
      return playback._tag === "Paused" ? makeNoPendingCommand() : pending
    case "SeekRequested": {
      const currentTime = getCurrentTimeSeconds(playback)
      return currentTime !== undefined && Math.abs(currentTime - pending.seconds) < 1
        ? makeNoPendingCommand()
        : pending
    }
  }
}

function getPlayerStateCode(playback: PlaybackState): PlayerStateCode {
  switch (playback._tag) {
    case "Unstarted":
      return -1
    case "Ended":
      return 0
    case "Playing":
      return 1
    case "Paused":
      return 2
    case "Buffering":
      return 3
    case "Cued":
      return 5
  }
}

function getCurrentTimeSeconds(playback: PlaybackState): number | undefined {
  switch (playback._tag) {
    case "Unstarted":
      return undefined
    default:
      return playback.currentTimeSeconds
  }
}
