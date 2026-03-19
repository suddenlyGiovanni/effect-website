import { useAtom, useAtomSet, useAtomValue } from "@effect/atom-react"
import * as Option from "effect/Option"
import { ArrowLeftIcon } from "lucide-react"
import * as React from "react"
import { PodcastChapters } from "./PodcastChapters"
import {
  PodcastEpisodeProvider,
  usePodcastPlayer,
  type PodcastEpisodeProviderProps,
} from "./PodcastEpisodeProvider"
import { PodcastGuestCard } from "./PodcastGuestCard"
import { PodcastTranscript } from "./PodcastTranscript"
import { PodcastVideoEmbed } from "./PodcastVideoEmbed"

export function PodcastEpisode({
  children,
  ...props
}: React.PropsWithChildren<PodcastEpisodeProviderProps>) {
  return (
    <PodcastEpisodeProvider {...props}>
      <PodcastEpisodePlayer>{children}</PodcastEpisodePlayer>
    </PodcastEpisodeProvider>
  )
}

export function PodcastEpisodePlayer({ children }: React.PropsWithChildren) {
  const { episode } = usePodcastPlayer()
  // const setChapterViews = useAtomSet(chapterViewsAtom(episode.id))
  // const setTranscriptCueViews = useAtomSet(transcriptCueViewsAtom(episode.id))
  // const [pendingPlaybackIntent, setPendingPlaybackIntent] = useAtom(
  //   pendingPlaybackIntentAtom(episode.id),
  // )
  // const [loadState, setLoadState] = useAtom(loadStateAtom(episode.id))
  // const connectionPhase = useAtomValue(connectionPhaseAtom(episode.id))
  // const playerSnapshot = useAtomValue(playerSnapshotAtom(episode.id))
  // const seekTo = useAtomSet(seekToAtom)
  // const play = useAtomSet(playAtom)
  //
  // React.useEffect(() => {
  //   setChapterViews(episode.chapters)
  //   setTranscriptCueViews(episode.transcript)
  //
  //   return () => {
  //     setChapterViews([])
  //     setTranscriptCueViews([])
  //     setPendingPlaybackIntent(Option.none())
  //   }
  // }, [
  //   episode.chapters,
  //   setChapterViews,
  //   setPendingPlaybackIntent,
  //   setTranscriptCueViews,
  //   episode.transcript,
  // ])
  //
  // React.useEffect(() => {
  //   if (Option.isNone(pendingPlaybackIntent)) {
  //     return
  //   }
  //
  //   if (loadState === "previewing") {
  //     setLoadState("loading")
  //     return
  //   }
  //
  //   if (pendingPlaybackIntent.value.state !== "queued") {
  //     return
  //   }
  //
  //   if (connectionPhase !== "connected") {
  //     return
  //   }
  //
  //   seekTo({
  //     connectionId: episode.id,
  //     seconds: pendingPlaybackIntent.value.seconds,
  //   })
  //
  //   if (pendingPlaybackIntent.value.shouldPlay) {
  //     play(episode.id)
  //   }
  //
  //   setPendingPlaybackIntent(
  //     Option.some({
  //       ...pendingPlaybackIntent.value,
  //       state: "sent",
  //     }),
  //   )
  // }, [
  //   connectionPhase,
  //   loadState,
  //   pendingPlaybackIntent,
  //   play,
  //   episode.id,
  //   seekTo,
  //   setLoadState,
  //   setPendingPlaybackIntent,
  // ])
  //
  // React.useEffect(() => {
  //   if (Option.isNone(pendingPlaybackIntent)) {
  //     return
  //   }
  //
  //   if (connectionPhase !== "connected") {
  //     return
  //   }
  //
  //   if (Math.abs(playerSnapshot.currentTime - pendingPlaybackIntent.value.seconds) > 1) {
  //     return
  //   }
  //
  //   setPendingPlaybackIntent(Option.none())
  // }, [connectionPhase, pendingPlaybackIntent, playerSnapshot.currentTime, setPendingPlaybackIntent])

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="mb-4 lg:mb-0">
          <PodcastVideoEmbed autoplay enableJSApi webp />
          <a
            href="/podcast/"
            className="mt-2 inline-flex items-center gap-1 text-sm text-muted-foreground no-underline transition-colors hover:text-white hover:underline hover:underline-offset-2 lg:mb-6"
          >
            <ArrowLeftIcon className="h-4" />
            <span>All episodes</span>
          </a>
        </div>

        <div className="mb-4 lg:hidden">
          <PodcastGuestCard />
        </div>

        <div className="mb-4 lg:hidden">
          <PodcastChapters />
        </div>

        <div className="mb-6 lg:hidden">
          <PodcastTranscript playerId={episode.id} transcript={episode.transcript} />
        </div>

        {children}
      </div>
      <aside className="top-20 col-span-1 hidden lg:sticky lg:flex lg:h-[calc(100svh-10rem)] lg:max-h-[calc(100svh-10rem)] lg:min-h-0 lg:flex-col lg:self-start">
        <div className="space-y-4 lg:flex-1">
          <PodcastGuestCard />
          <PodcastChapters />
          <PodcastTranscript playerId={episode.id} transcript={episode.transcript} />
        </div>
      </aside>
    </div>
  )
}
