import type { PlayerSnapshot, DebugSnapshot } from "./domain"

export const VIDEO_EMBED_HANDSHAKE_RETRY_DELAYS = [0, 100, 300, 1000] as const

export const EMPTY_PLAYER_SNAPSHOT: PlayerSnapshot = {
  currentTime: 0,
  status: "idle",
  title: "",
  videoId: "",
}

export const EMPTY_DEBUG_SNAPSHOT: DebugSnapshot = {
  eventCount: 0,
  lastCommand: "none",
  lastEvent: "none",
  lastPlayerState: undefined,
  lastRawInfo: "",
}
