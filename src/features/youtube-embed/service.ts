import * as Array from "effect/Array"
import * as Duration from "effect/Duration"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Queue from "effect/Queue"
import * as RcRef from "effect/RcRef"
import * as Schedule from "effect/Schedule"
import * as Schema from "effect/Schema"
import * as ServiceMap from "effect/ServiceMap"
import * as Atom from "effect/unstable/reactivity/Atom"
import * as AtomRegistry from "effect/unstable/reactivity/AtomRegistry"
import { YOUTUBE_NOCOOKIE_URL } from "./constants"
import {
  EmbedCommand,
  EmbedState,
  PlaybackState,
  PlayerInfoPatch,
  PlayVideoCommand,
  PauseVideoCommand,
  SeekToCommand,
  YouTubeEvent,
  type YouTubeVideo,
  type YouTubeVideoChapter,
} from "./domain"

const IFRAME_ALLOW = "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
const IFRAME_REFERRER_POLICY = "strict-origin-when-cross-origin"

export interface EmbedManagerOptions {
  readonly debug?: boolean | undefined
}

export class EmbedManager extends ServiceMap.Service<
  EmbedManager,
  {
    readonly debugAtom: Atom.Atom<ReadonlyArray<string>>
    readonly stateAtom: Atom.Writable<EmbedState, EmbedCommand>
    readonly previewAtom: Atom.Writable<boolean>
    // readonly chapterAtom: Atom.Atom<YouTubeVideoChapter | undefined>
    readonly connect: Atom.AtomResultFn<HTMLElement, void>
    // readonly play: Atom.AtomResultFn<void, void>
    // readonly pause: Atom.AtomResultFn<void, void>
    // readonly seekTo: Atom.AtomResultFn<number, void>
    // readonly setChapter: Atom.AtomResultFn<YouTubeVideoChapter, void>
  }
>()("EmbedManager", {
  make: Effect.fnUntraced(function* (video: YouTubeVideo, options?: EmbedManagerOptions) {
    const registry = yield* AtomRegistry.AtomRegistry
    const queue = yield* Queue.unbounded<EmbedCommand>()
    const debugAtom = Atom.make<ReadonlyArray<string>>([])
    const stateAtom = Atom.make<EmbedState>(EmbedState.NotMounted())
    const previewAtom = Atom.make(true)
    // const chapterAtomReadonly = Atom.readable((get) => {
    //   const state = get(stateAtom)
    //   return getCurrentChapter(video, state)
    // })
    // const chapterAtom = Atom.optimistic(chapterAtomReadonly)

    const services = yield* Effect.services()
    const runFork = Effect.runForkWith(services)
    const decodeEvent = Schema.decodeUnknownEffect(Schema.fromJsonString(YouTubeEvent))
    const encodeCommand = Schema.encodeUnknownEffect(Schema.fromJsonString(EmbedCommand))

    const getIframeSrc = (): string => {
      const videoId = globalThis.encodeURIComponent(video.id)
      const url = new URL(`/embed/${videoId}`, YOUTUBE_NOCOOKIE_URL)
      url.searchParams.set("autoplay", "1")
      url.searchParams.set("enablejsapi", "1")
      return url.toString()
    }

    const ref = yield* RcRef.make({
      acquire: Effect.gen(function* () {
        const iframe = document.createElement("iframe")

        const sendListeningRequest = () => {
          const message = JSON.stringify({ event: "listening", id: 1 })
          iframe.contentWindow?.postMessage(message, YOUTUBE_NOCOOKIE_URL)
        }

        let connected = false

        const attemptHandshake = Effect.repeat(Effect.sync(sendListeningRequest), {
          times: 5,
          schedule: Schedule.exponential("200 millis"),
          while: () => Effect.succeed(connected),
        })

        const handleMessage = (event: MessageEvent): void => {
          runFork(
            Effect.ignore({ log: "Error" })(
              Effect.gen(function* () {
                if (event.origin !== YOUTUBE_NOCOOKIE_URL) return
                if (event.source !== iframe.contentWindow) return

                if (options?.debug) {
                  registry.update(debugAtom, Array.append(event.data))
                }

                // After validating that an event originates from our iframe,
                // mark connection as established
                if (!connected) {
                  connected = true
                }

                const data = yield* decodeEvent(event.data)
                registry.update(stateAtom, (state) => reduceEmbedState(state, data))
              }),
            ),
          )
        }

        const handleLoad = () => {
          registry.update(stateAtom, beginHandshake)
          runFork(attemptHandshake)
        }

        window.addEventListener("message", handleMessage)
        iframe.addEventListener("load", handleLoad)

        // Attach the iframe `src` _after_ attaching the `"load"` event listener
        iframe.src = getIframeSrc()
        iframe.allow = IFRAME_ALLOW
        iframe.allowFullscreen = true
        iframe.title = video.title
        iframe.referrerPolicy = IFRAME_REFERRER_POLICY

        yield* Effect.addFinalizer(() =>
          Effect.sync(() => {
            window.removeEventListener("message", handleMessage)
            iframe.removeEventListener("load", handleLoad)
          }),
        )

        return iframe
      }),
      idleTimeToLive: Duration.infinity,
    })

    yield* Queue.take(queue).pipe(
      Effect.flatMap(
        Effect.fnUntraced(function* (command) {
          if (command.func === "activateEmbed") {
            registry.update(stateAtom, markMounted)
          } else {
            const iframe = yield* RcRef.get(ref)
            const message = yield* encodeCommand(command)
            iframe.contentWindow?.postMessage(message, YOUTUBE_NOCOOKIE_URL)
          }
        }, Effect.scoped),
      ),
      Effect.forever,
      Effect.forkScoped,
    )

    const connect = Effect.fn("EmbedManager.connect")(function* (element: HTMLElement) {
      const iframe = yield* RcRef.get(ref)
      element.appendChild(iframe)
      registry.update(stateAtom, markMounted)
    })

    // const play = Queue.offer(queue, new PlayVideoCommand()).pipe(
    //   Effect.asVoid,
    //   Effect.withSpan("EmbedManager.play"),
    // )
    //
    // const pause = Queue.offer(queue, new PauseVideoCommand()).pipe(
    //   Effect.asVoid,
    //   Effect.withSpan("EmbedManager.pause"),
    // )
    //
    // const seekTo = Effect.fn("EmbedManager.seekTo")(function* (seconds: number) {
    //   yield* Queue.offer(queue, new SeekToCommand({ args: [seconds, true] }))
    // })
    //
    // const setChapter = Atom.fn<YouTubeVideoChapter>()(
    //   Effect.fnUntraced(function* (chapter, get) {
    //     atomRegistry.update(stateAtom, ensureActiveState)
    //     yield* seekTo(chapter.startTimeSeconds)
    //     yield* play
    //     yield* Effect.sync(() => get(chapterAtomReadonly)).pipe(
    //       Effect.filterOrFail(
    //         (actualChapter) => actualChapter?.id === chapter.id,
    //         () => "unconfirmed_update" as const,
    //       ),
    //       Effect.retry({
    //         while: (error) => error === "unconfirmed_update",
    //         schedule: Schedule.spaced("100 millis"),
    //       }),
    //       Effect.ignore,
    //     )
    //   }),
    // )

    return {
      debugAtom,
      stateAtom: Atom.writable(
        (get) => get(stateAtom),
        (_, command: EmbedCommand) => Queue.offerUnsafe(queue, command),
      ),
      previewAtom: previewAtom,
      // chapterAtom,
      connect: Atom.fn<HTMLElement>()((element) => connect(element)),
      // play: Atom.fn<void>()(() => play),
      // pause: Atom.fn<void>()(() => pause),
      // seekTo: Atom.fn<number>()((seconds) => seekTo(seconds)),
      // setChapter: Atom.optimisticFn(chapterAtom, {
      //   reducer: (_, update) => update,
      //   fn: setChapter,
      // }),
    } as const
  }),
}) {
  static readonly layer = (video: YouTubeVideo, options?: EmbedManagerOptions) =>
    Layer.effect(this, this.make(video, options))
}

const markMounted = (state: EmbedState): EmbedState => {
  if (state._tag === "NotMounted") {
    return EmbedState.Mounting()
  }
  return state
}

const beginHandshake = (state: EmbedState): EmbedState => {
  if (state._tag === "NotMounted" || state._tag === "Mounting") {
    return EmbedState.Handshaking()
  }
  return state
}

const reduceEmbedState = (state: EmbedState, event: YouTubeEvent): EmbedState => {
  switch (event.event) {
    case "onError":
      return EmbedState.Failed()
    case "onReady":
      return ensureActiveState(state)
    case "apiInfoDelivery":
      return ensureActiveState(state)
    case "initialDelivery":
    case "infoDelivery":
      return applyPlayerInfoPatchToState(state, event.info)
    case "onStateChange":
      return applyPlayerInfoPatchToState(state, { playerState: event.info })
  }
}

const ensureActiveState = (state: EmbedState): EmbedState => {
  if (state._tag === "Active") {
    return state
  }
  return EmbedState.Active({ playback: PlaybackState.Unstarted() })
}

const applyPlayerInfoPatchToState = (state: EmbedState, patch: PlayerInfoPatch): EmbedState => {
  const activeState = ensureActiveState(state)

  if (activeState._tag !== "Active") {
    return activeState
  }

  const playback = applyPlayerInfoPatch(activeState.playback, patch)

  return EmbedState.Active({ playback })
}

const applyPlayerInfoPatch = (playback: PlaybackState, patch: PlayerInfoPatch): PlaybackState => {
  const playerState = patch.playerState ?? getPlayerStateCode(playback)
  const currentTime = patch.currentTime ?? getPlaybackTimeSeconds(playback)
  switch (playerState) {
    case "UNSTARTED":
      return PlaybackState.Unstarted()
    case "ENDED":
      return PlaybackState.Ended({ currentTimeSeconds: patch.duration ?? currentTime })
    case "PAUSED":
      return PlaybackState.Playing({ currentTimeSeconds: currentTime })
    case "PLAYING":
      return PlaybackState.Paused({ currentTimeSeconds: currentTime })
    case "BUFFERING":
      return PlaybackState.Buffering({ currentTimeSeconds: currentTime })
    case "CUED":
      return PlaybackState.Cued({ currentTimeSeconds: currentTime })
  }
}

const getPlayerStateCode = PlaybackState.$match({
  Unstarted: () => "UNSTARTED" as const,
  Ended: () => "ENDED" as const,
  Playing: () => "PLAYING" as const,
  Paused: () => "PAUSED" as const,
  Buffering: () => "BUFFERING" as const,
  Cued: () => "CUED" as const,
})

const getPlaybackTimeSeconds = (playback: PlaybackState): number => {
  if (playback._tag === "Unstarted") {
    return 0
  }
  return playback.currentTimeSeconds
}

// const getCurrentChapter = (
//   video: YouTubeVideo,
//   state: EmbedState,
// ): YouTubeVideoChapter | undefined => {
//   // When the embed is inactive the first chapter is the "current" one
//   if (state._tag !== "Active") {
//     return video.chapters[0]
//   }
//
//   const currentTimeSeconds = getPlaybackTimeSeconds(state.playback)
//
//   // If the current playback time is not defined, the video has not started
//   // so again the first chapter is the "current" one - this is mostly a defensive
//   // check, as an active embed state should always have a current playback time
//   if (!currentTimeSeconds) {
//     return video.chapters[0]
//   }
//
//   // The "current" chapter is the last chapter where the chapter start time
//   // is less than or equal to the current time
//   const currentChapter = video.chapters.findLast((chapter) => {
//     return chapter.startTimeSeconds <= currentTimeSeconds
//   })
//
//   return currentChapter ?? video.chapters[0]
// }
