// Runs as a Node.js worker thread (ES module, compiled via ts.transpileModule at build time).
// Protocol (Effect v4 NodeWorker platform):
//   Inbound:  raw object (no [type,payload] wrapping) | [1] shutdown signal
//   Outbound: [0] ready  |  [1, data] response

import type { CreateTwoslashOptions, TwoslashInstance, TwoslashReturn } from "@ec-ts/twoslash"
import type { CompilerOptions } from "typescript"
import * as nodePath from "node:path"
import { parentPort } from "node:worker_threads"

interface InitMessage {
  readonly type: "init"
  readonly executeOptions: CreateTwoslashOptions
}

interface SnippetMessage {
  readonly key: string
  readonly code: string
  readonly extension: string
}

type ReadyResponse = readonly [1, { readonly type: "ready" }]
type SnippetResponse = readonly [
  1,
  (
    | { readonly key: string; readonly result: TwoslashReturn; readonly error: null }
    | { readonly key: string; readonly result: null; readonly error: string }
  ),
]

async function run() {
  const { createTwoslasher } = await import("@ec-ts/twoslash")
  const ts = (await import("typescript")).default

  let twoslasher: TwoslashInstance | null = null
  let executeOptions: CreateTwoslashOptions | null = null

  parentPort!.on("message", (message: unknown) => {
    // [1] is the graceful-shutdown signal from the Effect v4 NodeWorker layer finalizer
    if (Array.isArray(message)) {
      parentPort!.close()
      return
    }

    if (typeof message !== "object" || message === null) return

    if ("type" in message && (message as { type: unknown }).type === "init") {
      const { executeOptions: opts } = message as InitMessage
      const tsLibDirectory = nodePath.dirname(
        ts.getDefaultLibFilePath((opts.compilerOptions ?? {}) as CompilerOptions),
      )
      executeOptions = { ...opts, tsLibDirectory }
      twoslasher = createTwoslasher({})
      parentPort!.postMessage([1, { type: "ready" }] satisfies ReadyResponse)
      return
    }

    const { key, code, extension } = message as SnippetMessage
    try {
      const result = twoslasher!(code, extension, executeOptions!)
      parentPort!.postMessage([1, { key, result, error: null }] satisfies SnippetResponse)
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err)
      parentPort!.postMessage([1, { key, result: null, error }] satisfies SnippetResponse)
    }
  })

  // Signal ready to the Effect v4 Worker platform
  parentPort!.postMessage([0] as const)
}

run().catch((err: unknown) => {
  process.stderr.write(`twoslash-prewarmer worker error: ${String(err)}\n`)
  process.exit(1)
})
