// Standalone Node script run as a child process by twoslash-prewarmer.ts.
// Plain JS to avoid any TS loader requirements in the child.

import { createHash } from "node:crypto"
import { existsSync, readFileSync, writeFileSync, mkdirSync, renameSync, readdirSync, statSync } from "node:fs"
import { join, dirname } from "node:path"
import { createTwoslasher } from "@ec-ts/twoslash"
import ts from "typescript"
import {
  createTwoslashCacheKey,
  getTwoslashCacheEnvironment,
  instanceConfigsDefaults,
  twoslashEslintDefaults,
} from "expressive-code-twoslash"

// Captures fences at any indentation level (MDX list items indent code blocks).
// "twoslash" can appear anywhere in the meta (e.g. "```ts {10,16} twoslash").
// Group 1: leading indent, Group 2: language, Group 3: raw code (with indent prefix on each line).
const FENCE_RE = /^([ \t]*)```(ts|tsx)\b[^\n]*\btwoslash\b[^\n]*\n([\s\S]*?)^\1```/gm
const INCLUDE_RE = /\/\/\s*@include:/

function blocksFromSource(source) {
  const blocks = []
  for (const m of source.matchAll(FENCE_RE)) {
    const indent = m[1]
    const extension = m[2]
    let code = m[3]
    // Remark strips the common indentation, trailing whitespace on each line, and the
    // trailing newline before the closing fence.
    const splitLines = code.split("\n")
    code = splitLines
      .map((l) => {
        const stripped = indent && l.startsWith(indent) ? l.slice(indent.length) : l
        return stripped.trimEnd()
      })
      .join("\n")
      .replace(/\n$/, "")
    if (extension && code && !INCLUDE_RE.test(code)) {
      blocks.push({ extension, code })
    }
  }
  return blocks
}

function collectBlocks(contentDir) {
  const blocks = []
  function walk(dir) {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      const st = statSync(full)
      if (st.isDirectory()) {
        walk(full)
      } else if (entry.endsWith(".mdx") || entry.endsWith(".md")) {
        const source = readFileSync(full, "utf8")
        blocks.push(...blocksFromSource(source))
      }
    }
  }
  walk(contentDir)
  return blocks
}

function cacheFilePath(directory, key) {
  return join(directory, key.slice(0, 2), `${key}.json`)
}

const cwd = process.cwd()
const contentDir = process.argv[2] ?? join(cwd, "src/content")
const cacheDir = process.argv[3] ?? join(cwd, ".cache/expressive-code-twoslash")
const tsconfigPath = process.argv[4] ?? join(cwd, "tsconfig.json")
const twoslashOptionsJson = process.argv[5]
// argv[6]: JSON list of function field names that were dropped by JSON.stringify
const fnFieldsJson = process.argv[6]
// argv[7]: JSON map of field → probed return value (used to rebuild callable stubs)
const fnReturnValuesJson = process.argv[7]

let rawTwoslashOptions = twoslashOptionsJson ? JSON.parse(twoslashOptionsJson) : {}

const fnFields = fnFieldsJson ? JSON.parse(fnFieldsJson) : []
const fnReturnValues = fnReturnValuesJson ? JSON.parse(fnReturnValuesJson) : {}

// Restore function fields as null so normalizeJson produces the same output as ec-twoslash,
// which has the actual function values (they both normalize to null).
for (const field of fnFields) {
  if (!(field in rawTwoslashOptions)) {
    rawTwoslashOptions[field] = null
  }
}

// ec-twoslash only applies checkForCustomTagsAndMerge when twoslashOptions is undefined (JS destructuring
// default). When the user provides twoslashOptions (our case), the raw options are used directly.
const twoslashOptions = rawTwoslashOptions

const environment = getTwoslashCacheEnvironment()

let baseCompilerOptions = {}
let tsConfigSource = ""
try {
  tsConfigSource = readFileSync(tsconfigPath, "utf8")
  const parsedConfigFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile)
  if (!parsedConfigFile.error) {
    const parsedConfig = ts.parseJsonConfigFileContent(parsedConfigFile.config, ts.sys, dirname(tsconfigPath), undefined, tsconfigPath)
    baseCompilerOptions = parsedConfig.options
  }
} catch {}

const tsLibDirectory = dirname(ts.getDefaultLibFilePath(baseCompilerOptions))

const ecDefaultCompilerOptions = {
  moduleResolution: 100,
  lib: ["lib.es2022.d.ts", "lib.dom.d.ts", "lib.dom.iterable.d.ts"],
}

const executeOptions = {
  tsLibDirectory,
  ...twoslashOptions,
  compilerOptions: {
    ...ecDefaultCompilerOptions,
    ...twoslashOptions?.compilerOptions ?? {},
  },
}

// Restore callable stubs for function fields — null would throw when @ec-ts/twoslash calls them.
// Return values were probed in the parent process before JSON serialization dropped the functions.
for (const field of fnFields) {
  const retVal = fnReturnValues[field]
  executeOptions[field] = () => retVal
}

// Must match exactly what ec-twoslash passes to twoslashCache.getOrCompute:
//   { code, createOptions, extension, executeOptions, pluginContext }
// Any divergence → different hash → cache miss.
const createOptions = {
  trigger: "twoslash",         // ec-twoslash passes the key string, not a RegExp
  instanceConfigs: instanceConfigsDefaults,
  twoslashOptions,
  twoslashVueOptions: undefined,
  twoslashEslintOptions: twoslashEslintDefaults,
}

const pluginContext = {
  resolvedTsConfigPath: tsconfigPath,
  tsConfigSource,
}

function buildCacheKey(code, extension) {
  return createTwoslashCacheKey(environment, {
    code,
    createOptions,
    extension,
    executeOptions,
    pluginContext,
    fingerprint: undefined,
  })
}

const allBlocks = collectBlocks(contentDir)
process.stdout.write(`twoslash-prewarmer: found ${allBlocks.length} twoslash blocks\n`)

const uniqueSnippetMap = new Map()
for (const block of allBlocks) {
  const key = buildCacheKey(block.code, block.extension)
  if (!uniqueSnippetMap.has(key)) {
    uniqueSnippetMap.set(key, { key, code: block.code, extension: block.extension })
  }
}

const pending = []
for (const snippet of uniqueSnippetMap.values()) {
  if (!existsSync(cacheFilePath(cacheDir, snippet.key))) {
    pending.push(snippet)
  }
}

if (pending.length === 0) {
  process.stdout.write(`twoslash-prewarmer: all ${allBlocks.length} blocks cached — skipping TypeScript\n`)
  process.exit(0)
}

process.stdout.write(`twoslash-prewarmer: ${pending.length} cache misses → processing…\n`)

const sharedCache = new Map()
const sharedTwoslasher = createTwoslasher({ cache: sharedCache })

let successCount = 0
let errorCount = 0
for (const snippet of pending) {
  try {
    const result = sharedTwoslasher(snippet.code, snippet.extension, executeOptions)
    const filePath = cacheFilePath(cacheDir, snippet.key)
    const subdir = dirname(filePath)
    mkdirSync(subdir, { recursive: true })
    const tempPath = join(subdir, `${snippet.key}.tmp`)
    writeFileSync(tempPath, JSON.stringify(result))
    renameSync(tempPath, filePath)
    successCount++
    if (successCount % 50 === 0) {
      process.stdout.write(`twoslash-prewarmer: progress ${successCount}/${pending.length}\n`)
    }
  } catch (err) {
    process.stdout.write(`twoslash-prewarmer: snippet error [${snippet.key.slice(0, 8)}]: ${err instanceof Error ? err.message : String(err)}\n`)
    errorCount++
  }
}

process.stdout.write(`twoslash-prewarmer: cached ${successCount} blocks` + (errorCount > 0 ? ` (${errorCount} errors — will be processed inline)` : "") + "\n")
const mu = process.memoryUsage()
process.stdout.write(`twoslash-prewarmer: child peak rss=${(mu.rss / 1024 / 1024).toFixed(0)}MB heapUsed=${(mu.heapUsed / 1024 / 1024).toFixed(0)}MB\n`)
process.exit(0)
