import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import * as FiberHandle from "effect/FiberHandle"
import * as Layer from "effect/Layer"
import * as ServiceMap from "effect/ServiceMap"
import * as AtomRegistry from "effect/unstable/reactivity/AtomRegistry"
import type { PodcastChapter, PodcastEpisode, PodcastTranscriptCue } from "../domain"
import { podcastPlayerAtom } from "../atoms"
import { EmbedManager } from "./EmbedManager"

export class PodcastPlayer extends ServiceMap.Service<PodcastPlayer>()("PodcastPlayer", {
  make: Effect.gen(function* () {
    const registry = yield* AtomRegistry.AtomRegistry
    const embedManager = yield* EmbedManager
    const autoScrollHandle = yield* FiberHandle.make()

    const seekToChapter = Effect.fn("PodcastPlayer.seekToChapter")(function* (
      episode: PodcastEpisode,
      chapter: PodcastChapter,
    ) {
      if (!(yield* embedManager.seekTo(episode, chapter.startSeconds))) {
        return
      }
      const player = podcastPlayerAtom(episode)
      registry.set(player.activeChapterAtom, chapter)
    })

    const seekToCue = Effect.fn("PodcastPlayer.seekToCue")(function* (
      episode: PodcastEpisode,
      cue: PodcastTranscriptCue,
    ) {
      if (!(yield* embedManager.seekTo(episode, cue.startSeconds))) {
        return
      }
      const player = podcastPlayerAtom(episode)
      registry.set(player.activeTranscriptCueAtom, cue)
    })

    const pauseAutoScroll = Effect.fn("PodcastPlayer.pauseAutoScroll")(function* (
      episode: PodcastEpisode,
    ) {
      const player = podcastPlayerAtom(episode)
      const program = Effect.suspend(() => {
        registry.set(player.transcriptFollowModeAtom, "paused-by-user")
        return Effect.sleep("5 seconds")
      }).pipe(
        Effect.onExit((exit) =>
          Effect.sync(() => {
            if (!Exit.hasInterrupts(exit)) {
              registry.set(player.transcriptFollowModeAtom, "auto")
            }
          }),
        ),
      )
      yield* FiberHandle.run(autoScrollHandle, program)
    })

    return {
      seekToChapter,
      seekToCue,
      pauseAutoScroll,
    } as const
  }),
}) {
  static readonly layer = Layer.effect(this, this.make)
}
