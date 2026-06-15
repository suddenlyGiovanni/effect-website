import { spawn } from "node:child_process"
import { existsSync, mkdirSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

const childScriptUrl = new URL("./twoslash-prewarmer/child.mjs", import.meta.url)
const childScriptPath = fileURLToPath(childScriptUrl)

function runChildProcess(contentDir, cacheDir, tsconfigPath, twoslashOptions) {
  return new Promise((resolve, reject) => {
    const opts = twoslashOptions ?? {}
    const fnFields = Object.keys(opts).filter((k) => typeof opts[k] === "function")
    // Probe each function with neutral args to capture its constant return value.
    // Child process reconstructs stubs from these values so executeOptions stays callable.
    const fnReturnValues = {}
    for (const field of fnFields) {
      try {
        fnReturnValues[field] = opts[field]("", 0, "")
      } catch {
        fnReturnValues[field] = null
      }
    }
    const args = [
      childScriptPath,
      contentDir,
      cacheDir,
      tsconfigPath,
      JSON.stringify(opts),
      JSON.stringify(fnFields),
      JSON.stringify(fnReturnValues),
    ]
    const child = spawn(process.execPath, args, {
      cwd: process.cwd(),
      stdio: ["ignore", "inherit", "inherit"],
      env: { ...process.env, NODE_OPTIONS: process.env.NODE_OPTIONS },
    })
    child.on("error", reject)
    child.on("exit", (code) => {
      if (code === 0) resolve(undefined)
      else reject(new Error(`twoslash-prewarmer child exited with code ${code}`))
    })
  })
}

export function twoslashPrewarmer(options = {}) {
  return {
    name: "twoslash-prewarmer",
    hooks: {
      "astro:config:setup": async () => {
        const cwd = process.cwd()
        const contentDir = options.contentDir ?? join(cwd, "src/content")
        const cacheDir = options.cacheDir ?? join(cwd, ".cache/expressive-code-twoslash")
        const tsconfigPath = options.tsConfigPath ?? join(cwd, "tsconfig.json")

        if (!existsSync(contentDir)) {
          console.log(`twoslash-prewarmer: content dir ${contentDir} missing — skipping`)
          return
        }

        mkdirSync(cacheDir, { recursive: true })
        const start = Date.now()
        console.log(`twoslash-prewarmer: spawning child for prewarm`)
        try {
          await runChildProcess(contentDir, cacheDir, tsconfigPath, options.twoslashOptions)
          console.log(
            `twoslash-prewarmer: child finished in ${((Date.now() - start) / 1000).toFixed(1)}s`,
          )
        } catch (err) {
          console.log(
            `twoslash-prewarmer: child failed: ${err instanceof Error ? err.message : String(err)} — build will compute inline`,
          )
        }
      },
    },
  }
}
