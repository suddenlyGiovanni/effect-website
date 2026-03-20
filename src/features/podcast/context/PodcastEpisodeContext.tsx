import * as React from "react"
import { PodcastEpisodeEntry } from "../collection"
import { PodcastEpisode, type SrtCue } from "../domain"

export const PodcastEpisodeContext = React.createContext<PodcastEpisode>(null as any)

export const usePodcastEpisode = () => React.useContext(PodcastEpisodeContext)

export interface PodcastEpisodeProps {
  readonly podcast: PodcastEpisodeEntry
  readonly transcript: ReadonlyArray<SrtCue>
}
