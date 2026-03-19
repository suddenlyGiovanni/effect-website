import * as Schema from "effect/Schema"

export const Channel = Schema.Literal("widget")

export const PlayerStateCode = Schema.Union([
  Schema.Literal(-1),
  Schema.Literal(0),
  Schema.Literal(1),
  Schema.Literal(2),
  Schema.Literal(3),
  Schema.Literal(5),
])
export type PlayerStateCode = typeof PlayerStateCode.Type

export const ErrorCode = Schema.Union([
  Schema.Literal(2),
  Schema.Literal(5),
  Schema.Literal(100),
  Schema.Literal(101),
  Schema.Literal(150),
  Schema.Literal(153),
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
  videoData: Schema.optional(VideoDataPatch),
  videoLoadedFraction: Schema.optional(Schema.Number),
  videoUrl: Schema.optional(Schema.String),
  volume: Schema.optional(Schema.Number),
})
export type PlayerInfoPatch = typeof PlayerInfoPatch.Type

export const EventEnvelope = {
  channel: Schema.optional(Channel),
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
  YouTubeReadyEvent,
  YouTubeStateChangeEvent,
  YouTubeErrorEvent,
])
export type YouTubeEvent = typeof YouTubeEvent.Type
