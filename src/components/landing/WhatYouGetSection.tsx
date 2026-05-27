const FEATURES = [
	{
		icon: "ri-checkbox-circle-line",
		title: "Typed errors",
		description: "Errors as values in your type signature",
	},
	{
		icon: "ri-checkbox-circle-line",
		title: "Dependency injection",
		description: "Services provided at the edge, no decorators",
	},
	{
		icon: "ri-checkbox-circle-line",
		title: "Retries & timeouts",
		description: "Built-in scheduling with exponential backoff",
	},
	{
		icon: "ri-checkbox-circle-line",
		title: "Structured concurrency",
		description: "Fibers with cancellation and cleanup",
	},
	{
		icon: "ri-checkbox-circle-line",
		title: "Resource management",
		description: "Acquire, use, release — guaranteed",
	},
	{
		icon: "ri-checkbox-circle-line",
		title: "OpenTelemetry tracing",
		description: "Full observability, zero config",
	},
	{
		icon: "ri-checkbox-circle-line",
		title: "Schema validation",
		description: "Parse, encode, document — one definition",
	},
	{
		icon: "ri-checkbox-circle-line",
		title: "Testable by default",
		description: "Swap implementations without mocks",
	},
];

const CODE_EXAMPLE = `import { Effect, Schedule } from "effect"

const fetchUser = (id: string) =>
  Effect.gen(function* () {
    const response = yield* Effect.tryPromise({
      try: () => fetch(\`/api/users/\${id}\`),
      catch: () => new NetworkError()
    })

    if (!response.ok) {
      return yield* Effect.fail(new ApiError(response.status))
    }

    return yield* Effect.tryPromise({
      try: () => response.json(),
      catch: () => new ParseError()
    })
  }).pipe(
    Effect.retry(Schedule.exponential("100 millis").pipe(
      Schedule.compose(Schedule.recurs(3))
    )),
    Effect.timeout("5 seconds"),
    Effect.withSpan("fetchUser", { attributes: { userId: id } })
  )

// Type: Effect<User, NetworkError | ApiError | ParseError | TimeoutException, never>`;

export function WhatYouGetSection() {
	return (
		<section className="relative w-full py-24 md:pt-40 md:pb-20">
			<div className="mx-auto w-full max-w-[73.75rem] px-4">
				{/* Header */}
				<div className="mb-12">
					<p className="mb-3 font-mono text-sm font-semibold tracking-wider text-zinc-400 uppercase">
						What You Get
					</p>
					<h2 className="leading-tighter max-w-lg text-2xl font-semibold text-white md:text-3xl">
						Everything you need for production
					</h2>
					<p className="mt-4 max-w-2xl text-lg text-zinc-400">
						One library. No glue code. No framework lock-in.
					</p>
				</div>

				{/* Two column layout */}
				<div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
					{/* Left: Feature checklist */}
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						{FEATURES.map((feature, index) => (
							<div key={index} className="flex items-start gap-3">
								<i
									className={`${feature.icon} mt-0.5 text-lg text-emerald-500`}
								/>
								<div>
									<p className="font-medium text-white">{feature.title}</p>
									<p className="text-sm text-zinc-400">{feature.description}</p>
								</div>
							</div>
						))}
					</div>

					{/* Right: Code example */}
					<div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50">
						<div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900/80 px-4 py-2">
							<div className="flex gap-1.5">
								<div className="h-3 w-3 rounded-full bg-zinc-700" />
								<div className="h-3 w-3 rounded-full bg-zinc-700" />
								<div className="h-3 w-3 rounded-full bg-zinc-700" />
							</div>
							<span className="ml-2 text-xs text-zinc-400">example.ts</span>
						</div>
						<pre className="overflow-x-auto p-4 text-sm">
							<code className="font-mono whitespace-pre text-zinc-300">
								{CODE_EXAMPLE}
							</code>
						</pre>
					</div>
				</div>
			</div>
		</section>
	);
}
