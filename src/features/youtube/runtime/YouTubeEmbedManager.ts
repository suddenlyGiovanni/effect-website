import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Option from "effect/Option"
import * as Schema from "effect/Schema"
import * as ServiceMap from "effect/ServiceMap"
import * as AtomRegistry from "effect/unstable/reactivity/AtomRegistry"
import {
  type PlayerSnapshot,
  emptyDebugSnapshot,
  connectionErrorAtom,
  connectionPhaseAtom,
  iframeElementAtom,
  playerSnapshotAtom,
  debugSnapshotAtom,
} from "../atoms/state"
import { YouTubeEvent } from "../model/domain"

export interface ConnectEmbedInput {
  readonly connectionId: string
  readonly targetOrigin: string
  readonly title: string
  readonly videoId: string
}

interface ConnectionEntry {
  readonly disconnect: () => void
  readonly sendPlay: () => void
  readonly sendPause: () => void
}

const YOUTUBE_HANDSHAKE_RETRY_DELAYS = [0, 100, 300, 1000] as const

export class YouTubeEmbedManager extends ServiceMap.Service<
  YouTubeEmbedManager,
  {
    readonly connect: (input: ConnectEmbedInput) => Effect.Effect<void>
    readonly disconnect: (connectionId: string) => Effect.Effect<void>
    readonly play: (connectionId: string) => Effect.Effect<void>
    readonly pause: (connectionId: string) => Effect.Effect<void>
  }
>()("YouTubeEmbedManager", {
  make: Effect.gen(function* () {
    const registry = yield* AtomRegistry.AtomRegistry
    const connections = new Map<string, ConnectionEntry>()

    const decodeEvent = Schema.decodeUnknownOption(Schema.fromJsonString(YouTubeEvent))

    const disconnect = Effect.fn("YouTubeEmbedManager.disconnect")((connectionId: string) =>
      Effect.sync(() => {
        const entry = connections.get(connectionId)

        if (entry) {
          connections.delete(connectionId)
          entry.disconnect()
        }

        registry.set(connectionPhaseAtom(connectionId), "idle")
        registry.set(connectionErrorAtom(connectionId), Option.none())
        registry.set(debugSnapshotAtom(connectionId), emptyDebugSnapshot)
      }),
    )

    const connect = Effect.fn("YouTubeEmbedManager.connect")(function* (input: ConnectEmbedInput) {
      yield* disconnect(input.connectionId)

      const iframeOption = registry.get(iframeElementAtom(input.connectionId))

      if (Option.isNone(iframeOption)) {
        return yield* Effect.void
      }

      const iframe = iframeOption.value
      let snapshot: PlayerSnapshot = {
        currentTime: 0,
        status: "loading",
        title: input.title,
        videoId: input.videoId,
      }

      registry.set(connectionPhaseAtom(input.connectionId), "connecting")
      registry.set(connectionErrorAtom(input.connectionId), Option.none())
      registry.set(playerSnapshotAtom(input.connectionId), snapshot)
      registry.set(debugSnapshotAtom(input.connectionId), emptyDebugSnapshot)

      const sendListeningRequest = () => {
        iframe.contentWindow?.postMessage(makeListeningMessage(), input.targetOrigin)
      }

      const sendPlay = () => {
        iframe.contentWindow?.postMessage(makeCommandMessage("playVideo"), input.targetOrigin)
        const current = registry.get(debugSnapshotAtom(input.connectionId))
        registry.set(debugSnapshotAtom(input.connectionId), {
          ...current,
          lastCommand: "playVideo",
        })
      }

      const sendPause = () => {
        iframe.contentWindow?.postMessage(makeCommandMessage("pauseVideo"), input.targetOrigin)
        const current = registry.get(debugSnapshotAtom(input.connectionId))
        registry.set(debugSnapshotAtom(input.connectionId), {
          ...current,
          lastCommand: "pauseVideo",
        })
      }

      const handshakeTimeouts = new Set<number>()

      const scheduleHandshake = () => {
        for (const delay of YOUTUBE_HANDSHAKE_RETRY_DELAYS) {
          const timeout = window.setTimeout(() => {
            handshakeTimeouts.delete(timeout)
            sendListeningRequest()
          }, delay)
          handshakeTimeouts.add(timeout)
        }
      }

      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== input.targetOrigin) return
        if (event.source !== iframe.contentWindow) return

        const parsed = decodeEvent(event.data)
        if (Option.isNone(parsed)) return

        const currentDebug = registry.get(debugSnapshotAtom(input.connectionId))
        registry.set(debugSnapshotAtom(input.connectionId), {
          eventCount: currentDebug.eventCount + 1,
          lastCommand: currentDebug.lastCommand,
          lastEvent: parsed.value.event,
          lastPlayerState: getEventPlayerState(parsed.value),
          lastRawInfo: "info" in parsed.value ? stringifyDebugInfo(parsed.value.info) : "",
        })

        if (registry.get(connectionPhaseAtom(input.connectionId)) !== "error") {
          registry.set(connectionPhaseAtom(input.connectionId), "connected")
        }

        snapshot = mapPlayerStatus(parsed.value, snapshot)
        registry.set(playerSnapshotAtom(input.connectionId), snapshot)

        if (
          snapshot.status === "ready" ||
          snapshot.status === "playing" ||
          snapshot.status === "paused" ||
          snapshot.status === "ended"
        ) {
          registry.set(connectionPhaseAtom(input.connectionId), "connected")
        }

        if (snapshot.status === "error") {
          registry.set(connectionPhaseAtom(input.connectionId), "error")
          registry.set(
            connectionErrorAtom(input.connectionId),
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

      connections.set(input.connectionId, {
        disconnect: () => {
          window.removeEventListener("message", handleMessage)
          iframe.removeEventListener("load", scheduleHandshake)

          for (const timeout of handshakeTimeouts) {
            window.clearTimeout(timeout)
          }
        },
        sendPause,
        sendPlay,
      })
    })

    const play = Effect.fn("YouTubeEmbedManager.play")((connectionId: string) =>
      Effect.sync(() => {
        const entry = connections.get(connectionId)

        if (!entry) {
          return
        }

        entry.sendPlay()

        const snapshot = registry.get(playerSnapshotAtom(connectionId))
        registry.set(playerSnapshotAtom(connectionId), {
          ...snapshot,
          status: "playing",
        })
      }),
    )

    const pause = Effect.fn("YouTubeEmbedManager.pause")((connectionId: string) =>
      Effect.sync(() => {
        const entry = connections.get(connectionId)

        if (!entry) {
          return
        }

        entry.sendPause()

        const snapshot = registry.get(playerSnapshotAtom(connectionId))
        registry.set(playerSnapshotAtom(connectionId), {
          ...snapshot,
          status: "paused",
        })
      }),
    )

    const togglePlayback = Effect.fn("YouTubeEmbedManager.togglePlayback")(function* (
      connectionId: string,
    ) {
      const entry = connections.get(connectionId)

      if (!entry) {
        return yield* Effect.void
      }

      const snapshot = registry.get(playerSnapshotAtom(connectionId))

      if (snapshot.status === "playing") {
        yield* pause(connectionId)
        return yield* Effect.void
      }

      yield* play(connectionId)
    })

    return {
      connect,
      disconnect,
      pause,
      play,
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

const makeListeningMessage = () =>
  JSON.stringify({
    event: "listening",
    id: 1,
  })

const makeCommandMessage = (func: "playVideo" | "pauseVideo", args: ReadonlyArray<unknown> = []) =>
  JSON.stringify({
    event: "command",
    func,
    args,
    id: 1,
  })

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
