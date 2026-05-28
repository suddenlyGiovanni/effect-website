import { useEffect, useRef, useState } from "react";

const FEATURES = [
	{
		problem:
			"Try-catch blocks everywhere but you still don't know how things can fail.",
		icon: "ri-shield-check-line",
		title: "Typed Errors",
		description:
			"Errors in the type system. The compiler tells you what can fail.",
		items: [
			"Typed errors in the function signature",
			"Short-circuit and collect errors",
			"Automatic retry with backoff",
		],
	},
	{
		problem: "Another decorator. Another magic string. Another runtime error.",
		icon: "ri-node-tree",
		title: "Dependency Injection",
		description:
			"Services as types, provided at the edge. No decorators, no magic.",
		items: [
			"Type-safe service definitions",
			"Automatic dependency resolution",
			"Easy mocking for tests",
		],
	},
	{
		problem:
			"That Promise.all? It's a time bomb. One failure, everything crashes.",
		icon: "ri-git-branch-line",
		title: "Structured Concurrency",
		description: "Fibers with cleanup, cancellation, and resource management.",
		items: [
			"Structured concurrency with fibers",
			"Parallel execution with limits",
			"Automatic resource cleanup",
		],
	},
	{
		problem: "Network failed? Try again later. But when? How many times?",
		icon: "ri-time-line",
		title: "Scheduling",
		description: "Declarative retry, repeat, and timeout policies.",
		items: ["Cron-like schedules", "Exponential backoff", "Jittered retries"],
	},
	{
		problem: "No observability. Production's on fire. You have no idea why.",
		icon: "ri-line-chart-line",
		title: "Built-in Tracing",
		description: "OpenTelemetry out of the box. Full context, zero setup.",
		items: [
			"Built-in OpenTelemetry tracing",
			"Structured logging",
			"Metrics collection",
		],
	},
	{
		problem:
			"Validation logic is duplicated across every layer of your application.",
		icon: "ri-file-check-line",
		title: "Unified Schema",
		description: "One schema for validation, encoding, and documentation.",
		items: [
			"Runtime validation from types",
			"Automatic JSON serialization",
			"API contract generation",
		],
	},
];

function ComplexityChart() {
	const chartRef = useRef<HTMLDivElement>(null);
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setIsVisible(true);
					observer.disconnect();
				}
			},
			{ threshold: 0.3 },
		);

		if (chartRef.current) {
			observer.observe(chartRef.current);
		}

		return () => observer.disconnect();
	}, []);

	const redDashArray = 500;
	const greenDashArray = 450;

	return (
		<div ref={chartRef} className="relative w-full">
			<div className="relative h-36 md:h-44">
				<svg
					viewBox="0 0 400 140"
					className="h-full w-full"
					preserveAspectRatio="none"
				>
					<defs>
						<linearGradient
							id="redAreaGradient"
							x1="0%"
							y1="0%"
							x2="0%"
							y2="100%"
						>
							<stop offset="0%" stopColor="rgb(239 68 68)" stopOpacity="0.12" />
							<stop offset="100%" stopColor="rgb(239 68 68)" stopOpacity="0" />
						</linearGradient>
						<linearGradient
							id="greenAreaGradient"
							x1="0%"
							y1="0%"
							x2="0%"
							y2="100%"
						>
							<stop
								offset="0%"
								stopColor="rgb(16 185 129)"
								stopOpacity="0.06"
							/>
							<stop offset="100%" stopColor="rgb(16 185 129)" stopOpacity="0" />
						</linearGradient>
					</defs>

					{[0, 35, 70, 105, 140].map((y) => (
						<line
							key={y}
							x1="0"
							y1={y}
							x2="400"
							y2={y}
							stroke="rgb(39 39 42)"
							strokeWidth="1"
							strokeOpacity="0.4"
						/>
					))}

					{/* Area fills */}
					<path
						d="M0,118 C150,115 250,100 400,0 L400,140 L0,140 Z"
						fill="url(#redAreaGradient)"
						className="transition-opacity duration-700"
						style={{
							opacity: isVisible ? 1 : 0,
							transitionDelay: isVisible ? "1.3s" : "0s",
						}}
					/>
					<path
						d="M0,105 C50,105 90,105 125,105 C200,100 300,92 400,85 L400,140 L0,140 Z"
						fill="url(#greenAreaGradient)"
						className="transition-opacity duration-700"
						style={{
							opacity: isVisible ? 1 : 0,
							transitionDelay: isVisible ? "1.6s" : "0s",
						}}
					/>

					{/* Lines */}
					<path
						d="M0,118 C150,115 250,100 400,0"
						fill="none"
						stroke="rgb(239 68 68)"
						strokeWidth="1.5"
						strokeLinecap="round"
						style={{
							strokeDasharray: redDashArray,
							strokeDashoffset: isVisible ? 0 : redDashArray,
							transition: "stroke-dashoffset 1.5s ease-out",
						}}
					/>
					<path
						d="M0,105 C50,105 90,105 125,105 C200,100 300,92 400,85"
						fill="none"
						stroke="rgb(16 185 129)"
						strokeWidth="1.5"
						strokeLinecap="round"
						style={{
							strokeDasharray: greenDashArray,
							strokeDashoffset: isVisible ? 0 : greenDashArray,
							transition: "stroke-dashoffset 1.8s ease-out 0.2s",
						}}
					/>
				</svg>
			</div>

			<div className="mt-3 flex justify-between">
				<span className="font-mono text-[10px] tracking-wide text-zinc-400/75 uppercase">
					Start
				</span>
				<span className="font-mono text-[10px] tracking-wide text-zinc-400/75 uppercase">
					Scale
				</span>
			</div>

			<div className="mt-5 flex items-center justify-center gap-6">
				<span className="font-mono text-xs tracking-wider text-zinc-400 uppercase">
					Complexity at scale:
				</span>
				<div className="flex items-center gap-1.5">
					<div className="h-1.5 w-1.5 rounded-full bg-red-500" />
					<span className="font-mono text-xs text-zinc-400 uppercase">
						Without Effect
					</span>
				</div>
				<div className="flex items-center gap-1.5">
					<div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
					<span className="font-mono text-xs text-zinc-400 uppercase">
						With Effect
					</span>
				</div>
			</div>
		</div>
	);
}

export function ProblemSection() {
	return (
		<section className="relative w-full py-24 md:pt-40 md:pb-24">
			<div
				className="pointer-events-none absolute inset-x-0 top-0 h-32"
				style={{
					background:
						"linear-gradient(to bottom, #09090b 0%, transparent 100%)",
				}}
			/>

			<div className="relative mx-auto w-full max-w-[73.75rem] px-4">
				{/* Top row - Header + Chart */}
				<div className="mb-16 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-8">
					<div>
						<p className="mb-3 font-mono text-sm font-medium tracking-wider text-zinc-400 uppercase">
							// What Effect Solves
						</p>
						<h2 className="leading-tighter max-w-md text-2xl font-semibold text-white md:text-3xl">
							Built-in solutions for the hard problems
						</h2>
					</div>

					<div className="flex flex-col justify-center">
						<ComplexityChart />
					</div>
				</div>

				{/* Feature cards */}
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{FEATURES.map((feature, index) => (
						<div
							key={index}
							className="flex flex-col border border-zinc-700 bg-zinc-950 p-7"
						>
							<p className="text-base font-medium text-zinc-400">{feature.problem}</p>
							{/* Arrow connector */}
							<div className="my-4 flex items-center gap-2">
								<div className="h-px flex-1 bg-zinc-700" />
								<i className="ri-arrow-down-line text-sm text-white" />
								<div className="h-px flex-1 bg-zinc-700" />
							</div>
							<h3 className="flex items-center gap-2 font-mono text-base font-medium text-white uppercase">
								<div className="flex h-6 w-6 shrink-0 items-center justify-center bg-zinc-800">
									<i className={`${feature.icon} text-sm text-zinc-200`} />
								</div>
								{feature.title}
							</h3>
							{/* Checkmark items */}
							<div className="mt-3 flex flex-col gap-1">
								{feature.items.map((item, itemIndex) => (
									<div key={itemIndex} className="flex items-start gap-3">
										<i className="ri-check-line shrink-0 pl-1 text-sm text-emerald-500" />
										<span className="text-sm text-zinc-400">{item}</span>
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
