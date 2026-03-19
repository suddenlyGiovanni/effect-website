import * as Atom from "effect/unstable/reactivity/Atom"
import { YouTubeEmbedManager, type ConnectEmbedInput } from "../runtime/YouTubeEmbedManager"

const runtime = Atom.runtime(YouTubeEmbedManager.layer)

export const connectEmbedAtom = runtime.fn<ConnectEmbedInput>()((input) =>
  YouTubeEmbedManager.use((manager) => manager.connect(input)),
)

export const disconnectEmbedAtom = runtime.fn<string>()((connectionId) =>
  YouTubeEmbedManager.use((manager) => manager.disconnect(connectionId)),
)

export const playAtom = runtime.fn<string>()((videoId) =>
  YouTubeEmbedManager.use((manager) => manager.play(videoId)),
)

export const pauseAtom = runtime.fn<string>()((videoId) =>
  YouTubeEmbedManager.use((manager) => manager.pause(videoId)),
)
