const GOOD_FIT = [
	{
		icon: "ri-checkbox-circle-line",
		text: "Systems that need to be reliable under failure",
	},
	{
		icon: "ri-checkbox-circle-line",
		text: "You want typed errors, not just catch (e: unknown)",
	},
	{
		icon: "ri-checkbox-circle-line",
		text: "You need observability without bolting on logging libraries",
	},
	{
		icon: "ri-checkbox-circle-line",
		text: "Your team values explicit over implicit",
	},
	{
		icon: "ri-checkbox-circle-line",
		text: "You're building AI/agentic systems, APIs, or backend services",
	},
];

const MAYBE_NOT = [
	{
		icon: "ri-close-circle-line",
		text: "Simple CRUD apps with minimal error handling",
	},
	{
		icon: "ri-close-circle-line",
		text: "Your team isn't ready to invest in learning a new paradigm",
	},
	{
		icon: "ri-close-circle-line",
		text: "You need the absolute smallest possible bundle size",
	},
	{
		icon: "ri-close-circle-line",
		text: "You prefer implicit magic over explicit composition",
	},
];

export function TradeoffsSection() {
	return (
		<section className="relative w-full overflow-hidden py-16 md:pt-24 md:pb-16">
			<div className="relative mx-auto w-full max-w-295 px-4">
				{/* Header */}
				<div className="mb-12 max-w-2xl">
					<p className="mb-3 font-mono text-sm font-semibold tracking-wider text-zinc-400 uppercase">
						Honest take
					</p>
					<h2 className="leading-tighter text-2xl font-semibold text-white md:text-4xl">
						Effect isn't for every project
					</h2>
					<p className="mt-4 text-lg text-zinc-400">
						Effect has a learning curve. The syntax feels different at first.
						But developers who push through consistently report: "I can't go
						back."
					</p>
				</div>

				<div className="grid grid-cols-1 gap-8 md:grid-cols-2">
					{/* Good fit */}
					<div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-6">
						<h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-emerald-300">
							<i className="ri-thumb-up-line" />
							Consider Effect when
						</h3>
						<ul className="space-y-3">
							{GOOD_FIT.map((item, index) => (
								<li key={index} className="flex items-start gap-3">
									<i
										className={`${item.icon} mt-0.5 shrink-0 text-emerald-400`}
									/>
									<span className="text-sm text-zinc-300">{item.text}</span>
								</li>
							))}
						</ul>
					</div>

					{/* Maybe not */}
					<div className="rounded-lg border border-zinc-700/50 bg-zinc-900/30 p-6">
						<h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-300">
							<i className="ri-thumb-down-line" />
							Maybe skip Effect if
						</h3>
						<ul className="space-y-3">
							{MAYBE_NOT.map((item, index) => (
								<li key={index} className="flex items-start gap-3">
									<i className={`${item.icon} mt-0.5 shrink-0 text-zinc-400`} />
									<span className="text-sm text-zinc-400">{item.text}</span>
								</li>
							))}
						</ul>
					</div>
				</div>

				{/* Quote */}
				<div className="mt-12 text-center">
					<blockquote className="text-xl text-zinc-300 italic">
						"The learning curve is real. But once it clicks, you wonder how you
						ever wrote TypeScript without it."
					</blockquote>
					<p className="mt-3 text-sm text-zinc-400">
						— Common sentiment from Effect developers
					</p>
				</div>
			</div>
		</section>
	);
}
