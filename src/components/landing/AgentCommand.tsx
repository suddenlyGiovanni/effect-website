import { useState } from "react";

const AGENT_PROMPT = `Help me build an Effect app in TypeScript. Start by reading https://effect.website/docs/getting-started and follow it exactly: scaffold a fresh TypeScript project, install \`effect\`, create a \`main.ts\` with a simple \`Effect.gen\` program that logs "hello, world", and run it with \`bun run main.ts\` (or the npm/pnpm/yarn equivalent) so I see it execute. Confirm it runs before moving on.

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
- Use \`bun add effect\` (or the npm/pnpm/yarn equivalent).
- Effect v4 is in beta — if I'm using v3, follow the v3 docs; if I'm starting fresh, use v4 from https://effect.website/blog/effect-v4-beta.
- Effect uses \`Effect.gen\` with generators, not async/await — don't try to mix them.`;

const PREVIEW = "Help me build an Effect app in TypeScript…";

export function AgentCommand() {
	const [copied, setCopied] = useState(false);

	const copy = () => {
		navigator.clipboard.writeText(AGENT_PROMPT).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		});
	};

	return (
		<div className="overflow-hidden rounded-md bg-zinc-900/50 p-1 ring-1 ring-zinc-700 ring-inset">
			{/* Header */}
			<div className="flex border-b border-zinc-800">
				<button
					type="button"
					className="group relative flex items-center gap-1.5 px-3 py-2 font-mono text-xs tracking-wider text-white uppercase"
				>
					Prompt for AI agents
					<div className="absolute right-0 bottom-0 left-0 h-px bg-white" />
				</button>
			</div>

			{/* Prompt preview + copy */}
			<button
				type="button"
				onClick={copy}
				className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-2 font-mono text-sm text-zinc-300 transition-colors hover:bg-zinc-800/30"
				aria-label="Copy prompt for AI agents"
			>
				<span className="truncate">{PREVIEW}</span>
				{copied ? (
					<i className="ri-check-line shrink-0 text-base text-zinc-200" />
				) : (
					<i className="ri-file-copy-line shrink-0 text-base text-zinc-400" />
				)}
			</button>
		</div>
	);
}
