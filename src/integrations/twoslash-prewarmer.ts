import type { AstroIntegration } from "astro"
import * as NodeServices from "@effect/platform-node/NodeServices"
import * as NodeWorker from "@effect/platform-node/NodeWorker"
import * as Effect from "effect/Effect"
import * as FileSystem from "effect/FileSystem"
import * as Latch from "effect/Latch"
import * as Option from "effect/Option"
import * as Pool from "effect/Pool"
import * as Queue from "effect/Queue"
import * as Stream from "effect/Stream"
import * as Worker from "effect/unstable/workers/Worker"
import { createHash } from "node:crypto"
import { createRequire } from "node:module"
import os from "node:os"
import nodePath from "node:path"
import { Worker as NodeWorkerThread } from "node:worker_threads"
import ts from "typescript"

export interface TwoslashPrewarmerOptions {
  /**
   * Absolute path to the directory containing content files.
   * @default "<cwd>/src/content"
   */
  contentDir?: string

  /**
   * Cache directory — must match `ecTwoSlash({ cache: { dir } })`.
   * @default "<cwd>/.cache/expressive-code-twoslash"
   */
  cacheDir?: string

  /**
   * Absolute path to the project tsconfig.
   * @default "<cwd>/tsconfig.json"
   */
  tsConfigPath?: string

  /**
   * Options forwarded to `@ec-ts/twoslash` — must match what is passed to `ecTwoSlash()`.
   */
  twoslashOptions?: {
    compilerOptions?: Record<string, unknown>
    [key: string]: unknown
  }

  /**
   * Max parallel workers. Defaults to `os.cpus().length - 1` (min 1).
   */
  workers?: number
}

// Must stay in sync with expressive-code-twoslash's cache/key.ts
const CACHE_SCHEMA_VERSION = 1

type JsonValue = boolean | null | number | string | JsonValue[] | { [key: string]: JsonValue }

function normalizeJson(value: unknown): JsonValue {
  if (
    value === null ||
    typeof value === "boolean" ||
    typeof value === "number" ||
    typeof value === "string"
  )
    return value
  if (typeof value === "bigint") return value.toString()
  if (value === undefined || typeof value === "function" || typeof value === "symbol") return null
  if (Array.isArray(value)) return (value as unknown[]).map(normalizeJson) as JsonValue[]
  if (value instanceof Map)
    return [...value.entries()]
      .map(([entryKey, entryValue]) => ({
        key: String(entryKey),
        value: normalizeJson(entryValue),
      }))
      .sort((left, right) => left.key.localeCompare(right.key)) as JsonValue
  if (value instanceof Set) return [...value.values()].map(normalizeJson) as JsonValue[]
  if (value instanceof Date) return value.toISOString()
  if (typeof value === "object")
    return Object.entries(value!)
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
      .reduce<Record<string, JsonValue>>((accumulator, [propertyKey, propertyValue]) => {
        accumulator[propertyKey] = normalizeJson(propertyValue)
        return accumulator
      }, {})
  return String(value)
}

function computeCacheKey(environment: object, input: object): string {
  return createHash("sha256")
    .update(
      JSON.stringify(
        normalizeJson({ cacheSchemaVersion: CACHE_SCHEMA_VERSION, environment, input }),
      ),
    )
    .digest("hex")
}

function cacheFilePath(directory: string, key: string): string {
  return nodePath.join(directory, key.slice(0, 2), `${key}.json`)
}

interface WorkerResult {
  readonly key: string
  readonly result: unknown | null
  readonly error: string | null
}

interface TwoslashBlock {
  readonly extension: "ts" | "tsx"
  readonly code: string
}

const FENCE_RE = /^```(ts|tsx)\s+twoslash[^\n]*\n([\s\S]*?)^```/gm
// EC's include directive — skip blocks that use it (need sequential resolution)
const INCLUDE_RE = /\/\/\s*@include:/

function blocksFromSource(source: string): ReadonlyArray<TwoslashBlock> {
  const blocks: TwoslashBlock[] = []
  for (const regexMatch of source.matchAll(FENCE_RE)) {
    const extension = regexMatch[1] as "ts" | "tsx" | undefined
    const code = regexMatch[2]
    if (extension && code && !INCLUDE_RE.test(code)) {
      blocks.push({ extension, code })
    }
  }
  return blocks
}

const mdBlockStream = (
  contentDirectory: string,
): Stream.Stream<TwoslashBlock, never, FileSystem.FileSystem> =>
  Stream.fromIterableEffect(
    Effect.gen(function* () {
      const fileSystem = yield* FileSystem.FileSystem
      return yield* fileSystem
        .readDirectory(contentDirectory, { recursive: true })
        .pipe(Effect.orElseSucceed(() => [] as Array<string>))
    }),
  ).pipe(
    Stream.filter((entry) => entry.endsWith(".mdx") || entry.endsWith(".md")),
    Stream.flatMap(
      (entry) =>
        Stream.fromIterableEffect(
          Effect.gen(function* () {
            const fileSystem = yield* FileSystem.FileSystem
            const source = yield* fileSystem
              .readFileString(nodePath.join(contentDirectory, entry))
              .pipe(Effect.orElseSucceed(() => ""))
            return blocksFromSource(source)
          }),
        ),
      { concurrency: 20 },
    ),
  )

const isCacheMiss = (
  cacheDirectory: string,
  key: string,
): Effect.Effect<boolean, never, FileSystem.FileSystem> =>
  Effect.gen(function* () {
    const fileSystem = yield* FileSystem.FileSystem
    const fileExists = yield* fileSystem
      .exists(cacheFilePath(cacheDirectory, key))
      .pipe(Effect.orElseSucceed(() => false))
    return !fileExists
  })

const writeCacheEntry = (
  cacheDirectory: string,
  key: string,
  value: unknown,
): Effect.Effect<void, never, FileSystem.FileSystem> =>
  Effect.gen(function* () {
    const fileSystem = yield* FileSystem.FileSystem
    const targetFilePath = cacheFilePath(cacheDirectory, key)
    const targetSubDirectory = nodePath.dirname(targetFilePath)

    yield* fileSystem.makeDirectory(targetSubDirectory, { recursive: true })
    const temporaryPath = yield* fileSystem.makeTempFile({
      directory: targetSubDirectory,
      suffix: ".tmp",
    })
    yield* fileSystem.writeFileString(temporaryPath, JSON.stringify(value))
    yield* fileSystem.rename(temporaryPath, targetFilePath).pipe(
      // rename can fail on concurrent writes; clean up the temp file in that case
      Effect.matchEffect({
        onFailure: () => fileSystem.remove(temporaryPath, { force: true }).pipe(Effect.ignore),
        onSuccess: () => Effect.succeed(undefined),
      }),
    )
  }).pipe(Effect.ignore({ log: true, message: "twoslash-prewarmer: cache write error" }))

const resolvePackageVersion = (
  cwd: string,
  packageName: string,
): Effect.Effect<Option.Option<string>, never, FileSystem.FileSystem> =>
  Effect.gen(function* () {
    const fileSystem = yield* FileSystem.FileSystem
    const requireFromCwd = createRequire(nodePath.join(cwd, "package.json"))

    let resolvedPackageJsonPath: string | null
    try {
      resolvedPackageJsonPath = requireFromCwd.resolve(`${packageName}/package.json`)
    } catch {
      return Option.none()
    }

    const fileContent = yield* fileSystem
      .readFileString(resolvedPackageJsonPath)
      .pipe(Effect.orElseSucceed(() => ""))

    try {
      const parsed = JSON.parse(fileContent) as Record<string, unknown>
      return typeof parsed["version"] === "string"
        ? Option.some(parsed["version"] as string)
        : Option.none()
    } catch {
      return Option.none()
    }
  })

// One-snippet-at-a-time protocol: init once, process snippets individually.
// Each message in/out is a single snippet so the Pool can load-balance across workers
// without buffering large result arrays in memory.
const WORKER_CODE = /* js */ `
const { parentPort } = require("node:worker_threads")
const path = require("node:path")

async function run() {
  const { createTwoslasher } = await import("@ec-ts/twoslash")
  const ts = (await import("typescript")).default
  let twoslasher = null
  let executeOptions = null

  parentPort.on("message", (message) => {
    if (message[0] === 1) {
      parentPort.close()
      return
    }
    const payload = message[1]

    if (payload.type === "init") {
      const tsLibDirectory = path.dirname(
        ts.getDefaultLibFilePath(payload.executeOptions.compilerOptions || {})
      )
      executeOptions = { ...payload.executeOptions, tsLibDirectory }
      twoslasher = createTwoslasher({})
      parentPort.postMessage([1, { type: "ready" }])
      return
    }

    const { key, code, extension } = payload
    try {
      const result = twoslasher(code, extension, executeOptions)
      parentPort.postMessage([1, { key, result, error: null }])
    } catch (err) {
      parentPort.postMessage([1, { key, result: null, error: err?.message ?? String(err) }])
    }
  })

  parentPort.postMessage([0])
}

run().catch(() => process.exit(1))
`

interface WorkerSnippet {
  readonly key: string
  readonly code: string
  readonly extension: string
}

interface ManagedWorker {
  readonly process: (snippet: WorkerSnippet) => Effect.Effect<WorkerResult>
}

// Spawns one persistent worker and initialises its TS compiler instance.
// The run-loop fiber is scoped to the Pool slot — when the Pool is finalised,
// the fiber is interrupted and the worker thread terminates.
// Pool ensures at most one in-flight snippet per ManagedWorker, so a single
// unbounded queue is safe as the response channel (capacity 1 in practice).
const acquireWorker = (executeOptions: object) =>
  Effect.gen(function* () {
    const workerPlatform = yield* Worker.WorkerPlatform
    const handle = yield* workerPlatform.spawn<{ type: "ready" } | WorkerResult, object>(0)

    const responseQueue = yield* Queue.unbounded<WorkerResult>()
    const readyLatch = yield* Latch.make()

    yield* Effect.forkScoped(
      handle
        .run(
          (output) => {
            const msg = output as { type?: "ready" } & WorkerResult
            return "type" in msg && msg.type === "ready"
              ? readyLatch.open
              : Queue.offer(responseQueue, msg as WorkerResult)
          },
          { onSpawn: handle.send({ type: "init", executeOptions }).pipe(Effect.orDie) },
        )
        .pipe(
          // On worker exit (clean or crash): unblock any waiting readyLatch.await
          // and shut down the response queue so pending Queue.take calls complete.
          Effect.ensuring(Effect.all([readyLatch.open, Queue.shutdown(responseQueue)])),
        ),
    )

    yield* readyLatch.await

    return {
      process: (snippet: WorkerSnippet): Effect.Effect<WorkerResult> =>
        handle.send({ type: "snippet", ...snippet }).pipe(
          Effect.orDie,
          Effect.flatMap(() =>
            Queue.take(responseQueue).pipe(
              // Queue is shut down when the worker exits — surface as an error result
              // so the snippet falls back to inline EC processing instead of hanging.
              Effect.catchCause((cause) =>
                Effect.succeed<WorkerResult>({
                  key: snippet.key,
                  result: null,
                  error: `worker exited unexpectedly: ${cause}`,
                }),
              ),
            ),
          ),
        ),
    } satisfies ManagedWorker
  })

const buildPrewarm = Effect.fn("buildPrewarm")(function* (options: TwoslashPrewarmerOptions) {
  const cwd = process.cwd()
  const contentDirectory = Option.getOrElse(
    Option.fromNullishOr(options.contentDir),
    () => nodePath.join(cwd, "src/content"),
  )
  const cacheDirectory = Option.getOrElse(
    Option.fromNullishOr(options.cacheDir),
    () => nodePath.join(cwd, ".cache/expressive-code-twoslash"),
  )
  const tsconfigPath = Option.getOrElse(
    Option.fromNullishOr(options.tsConfigPath),
    () => nodePath.join(cwd, "tsconfig.json"),
  )
  const workerCount = Math.max(
    1,
    Option.getOrElse(Option.fromNullishOr(options.workers), () => os.cpus().length - 1),
  )

  const [expressiveCodeTwoslashVersionOpt, twoslashVersionOpt] = yield* Effect.all([
    resolvePackageVersion(cwd, "expressive-code-twoslash"),
    resolvePackageVersion(cwd, "@ec-ts/twoslash"),
  ])

  const environment = {
    expressiveCodeTwoslashVersion: Option.getOrUndefined(expressiveCodeTwoslashVersionOpt),
    twoslashVersion: Option.getOrUndefined(twoslashVersionOpt),
    typescriptVersion: ts.version,
  }

  const fileSystem = yield* FileSystem.FileSystem
  const tsConfigSourceOpt = yield* fileSystem
    .readFileString(tsconfigPath)
    .pipe(
      Effect.map(
        (content): Option.Option<string> =>
          content.length > 0 ? Option.some(content) : Option.none(),
      ),
      Effect.orElseSucceed((): Option.Option<string> => Option.none()),
    )

  let baseCompilerOptions: ts.CompilerOptions = {}
  if (Option.isSome(tsConfigSourceOpt)) {
    const parsedConfigFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile)
    if (!parsedConfigFile.error) {
      const parsedConfig = ts.parseJsonConfigFileContent(
        parsedConfigFile.config,
        ts.sys,
        nodePath.dirname(tsconfigPath),
        undefined,
        tsconfigPath,
      )
      baseCompilerOptions = parsedConfig.options
    }
  }

  const tsLibDirectory = nodePath.dirname(ts.getDefaultLibFilePath(baseCompilerOptions))

  const ecDefaultCompilerOptions = {
    moduleResolution: 100, // Bundler
    lib: ["lib.es2022.d.ts", "lib.dom.d.ts", "lib.dom.iterable.d.ts"],
  }

  const twoslashOptionsOpt = Option.fromNullishOr(options.twoslashOptions)
  const twoslashCompilerOptionsOpt = Option.flatMap(twoslashOptionsOpt, (twoslashOpts) =>
    Option.fromNullishOr(twoslashOpts.compilerOptions),
  )

  const executeOptions = {
    tsLibDirectory,
    ...Option.getOrElse(twoslashOptionsOpt, () => ({})),
    compilerOptions: {
      ...ecDefaultCompilerOptions,
      ...Option.getOrElse(twoslashCompilerOptionsOpt, () => ({})),
    },
  }

  const createOptions = {
    trigger: "twoslash",
    instanceConfigs: undefined,
    twoslashOptions: Option.getOrUndefined(twoslashOptionsOpt),
    twoslashVueOptions: undefined,
    twoslashEslintOptions: undefined,
  }

  const pluginContext = {
    resolvedTsConfigPath: tsconfigPath,
    tsConfigSource: Option.getOrElse(tsConfigSourceOpt, () => ""),
  }

  yield* Effect.log("twoslash-prewarmer: scanning content files…")
  const allBlocks = yield* Stream.runCollect(mdBlockStream(contentDirectory))
  yield* Effect.log(`twoslash-prewarmer: found ${allBlocks.length} twoslash blocks`)

  const uniqueSnippetMap = new Map<string, WorkerSnippet>()
  for (const block of allBlocks) {
    const snippetKey = computeCacheKey(environment, {
      code: block.code,
      createOptions,
      extension: block.extension,
      executeOptions,
      pluginContext,
    })
    if (!uniqueSnippetMap.has(snippetKey)) {
      uniqueSnippetMap.set(snippetKey, {
        key: snippetKey,
        code: block.code,
        extension: block.extension,
      })
    }
  }

  const uniqueSnippets = [...uniqueSnippetMap.values()]
  const pendingSnippets = yield* Effect.filter(
    uniqueSnippets,
    (snippet) => isCacheMiss(cacheDirectory, snippet.key),
    { concurrency: 20 },
  )

  if (pendingSnippets.length === 0) {
    yield* Effect.log(
      `twoslash-prewarmer: all ${allBlocks.length} blocks cached — skipping TypeScript`,
    )
    return
  }

  yield* Effect.log(
    `twoslash-prewarmer: ${pendingSnippets.length} cache misses → processing with ${workerCount} workers…`,
  )

  const workerLayer = NodeWorker.layer((_id) => new NodeWorkerThread(WORKER_CODE, { eval: true }))

  const { successCount, errorCount } = yield* Effect.scoped(
    Effect.gen(function* () {
      const pool = yield* Pool.make({ acquire: acquireWorker(executeOptions), size: workerCount })

      return yield* Stream.fromIterable(pendingSnippets).pipe(
        Stream.mapEffect(
          (snippet) =>
            Effect.scoped(
              Pool.get(pool).pipe(Effect.flatMap((worker) => worker.process(snippet))),
            ).pipe(
              Effect.catchCause((cause) =>
                Effect.succeed<WorkerResult>({
                  key: snippet.key,
                  result: null,
                  error: `pool error: ${cause}`,
                }),
              ),
            ),
          { concurrency: workerCount },
        ),
        Stream.tap((result) =>
          result.error !== null
            ? Effect.log(
                `twoslash-prewarmer: snippet error [${result.key.slice(0, 8)}]: ${result.error}`,
              )
            : writeCacheEntry(cacheDirectory, result.key, result.result),
        ),
        Stream.runFold(
          () => ({ successCount: 0, errorCount: 0 }),
          (acc, result) =>
            result.error === null
              ? { ...acc, successCount: acc.successCount + 1 }
              : { ...acc, errorCount: acc.errorCount + 1 },
        ),
      )
    }).pipe(Effect.provide(workerLayer)),
  )

  yield* Effect.log(
    `twoslash-prewarmer: cached ${successCount} blocks with ${workerCount} workers` +
      (errorCount > 0 ? ` (${errorCount} errors — will be processed inline)` : ""),
  )
})

export function twoslashPrewarmer(options: TwoslashPrewarmerOptions = {}): AstroIntegration {
  return {
    name: "twoslash-prewarmer",
    hooks: {
      "astro:build:start": async () => {
        await Effect.runPromise(buildPrewarm(options).pipe(Effect.provide(NodeServices.layer)))
      },
    },
  }
}
