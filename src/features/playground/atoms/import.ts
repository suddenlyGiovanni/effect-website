import * as BrowserKeyValueStore from "@effect/platform-browser/BrowserKeyValueStore"
import * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Option from "effect/Option"
import * as Schema from "effect/Schema"
import * as Atom from "effect/unstable/reactivity/Atom"
import { makeFile, Workspace } from "../domain/workspace"
import { WorkspaceCompression } from "../services/compression"
import { ShortenClient } from "../services/shorten"
import { WebContainer } from "../services/webcontainer"
import { hashAtom } from "./location"
import { defaultWorkspace, main, makeDefaultWorkspace, type AtomWorkspaceHandle } from "./workspace"

const runtime = Atom.runtime(Layer.mergeAll(ShortenClient.layer, WorkspaceCompression.layer))

const autoSaveRuntime = Atom.runtime(Layer.mergeAll(WebContainer.layer, WorkspaceCompression.layer))

const codeAtom = Atom.searchParam("code", {
  schema: Schema.StringFromBase64Url.pipe(Schema.check(Schema.isNonEmpty())),
})

export const autoSaveAtom = Atom.family((handle: AtomWorkspaceHandle) =>
  autoSaveRuntime.atom(
    Effect.fnUntraced(function* (get) {
      const workspace = get(handle.workspaceAtom)
      const container = yield* WebContainer
      const compression = yield* WorkspaceCompression
      yield* compression.snapshot(workspace, container.readFileString).pipe(
        Effect.map((snapshot) => {
          const similar =
            snapshot.filePaths.size === defaultWorkspace.filePaths.size &&
            snapshot.findFile("src/main.ts").pipe(
              Option.filter(([file]) => file.initialContent === main.initialContent),
              Option.isSome,
            )
          if (similar) return
          get.set(autoSaveWorkspaceAtom, Option.some(snapshot))
        }),
        Effect.andThen(Effect.sleep("2 seconds")),
        Effect.forever,
        Effect.forkScoped,
      )
    }, Effect.tapCause(Effect.logError)),
  ),
)

export const resetAtom = Atom.fnSync((handle: AtomWorkspaceHandle, get) => {
  const workspace = makeDefaultWorkspace()
  get.set(handle.workspaceAtom, workspace)
  get.set(autoSaveWorkspaceAtom, Option.none())
  get.refresh(importAtom)
})

const autoSaveWorkspaceAtom = Atom.kvs({
  runtime: Atom.runtime(BrowserKeyValueStore.layerLocalStorage),
  key: "workspace-autosave",
  schema: Schema.Option(Workspace),
  defaultValue: Option.none,
})

export const importAtom = runtime.atom(
  Effect.fnUntraced(
    function* (get) {
      const hash = get(hashAtom)
      if (Option.isSome(hash)) {
        const client = yield* ShortenClient
        const compressed = yield* client
          .retrieve({ hash: hash.value })
          .pipe(Effect.flatMap(Effect.fromOption))

        const compression = yield* WorkspaceCompression
        return yield* compression.decompress(compressed)
      }

      const code = get(codeAtom)
      if (Option.isSome(code)) {
        const node = makeFile("main.ts", code.value, false)
        return makeDefaultWorkspace().replaceNode(main, node)
      }

      return yield* new Cause.NoSuchElementError()
    },
    (effect, get) =>
      Effect.catch(effect, () =>
        Effect.succeed(Option.getOrElse(get.once(autoSaveWorkspaceAtom), makeDefaultWorkspace)),
      ),
  ),
)
