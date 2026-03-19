import * as Layer from "effect/Layer"
import * as Option from "effect/Option"
import * as Atom from "effect/unstable/reactivity/Atom"
import type {
  PodcastChapter,
  PodcastEpisode,
  EmbedConnectionPhase,
  PlayerSnapshot,
  DebugSnapshot,
  PodcastTranscriptCue,
  TranscriptFollowMode,
} from "./domain"
import { EMPTY_DEBUG_SNAPSHOT, EMPTY_PLAYER_SNAPSHOT } from "./constants"
import { EmbedManager } from "./services/EmbedManager"
import { PodcastPlayer } from "./services/PodcastPlayer"

const PodcastRuntimeLayer = PodcastPlayer.layer.pipe(Layer.provideMerge(EmbedManager.layer))

export const playerRuntime = Atom.runtime(PodcastRuntimeLayer)

export interface PodcastPlayerAtom extends ReturnType<typeof podcastPlayerAtom> {}

export const podcastPlayerAtom = Atom.family((episode: PodcastEpisode) => {
  const activeChapterAtom = Atom.make(episode.chapters[0]!)
  const activeTranscriptCueAtom = Atom.make(episode.transcript[0]!)

  const preconnectAtom = Atom.make(false)

  const iframeElementAtom = Atom.make(Option.none<HTMLIFrameElement>())

  const embedConnectionPhaseAtom = Atom.make<EmbedConnectionPhase>("idle")
  const embedConnectionErrorAtom = Atom.make(Option.none<string>())

  const debugSnapshotAtom = Atom.make<DebugSnapshot>(EMPTY_DEBUG_SNAPSHOT)
  const playerSnapshotAtom = Atom.make<PlayerSnapshot>(EMPTY_PLAYER_SNAPSHOT)

  const transcriptFollowModeAtom = Atom.make<TranscriptFollowMode>("auto")

  const connectToVideoEmbed = playerRuntime.fn<string>()((targetOrigin) =>
    EmbedManager.use((_) => _.connect(episode, targetOrigin)),
  )

  const disconnectFromVideoEmbed = playerRuntime.fn<void>()(() =>
    EmbedManager.use((_) => _.disconnect(episode)),
  )

  const playVideo = playerRuntime.fn<void>()(() => EmbedManager.use((_) => _.play(episode)))

  const pauseVideo = playerRuntime.fn<void>()(() => EmbedManager.use((_) => _.pause(episode)))

  const seekToChapterAtom = playerRuntime.fn<PodcastChapter>()((chapter) =>
    PodcastPlayer.use((_) => _.seekToChapter(episode, chapter)),
  )

  const seekToCueAtom = playerRuntime.fn<PodcastTranscriptCue>()((cue) =>
    PodcastPlayer.use((_) => _.seekToCue(episode, cue)),
  )

  const pauseAutoScrollAtom = playerRuntime.fn<void>()(() =>
    PodcastPlayer.use((_) => _.pauseAutoScroll(episode)),
  )

  return {
    episode,
    preconnectAtom,
    iframeElementAtom,
    embedConnectionPhaseAtom,
    embedConnectionErrorAtom,
    debugSnapshotAtom,
    playerSnapshotAtom,
    activeChapterAtom,
    activeTranscriptCueAtom,
    transcriptFollowModeAtom,

    connectToVideoEmbed,
    disconnectFromVideoEmbed,
    playVideo,
    pauseVideo,
    seekToChapterAtom,
    seekToCueAtom,
    pauseAutoScrollAtom,
  }
})
