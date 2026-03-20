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
    readonly connect: Atom.AtomResultFn<HTMLElement, void, never>
    readonly play: Atom.AtomResultFn<void, void, never>
    readonly pause: Atom.AtomResultFn<void, void, never>
    readonly seekTo: Atom.AtomResultFn<number, void, never>
  }
>()("PodcastEmbedManager", {
  make: Effect.fnUntraced(function* (episode: PodcastEpisode) {
    const queue = yield* Queue.unbounded<EmbedCommand>()
    const debugAtom = Atom.make<ReadonlyArray<string>>([])
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

                yield* decodeEvent(event.data)
              }),
            ),
          )
        }

        const handleLoad = () => {
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
    })

    return {
      debugAtom,
      connect: Atom.fn<HTMLElement>()((element) => connect(element)),
      play: Atom.fn<void>()(() => Effect.asVoid(Queue.offer(queue, new PlayVideoCommand()))),
      pause: Atom.fn<void>()(() => Effect.asVoid(Queue.offer(queue, new PauseVideoCommand()))),
      seekTo: Atom.fn<number>()((seconds) =>
        Effect.asVoid(Queue.offer(queue, new SeekToCommand({ args: [seconds, true] }))),
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
  videoLoadedFraction: Schema.optional(Schema.Number),
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
    remote: Schema.Struct({
      casting: Schema.Boolean,
      currentReceiver: VideoReceiver,
      options: Schema.Array(Schema.String),
      quickCast: Schema.Boolean,
      receivers: Schema.Array(VideoReceiver),
    }),
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

export const VideoMetadata = Schema.Struct({
  videoId: Schema.String,
  title: Schema.optional(Schema.String),
  author: Schema.optional(Schema.String),
  videoUrl: Schema.optional(Schema.String),
})
export type VideoMetadata = typeof VideoMetadata.Type

export class NoPendingCommand extends Schema.Class<NoPendingCommand>("NoPendingCommand")({
  _tag: Schema.tag("None"),
}) {}

export class PlayRequested extends Schema.Class<PlayRequested>("PlayRequested")({
  _tag: Schema.tag("PlayRequested"),
  requestedAt: Schema.Number,
}) {}

export class PauseRequested extends Schema.Class<PauseRequested>("PauseRequested")({
  _tag: Schema.tag("PauseRequested"),
  requestedAt: Schema.Number,
}) {}

export class SeekRequested extends Schema.Class<SeekRequested>("SeekRequested")({
  _tag: Schema.tag("SeekRequested"),
  seconds: Schema.Number,
  allowSeekAhead: Schema.Boolean,
  requestedAt: Schema.Number,
}) {}

export const PendingCommand = Schema.Union([
  NoPendingCommand,
  PlayRequested,
  PauseRequested,
  SeekRequested,
]).pipe(Schema.toTaggedUnion("_tag"))
export type PendingCommand = typeof PendingCommand.Type

export class YouTubeErrorFailureReason extends Schema.Class<YouTubeErrorFailureReason>(
  "YouTubeErrorFailureReason",
)({
  _tag: Schema.tag("YouTubeError"),
  code: ErrorCode,
}) {}

export class InvalidMessageFailureReason extends Schema.Class<InvalidMessageFailureReason>(
  "InvalidMessageFailureReason",
)({
  _tag: Schema.tag("InvalidMessage"),
}) {}

export class HandshakeTimedOutFailureReason extends Schema.Class<HandshakeTimedOutFailureReason>(
  "HandshakeTimedOutFailureReason",
)({
  _tag: Schema.tag("HandshakeTimedOut"),
}) {}

export class IframeDetachedFailureReason extends Schema.Class<IframeDetachedFailureReason>(
  "IframeDetachedFailureReason",
)({
  _tag: Schema.tag("IframeDetached"),
}) {}

export const EmbedFailureReason = Schema.Union([
  YouTubeErrorFailureReason,
  InvalidMessageFailureReason,
  HandshakeTimedOutFailureReason,
  IframeDetachedFailureReason,
]).pipe(Schema.toTaggedUnion("_tag"))
export type EmbedFailureReason = typeof EmbedFailureReason.Type

export const ActiveDiagnostics = Schema.Struct({
  lastEvent: Schema.optional(Schema.String),
  lastError: Schema.optional(ErrorCode),
  lastUpdatedAt: Schema.Number,
})
export type ActiveDiagnostics = typeof ActiveDiagnostics.Type

export class PlaybackUnstarted extends Schema.Class<PlaybackUnstarted>("PlaybackUnstarted")({
  _tag: Schema.tag("Unstarted"),
  video: VideoMetadata,
  durationSeconds: Schema.optional(Schema.Number),
}) {}

export class PlaybackCued extends Schema.Class<PlaybackCued>("PlaybackCued")({
  _tag: Schema.tag("Cued"),
  video: VideoMetadata,
  currentTimeSeconds: Schema.Number,
  durationSeconds: Schema.Number,
}) {}

export const PlaybackRunningFields = {
  video: VideoMetadata,
  currentTimeSeconds: Schema.Number,
  durationSeconds: Schema.Number,
  playbackRate: Schema.Number,
  volume: Schema.optional(Schema.Number),
  muted: Schema.Boolean,
  loadedFraction: Schema.optional(Schema.Number),
  quality: Schema.optional(Schema.String),
} as const

export class PlaybackPlaying extends Schema.Class<PlaybackPlaying>("PlaybackPlaying")({
  _tag: Schema.tag("Playing"),
  ...PlaybackRunningFields,
}) {}

export class PlaybackPaused extends Schema.Class<PlaybackPaused>("PlaybackPaused")({
  _tag: Schema.tag("Paused"),
  ...PlaybackRunningFields,
}) {}

export class PlaybackBuffering extends Schema.Class<PlaybackBuffering>("PlaybackBuffering")({
  _tag: Schema.tag("Buffering"),
  ...PlaybackRunningFields,
}) {}

export class PlaybackEnded extends Schema.Class<PlaybackEnded>("PlaybackEnded")({
  _tag: Schema.tag("Ended"),
  video: VideoMetadata,
  currentTimeSeconds: Schema.Number,
  durationSeconds: Schema.Number,
}) {}

export const PlaybackState = Schema.Union([
  PlaybackUnstarted,
  PlaybackCued,
  PlaybackPlaying,
  PlaybackPaused,
  PlaybackBuffering,
  PlaybackEnded,
]).pipe(Schema.toTaggedUnion("_tag"))
export type PlaybackState = typeof PlaybackState.Type

export const ActiveSession = Schema.Struct({
  connectedAt: Schema.Number,
  lastMessageAt: Schema.Number,
})
export type ActiveSession = typeof ActiveSession.Type

export class EmbedStateNotMounted extends Schema.Class<EmbedStateNotMounted>(
  "EmbedStateNotMounted",
)({
  _tag: Schema.tag("NotMounted"),
}) {}

export class EmbedStateMounting extends Schema.Class<EmbedStateMounting>("EmbedStateMounting")({
  _tag: Schema.tag("Mounting"),
  iframeMounted: Schema.Boolean,
  startedAt: Schema.Number,
}) {}

export class EmbedStateHandshaking extends Schema.Class<EmbedStateHandshaking>(
  "EmbedStateHandshaking",
)({
  _tag: Schema.tag("Handshaking"),
  iframeMounted: Schema.Literal(true),
  startedAt: Schema.Number,
}) {}

export class EmbedStateActive extends Schema.Class<EmbedStateActive>("EmbedStateActive")({
  _tag: Schema.tag("Active"),
  session: ActiveSession,
  playback: PlaybackState,
  pending: PendingCommand,
  diagnostics: ActiveDiagnostics,
}) {}

export class EmbedStateFailed extends Schema.Class<EmbedStateFailed>("EmbedStateFailed")({
  _tag: Schema.tag("Failed"),
  stage: Schema.Union([
    Schema.Literal("mount"),
    Schema.Literal("handshake"),
    Schema.Literal("runtime"),
  ]),
  reason: EmbedFailureReason,
  lastKnownVideo: Schema.optional(VideoMetadata),
  failedAt: Schema.Number,
}) {}

export const EmbedState = Schema.Union([
  EmbedStateNotMounted,
  EmbedStateMounting,
  EmbedStateHandshaking,
  EmbedStateActive,
  EmbedStateFailed,
]).pipe(Schema.toTaggedUnion("_tag"))
export type EmbedState = typeof EmbedState.Type
