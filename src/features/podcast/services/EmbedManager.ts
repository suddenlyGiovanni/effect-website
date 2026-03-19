import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Option from "effect/Option"
import * as Schema from "effect/Schema"
import * as ServiceMap from "effect/ServiceMap"
import * as AtomRegistry from "effect/unstable/reactivity/AtomRegistry"
import { podcastPlayerAtom } from "../atoms"
import { EMPTY_DEBUG_SNAPSHOT, VIDEO_EMBED_HANDSHAKE_RETRY_DELAYS } from "../constants"
import {
  type PlayerSnapshot,
  YouTubeEvent,
  PodcastEpisode,
  PlayVideoCommand,
  EmbedCommand,
  PauseVideoCommand,
  SeekToCommand,
} from "../domain"

interface ConnectionEntry {
  readonly disconnect: () => void
  readonly sendPlay: () => void
  readonly sendPause: () => void
  readonly sendSeekTo: (seconds: number) => void
}

export class EmbedManager extends ServiceMap.Service<
  EmbedManager,
  {
    readonly connect: (episode: PodcastEpisode, targetOrigin: string) => Effect.Effect<void>
    readonly disconnect: (episode: PodcastEpisode) => Effect.Effect<void>
    readonly play: (episode: PodcastEpisode) => Effect.Effect<void>
    readonly pause: (episode: PodcastEpisode) => Effect.Effect<void>
    readonly seekTo: (episode: PodcastEpisode, timestamp: number) => Effect.Effect<boolean>
  }
>()("EmbedManager", {
  make: Effect.gen(function* () {
    const registry = yield* AtomRegistry.AtomRegistry
    const connections = new Map<string, ConnectionEntry>()

    // @effect-diagnostics-next-line schemaSyncInEffect:off
    const encodeEmbedCommand = Schema.encodeUnknownSync(Schema.fromJsonString(EmbedCommand))
    const decodeEvent = Schema.decodeUnknownOption(Schema.fromJsonString(YouTubeEvent))

    const disconnect = Effect.fn("YouTubeEmbedManager.disconnect")((episode: PodcastEpisode) =>
      Effect.sync(() => {
        const player = podcastPlayerAtom(episode)
        const entry = connections.get(episode.id)

        if (entry) {
          connections.delete(episode.id)
          entry.disconnect()
        }

        registry.set(player.embedConnectionPhaseAtom, "connecting")
        registry.set(player.embedConnectionErrorAtom, Option.none())
        registry.set(player.debugSnapshotAtom, EMPTY_DEBUG_SNAPSHOT)
      }),
    )

    const connect = Effect.fn("YouTubeEmbedManager.connect")(function* (
      episode: PodcastEpisode,
      targetOrigin: string,
    ) {
      const player = podcastPlayerAtom(episode)

      yield* disconnect(episode)

      const iframeOption = registry.get(player.iframeElementAtom)

      if (Option.isNone(iframeOption)) {
        return yield* Effect.void
      }

      const iframe = iframeOption.value
      let snapshot: PlayerSnapshot = {
        currentTime: 0,
        status: "loading",
        title: episode.title,
        videoId: episode.youtube.id,
      }

      registry.set(player.embedConnectionPhaseAtom, "connecting")
      registry.set(player.embedConnectionErrorAtom, Option.none())
      registry.set(player.playerSnapshotAtom, snapshot)
      registry.set(player.debugSnapshotAtom, EMPTY_DEBUG_SNAPSHOT)

      const sendListeningRequest = () => {
        const message = JSON.stringify({ event: "listening", id: 1 })
        iframe.contentWindow?.postMessage(message, targetOrigin)
      }

      const sendPlay = () => {
        const command = new PlayVideoCommand()
        const message = encodeEmbedCommand(command)
        iframe.contentWindow?.postMessage(message, targetOrigin)
        registry.update(player.debugSnapshotAtom, (snapshot) => ({
          ...snapshot,
          lastCommand: command.func,
        }))
      }

      const sendPause = () => {
        const command = new PauseVideoCommand()
        const message = encodeEmbedCommand(command)
        iframe.contentWindow?.postMessage(message, targetOrigin)
        registry.update(player.debugSnapshotAtom, (snapshot) => ({
          ...snapshot,
          lastCommand: command.func,
        }))
      }

      const sendSeekTo = (seconds: number) => {
        const command = new SeekToCommand({ args: [normalizeSeconds(seconds), true] })
        const message = encodeEmbedCommand(command)
        iframe.contentWindow?.postMessage(message, targetOrigin)
      }

      const handshakeTimeouts = new Set<number>()
      const scheduleHandshake = () => {
        for (const delay of VIDEO_EMBED_HANDSHAKE_RETRY_DELAYS) {
          const timeout = window.setTimeout(() => {
            handshakeTimeouts.delete(timeout)
            sendListeningRequest()
          }, delay)
          handshakeTimeouts.add(timeout)
        }
      }

      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== targetOrigin) return
        if (event.source !== iframe.contentWindow) return

        const parsed = decodeEvent(event.data)
        if (Option.isNone(parsed)) return

        const currentDebug = registry.get(player.debugSnapshotAtom)
        registry.set(player.debugSnapshotAtom, {
          eventCount: currentDebug.eventCount + 1,
          lastCommand: currentDebug.lastCommand,
          lastEvent: parsed.value.event,
          lastPlayerState: getEventPlayerState(parsed.value),
          lastRawInfo: "info" in parsed.value ? stringifyDebugInfo(parsed.value.info) : "",
        })

        if (registry.get(player.embedConnectionPhaseAtom) !== "error") {
          registry.set(player.embedConnectionPhaseAtom, "connected")
        }

        snapshot = mapPlayerStatus(parsed.value, snapshot)
        registry.set(player.playerSnapshotAtom, snapshot)

        if (
          snapshot.status === "ready" ||
          snapshot.status === "playing" ||
          snapshot.status === "paused" ||
          snapshot.status === "ended"
        ) {
          registry.set(player.embedConnectionPhaseAtom, "connected")
        }

        if (snapshot.status === "error") {
          registry.set(player.embedConnectionPhaseAtom, "error")
          registry.set(
            player.embedConnectionErrorAtom,
            Option.some(
              parsed.value.event === "onError"
                ? `YouTube player reported error ${parsed.value.info}`
                : "YouTube player reported an error",
            ),
          )
        }
      }

      window.addEventListener("message", handleMessage)
      iframe.addEventListener("load", scheduleHandshake)
      scheduleHandshake()

      connections.set(episode.id, {
        disconnect: () => {
          window.removeEventListener("message", handleMessage)
          iframe.removeEventListener("load", scheduleHandshake)

          for (const timeout of handshakeTimeouts) {
            window.clearTimeout(timeout)
          }
        },
        sendPause,
        sendPlay,
        sendSeekTo,
      })
    })

    const play = Effect.fn("YouTubeEmbedManager.play")((episode: PodcastEpisode) =>
      Effect.sync(() => {
        const player = podcastPlayerAtom(episode)
        const entry = connections.get(episode.id)

        if (!entry) {
          return
        }

        entry.sendPlay()

        registry.update(player.playerSnapshotAtom, (snapshot) => ({
          ...snapshot,
          status: "playing" as const,
        }))
      }),
    )

    const pause = Effect.fn("YouTubeEmbedManager.pause")((episode: PodcastEpisode) =>
      Effect.sync(() => {
        const player = podcastPlayerAtom(episode)
        const entry = connections.get(episode.id)

        if (!entry) {
          return
        }

        entry.sendPause()

        registry.update(player.playerSnapshotAtom, (snapshot) => ({
          ...snapshot,
          status: "paused" as const,
        }))
      }),
    )

    const seekTo = Effect.fn("YouTubeEmbedManager.seekTo")(
      (episode: PodcastEpisode, timestamp: number) =>
        Effect.sync(() => {
          const entry = connections.get(episode.id)

          if (!entry) {
            return false
          }

          const seconds = normalizeSeconds(timestamp)

          entry.sendSeekTo(seconds)

          return true
        }),
    )

    const togglePlayback = Effect.fn("YouTubeEmbedManager.togglePlayback")(function* (
      episode: PodcastEpisode,
    ) {
      const player = podcastPlayerAtom(episode)
      const entry = connections.get(episode.id)

      if (!entry) {
        return yield* Effect.void
      }

      const snapshot = registry.get(player.playerSnapshotAtom)

      if (snapshot.status === "playing") {
        yield* pause(episode)
        return yield* Effect.void
      }

      yield* play(episode)
    })

    return {
      connect,
      disconnect,
      pause,
      play,
      seekTo,
      togglePlayback,
    } as const
  }),
}) {
  static readonly layer = Layer.effect(this, this.make)
}

const stringifyDebugInfo = (value: unknown): string => {
  try {
    return JSON.stringify(value)
  } catch {
    return "[unserializable]"
  }
}

const normalizeSeconds = (seconds: number) => (Number.isFinite(seconds) ? Math.max(0, seconds) : 0)

const mapPlayerStatus = (
  message: YouTubeEvent,
  currentSnapshot: PlayerSnapshot,
): PlayerSnapshot => {
  switch (message.event) {
    case "initialDelivery":
    case "infoDelivery": {
      const nextTime = message.info.currentTime ?? currentSnapshot.currentTime
      const nextStatus =
        message.info.playerState === undefined
          ? currentSnapshot.status
          : mapYouTubePlayerState(message.info.playerState)

      return {
        currentTime: nextTime,
        status: nextStatus,
        title: message.info.videoData?.title ?? currentSnapshot.title,
        videoId: message.info.videoData?.video_id ?? currentSnapshot.videoId,
      }
    }
    case "onReady":
      return {
        ...currentSnapshot,
        status: currentSnapshot.status === "playing" ? "playing" : "ready",
      }
    case "onError":
      return {
        ...currentSnapshot,
        status: "error",
      }
    case "onStateChange": {
      return {
        ...currentSnapshot,
        status: mapYouTubePlayerState(message.info),
      }
    }
  }
}

const getEventPlayerState = (message: YouTubeEvent): number | undefined => {
  switch (message.event) {
    case "initialDelivery":
    case "infoDelivery":
      return message.info.playerState
    case "onStateChange":
      return message.info
    default:
      return undefined
  }
}

export function mapYouTubePlayerState(state: number | undefined) {
  switch (state) {
    case -1:
      return "loading" as const
    case 0:
      return "ended" as const
    case 1:
      return "playing" as const
    case 2:
      return "paused" as const
    case 3:
      return "loading" as const
    case 5:
      return "ready" as const
    default:
      return "ready" as const
  }
}
