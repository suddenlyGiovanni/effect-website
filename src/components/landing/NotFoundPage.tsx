import { motion } from "motion/react"
import { getAssetPath } from "../../utils/assetPath"
import { GridOverlay } from "../GridOverlay"
import { Footer } from "./Footer"
import { Navigation } from "./Navigation"

const codeLines = [
  // Line 0: import { Effect } from "effect"
  <>
    <span className="text-violet-400">import</span>
    <span className="text-zinc-400">{" { "}</span>
    <span className="text-white">Effect</span>
    <span className="text-zinc-400">{" } "}</span>
    <span className="text-violet-400">from</span>
    <span className="text-emerald-400">{' "effect"'}</span>
  </>,
  // Line 1: (empty line)
  null,
  // Line 2: const page = Effect.fail("404: Not Found").pipe(
  <>
    <span className="text-violet-400">const</span>
    <span className="text-zinc-300"> page</span>
    <span className="text-zinc-400">{" = "}</span>
    <span className="text-white">Effect</span>
    <span className="text-zinc-400">.</span>
    <span className="text-zinc-300">fail</span>
    <span className="text-zinc-400">{"("}</span>
    <span className="text-emerald-400">{'"404: Not Found"'}</span>
    <span className="text-zinc-400">{")."}</span>
    <span className="text-zinc-300">pipe</span>
    <span className="text-zinc-400">{"("}</span>
  </>,
  // Line 3:   Effect.catchAll(() => Effect.succeed("/"))
  <>
    <span className="text-zinc-400">{"  "}</span>
    <span className="text-white">Effect</span>
    <span className="text-zinc-400">.</span>
    <span className="text-zinc-300">catchAll</span>
    <span className="text-zinc-400">{"(() => "}</span>
    <span className="text-white">Effect</span>
    <span className="text-zinc-400">.</span>
    <span className="text-zinc-300">succeed</span>
    <span className="text-zinc-400">{"("}</span>
    <span className="text-emerald-400">{'"/"'}</span>
    <span className="text-zinc-400">{"))"}</span>
  </>,
  // Line 4: )
  <>
    <span className="text-zinc-400">{")"}</span>
  </>
]

export function NotFoundPage() {
  return (
    <div className="relative min-h-screen bg-zinc-950 text-white antialiased">
      {/* Dithered background overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect x='0' y='0' width='1' height='1' fill='white'/%3E%3Crect x='2' y='2' width='1' height='1' fill='white'/%3E%3C/svg%3E")`,
          backgroundSize: "4px 4px"
        }}
      />
      {/* Skip Navigation Link */}
      <a
        href="#main-content"
        className="absolute -left-[9999px] z-[999] rounded-br-lg bg-zinc-800 px-6 py-4 font-semibold text-white no-underline focus:top-0 focus:left-0"
      >
        Skip to main content
      </a>

      <Navigation />
      <GridOverlay />

      {/* Vertical border lines container */}
      <div className="pointer-events-none absolute top-0 right-0 bottom-0 left-0 z-[60] hidden lg:block">
        <div className="relative mx-auto h-full w-full max-w-[73.75rem]">
          <div className="absolute top-0 bottom-0 left-0 w-px bg-zinc-800" />
          <div className="absolute top-0 right-0 bottom-0 w-px bg-zinc-800" />
        </div>
      </div>

      {/* Center vertical line - dashed */}
      <div className="pointer-events-none absolute top-0 right-0 bottom-0 left-0 z-0 hidden px-8 lg:block">
        <div className="relative mx-auto h-full w-full max-w-[73.75rem]">
          <div
            className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2"
            style={{
              width: "1px",
              backgroundImage:
                "repeating-linear-gradient(to bottom, rgb(39 39 42) 0px, rgb(39 39 42) 2px, transparent 2px, transparent 4px)"
            }}
          />
        </div>
      </div>

      <main
        id="main-content"
        className="relative z-10 flex min-h-screen items-center pt-24 md:pt-20 pb-8"
      >
        <section className="w-full py-16 md:py-24">
          <div className="mx-auto w-full max-w-[73.75rem] px-4 sm:px-6">
            <div className="flex flex-col items-center gap-10">
              {/* Top: text */}
              <div className="w-full max-w-4xl text-center">
                <p className="mb-3 font-mono text-lg font-semibold tracking-wider text-zinc-400 uppercase">
                  {"// 404"}
                </p>
                <h1 className="text-2xl font-semibold text-white md:text-3xl">
                  Page not found
                </h1>
                <p className="mt-4 text-lg text-zinc-400">
                  This route couldn't be resolved, but we can recover.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <a
                    href={getAssetPath("/")}
                    className="inline-flex items-center gap-2 rounded-md bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 transition-all hover:bg-zinc-100 hover:shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                  >
                    <i className="ri-arrow-left-line text-base" />
                    Back to home
                  </a>
                  <a
                    href="https://effect.website/docs/"
                    className="inline-flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900/50 px-5 py-2.5 text-sm font-medium text-white transition-all hover:border-zinc-500 hover:bg-zinc-800"
                  >
                    <i className="ri-book-2-line text-base" />
                    Read the docs
                  </a>
                </div>
              </div>

              {/* Bottom: code snippet */}
              <div className="w-full max-w-2xl">
                <div className="overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900">
                  <div className="flex items-center gap-1.5 border-b border-zinc-700 px-4 py-2.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#ff5f57" }} />
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#febc2e" }} />
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#28c840" }} />
                    <span className="ml-2 font-mono text-sm text-zinc-400">
                      not-found.ts
                    </span>
                  </div>
                  <pre className="px-4 py-4 font-mono text-sm leading-loose sm:px-5 sm:text-base">
                    {codeLines.map((line, i) => (
                      <motion.div
                        key={`code-line-${i.toString()}`}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.3,
                          delay: 0.3 + i * 0.08,
                          ease: "easeOut"
                        }}
                      >
                        {line ?? "\u00A0"}
                      </motion.div>
                    ))}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
