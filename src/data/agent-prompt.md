Help me build an Effect app in TypeScript. Start by reading https://effect.website/docs/getting-started and follow it exactly: scaffold a fresh TypeScript project, install `effect`, create a `main.ts` with a simple `Effect.gen` program that logs "hello, world", and run it with `bun run main.ts` (or the npm/pnpm/yarn equivalent) so I see it execute. Confirm it runs before moving on.

Then STOP and ASK ME what I want to build. From there, consult only the docs you need for what I asked for — don't march me through every guide.

Guides — foundations, work through whichever parts I haven't touched:
  https://effect.website/docs/getting-started/why-effect      Why Effect
  https://effect.website/docs/error-management/two-error-types Error tracking
  https://effect.website/docs/requirements-management/services Services & dependency injection
  https://effect.website/docs/concurrency/fibers              Concurrency
  https://effect.website/docs/observability/tracing           Observability

For everything else (Schema, Platform, RPC, AI SDK, Cluster), fetch https://effect.website/llms.txt — it's the index of every doc on the site. Use it to look up the specific page you need instead of guessing URLs.

Important:
- Confirm with me before each install or deploy. Don't batch.
- Use `bun add effect` (or the npm/pnpm/yarn equivalent).
- Effect v4 is in beta — if I'm using v3, follow the v3 docs; if I'm starting fresh, use v4 from https://effect.website/blog/effect-v4-beta.
- Effect uses `Effect.gen` with generators, not async/await — don't try to mix them.
