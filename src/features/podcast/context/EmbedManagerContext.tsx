import { useAtomSet, useAtomValue } from "@effect/atom-react"
import * as React from "react"
import type { PodcastEmbedManager } from "../services/PodcastEmbedManager"

export const EmbedManagerContext = React.createContext<PodcastEmbedManager["Service"]>(null as any)

export const useEmbedManager = () => React.useContext(EmbedManagerContext)

export const useDebugInfo = () => useAtomValue(useEmbedManager().debugAtom)

export const useEmbedState = () => useAtomValue(useEmbedManager().stateAtom)

export const useConnectEmbed = () => useAtomSet(useEmbedManager().connect)

export const useEmbedControls = () => {
  const manager = useEmbedManager()
  const play = useAtomSet(manager.play)
  const pause = useAtomSet(manager.pause)
  const seekTo = useAtomSet(manager.seekTo)
  return { play, pause, seekTo } as const
}
