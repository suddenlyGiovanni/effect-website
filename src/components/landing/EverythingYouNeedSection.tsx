const FEATURES = [
	{
		category: "Error Handling",
		items: [
			"Typed errors in the function signature",
			"Short-circuit and collect errors",
			"Automatic retry with backoff",
			"Timeout and interruption",
		],
		icon: "ri-shield-check-line",
	},
	{
		category: "Concurrency",
		items: [
			"Structured concurrency with fibers",
			"Parallel execution with limits",
			"Race conditions handled correctly",
			"Automatic resource cleanup",
		],
		icon: "ri-git-branch-line",
	},
	{
		category: "Dependency Injection",
		items: [
			"Type-safe service definitions",
			"Automatic dependency resolution",
			"Easy mocking for tests",
			"No decorators or reflection",
		],
		icon: "ri-plug-line",
	},
	{
		category: "Observability",
		items: [
			"Built-in OpenTelemetry tracing",
			"Structured logging",
			"Metrics collection",
			"Span context propagation",
		],
		icon: "ri-line-chart-line",
	},
	{
		category: "Schema & Validation",
		items: [
			"Runtime validation from types",
			"Automatic JSON serialization",
			"API contract generation",
			"Form validation support",
		],
		icon: "ri-file-check-line",
	},
	{
		category: "Scheduling",
		items: [
			"Cron-like schedules",
			"Exponential backoff",
			"Jittered retries",
			"Repeat with conditions",
		],
		icon: "ri-time-line",
	},
];

export function EverythingYouNeedSection() {
	return (
		<section className="relative w-full py-24 md:py-40">
			<div className="mx-auto w-full max-w-[73.75rem] px-4">
				{/* Header */}
				<div className="mb-12">
					<p className="mb-3 font-mono text-sm font-medium tracking-wider text-zinc-400 uppercase">
						Everything You Need
					</p>
					<h2 className="leading-tighter max-w-xl text-2xl font-bold text-white md:text-3xl">
						One library. Complete toolkit.
					</h2>
					<p className="mt-5 max-w-[44rem] text-lg leading-relaxed text-zinc-400">
						Stop installing a new package for every problem. Effect includes
						everything you need to build production-grade TypeScript
						applications.
					</p>
				</div>

				{/* Vertical grid table layout */}
				<div className="overflow-hidden rounded-lg border border-zinc-800">
					{/* Header row - category names */}
					<div className="grid grid-cols-2 border-b border-zinc-800 bg-zinc-900/50 md:grid-cols-3 lg:grid-cols-6">
						{FEATURES.map((feature, index) => (
							<div key={index} className="relative px-5 py-4">
								<span className="text-sm font-medium text-white">
									{feature.category}
								</span>
								{index < FEATURES.length - 1 && (
									<div
										className="absolute top-0 right-0 bottom-0 w-px"
										style={{
											backgroundImage:
												"repeating-linear-gradient(to bottom, rgb(39 39 42) 0px, rgb(39 39 42) 2px, transparent 2px, transparent 4px)",
										}}
									/>
								)}
							</div>
						))}
					</div>

					{/* Feature rows - items stacked vertically per column */}
					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
						{FEATURES.map((feature, colIndex) => (
							<div
								key={colIndex}
								className="relative flex flex-col gap-3 py-4 pr-4 pl-3.5"
							>
								{feature.items.map((item, itemIndex) => (
									<div key={itemIndex} className="flex items-start gap-2">
										<i className="ri-check-line shrink-0 text-sm text-emerald-500" />
										<span className="text-sm text-zinc-400">{item}</span>
									</div>
								))}
								{colIndex < FEATURES.length - 1 && (
									<div
										className="absolute top-0 right-0 bottom-0 w-px"
										style={{
											backgroundImage:
												"repeating-linear-gradient(to bottom, rgb(39 39 42) 0px, rgb(39 39 42) 2px, transparent 2px, transparent 4px)",
										}}
									/>
								)}
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
