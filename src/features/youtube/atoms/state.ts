import * as Option from "effect/Option"
import * as Atom from "effect/unstable/reactivity/Atom"

export type ConnectionPhase = "idle" | "connecting" | "connected" | "error"

export type LoadState = "previewing" | "loading" | "ready"

export type PlayerStatus = "idle" | "loading" | "ready" | "playing" | "paused" | "ended" | "error"

export interface PlayerSnapshot {
  readonly currentTime: number
  readonly status: PlayerStatus
  readonly title: string
  readonly videoId: string
}

export interface DebugSnapshot {
  readonly eventCount: number
  readonly lastCommand: "playVideo" | "pauseVideo" | "none"
  readonly lastEvent: string
  readonly lastPlayerState: number | undefined
  readonly lastRawInfo: string
}

export const emptySnapshot: PlayerSnapshot = {
  currentTime: 0,
  status: "idle",
  title: "",
  videoId: "",
}

export const emptyDebugSnapshot: DebugSnapshot = {
  eventCount: 0,
  lastCommand: "none",
  lastEvent: "none",
  lastPlayerState: undefined,
  lastRawInfo: "",
}

export const iframeElementAtom = Atom.family((_id: string) =>
  Atom.make(Option.none<HTMLIFrameElement>()),
)

export const connectionPhaseAtom = Atom.family((_id: string) => Atom.make<ConnectionPhase>("idle"))

export const playerSnapshotAtom = Atom.family((_id: string) =>
  Atom.make<PlayerSnapshot>(emptySnapshot),
)

export const connectionErrorAtom = Atom.family((_id: string) => Atom.make(Option.none<string>()))

export const debugSnapshotAtom = Atom.family((_id: string) =>
  Atom.make<DebugSnapshot>(emptyDebugSnapshot),
)

export const loadStateAtom = Atom.family((_id: string) => Atom.make<LoadState>("previewing"))

export const preconnectedAtom = Atom.family((_id: string) => Atom.make(false))
