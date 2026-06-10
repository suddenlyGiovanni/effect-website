import type { AstroIntegration } from "astro"
import * as NodeServices from "@effect/platform-node/NodeServices"
import * as Data from "effect/Data"
import * as Effect from "effect/Effect"
import * as FileSystem from "effect/FileSystem"
import * as Option from "effect/Option"
import * as Schema from "effect/Schema"
import * as Stream from "effect/Stream"
import { createHash } from "node:crypto"
import { createRequire } from "node:module"
import os from "node:os"
import nodePath from "node:path"
import { Worker } from "node:worker_threads"
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

class WorkerError extends Data.TaggedError("WorkerError")<{ message: string }> {}

const WorkerResult = Schema.Struct({
  key: Schema.String,
  result: Schema.NullOr(Schema.Unknown),
  error: Schema.NullOr(Schema.String),
})
type WorkerResult = Schema.Schema.Type<typeof WorkerResult>

const WorkerResultArray = Schema.Array(WorkerResult)

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

const WORKER_CODE = /* js */ `
const { workerData, parentPort } = require("node:worker_threads")
const path = require("node:path")

async function run() {
  const { createTwoslasher } = await import("@ec-ts/twoslash")
  const ts = (await import("typescript")).default

  const { snippets, executeOptions: baseExecuteOptions } = workerData

  // Each worker resolves tsLibDirectory from its own TypeScript install
  const tsLibDirectory = path.dirname(ts.getDefaultLibFilePath(baseExecuteOptions.compilerOptions || {}))
  const executeOptions = { ...baseExecuteOptions, tsLibDirectory }

  const twoslasher = createTwoslasher({})
  const results = []

  for (const { key, code, extension } of snippets) {
    try {
      const result = await twoslasher(code, extension, executeOptions)
      results.push({ key, result, error: null })
    } catch (err) {
      results.push({ key, result: null, error: err?.message ?? String(err) })
    }
  }

  parentPort?.postMessage(results)
}

run().catch(err => parentPort?.postMessage([{ key: "__worker_error__", result: null, error: err?.message }]))
`

interface WorkerSnippet {
  readonly key: string
  readonly code: string
  readonly extension: string
}

// Effect.scoped as a post-processor automatically closes the scope (and terminates
// the worker) on every call, eliminating the need for Effect.scoped at call sites.
const runWorkerChunk = Effect.fn("runWorkerChunk")(function* (
  snippets: ReadonlyArray<WorkerSnippet>,
  executeOptions: object,
) {
  const workerInstance = yield* Effect.acquireRelease(
    Effect.sync(
      () => new Worker(WORKER_CODE, { eval: true, workerData: { snippets, executeOptions } }),
    ),
    (worker) =>
      Effect.sync(() => {
        worker.terminate()
      }),
  )

  const rawMessage = yield* Effect.tryPromise({
    try: () =>
      new Promise<unknown>((resolve, reject) => {
        workerInstance.on("message", resolve)
        workerInstance.on("error", reject)
        workerInstance.on("exit", (exitCode) => {
          if (exitCode !== 0) reject(new Error(`Worker exited with code ${exitCode}`))
        })
      }),
    catch: (caughtError) =>
      new WorkerError({
        message: caughtError instanceof Error ? caughtError.message : String(caughtError),
      }),
  })

  return yield* Schema.decodeUnknownEffect(WorkerResultArray)(rawMessage).pipe(
    Effect.orElseSucceed(() => [] as ReadonlyArray<WorkerResult>),
  )
}, Effect.scoped)

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

  const chunkSize = Math.ceil(pendingSnippets.length / workerCount)
  const snippetChunks: Array<ReadonlyArray<WorkerSnippet>> = []
  for (let chunkIndex = 0; chunkIndex < pendingSnippets.length; chunkIndex += chunkSize) {
    snippetChunks.push(pendingSnippets.slice(chunkIndex, chunkIndex + chunkSize))
  }

  const workerResultBatches = yield* Effect.all(
    snippetChunks.map((snippetChunk) =>
      runWorkerChunk(snippetChunk, executeOptions).pipe(
        Effect.catchTag("WorkerError", (workerError) =>
          Effect.gen(function* () {
            yield* Effect.log(`twoslash-prewarmer: worker error: ${workerError.message}`)
            return [] as ReadonlyArray<WorkerResult>
          }),
        ),
      ),
    ),
    { concurrency: "unbounded" },
  )

  const allWorkerResults = workerResultBatches.flat()
  const successfulResults = allWorkerResults.filter(
    (workerResult): workerResult is WorkerResult & { result: unknown } =>
      workerResult.error === null && workerResult.result !== null,
  )
  const errorCount = allWorkerResults.length - successfulResults.length

  yield* Effect.all(
    successfulResults.map((workerResult) =>
      writeCacheEntry(cacheDirectory, workerResult.key, workerResult.result),
    ),
    { concurrency: 10 },
  )

  yield* Effect.log(
    `twoslash-prewarmer: cached ${successfulResults.length} blocks across ${workerCount} workers` +
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
