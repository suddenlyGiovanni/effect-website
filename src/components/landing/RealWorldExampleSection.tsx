import { useState } from "react";

const CODE_EXAMPLE = `import { Effect, Schedule } from "effect"

const processOrder = Effect.gen(function* () {
  // 1. Validate the order
  const order = yield* validateOrder(input)

  // 2. Charge payment (retry 3x with exponential backoff)
  const payment = yield* chargePayment(order).pipe(
    Effect.retry(
      Schedule.exponential("100 millis").pipe(
        Schedule.compose(Schedule.recurs(3))
      )
    ),
    Effect.timeout("10 seconds")
  )

  // 3. Send confirmation (don't fail the order if email fails)
  yield* sendConfirmation(order, payment).pipe(
    Effect.catchAll(() => Effect.logWarning("Email failed"))
  )

  return { orderId: order.id, paymentId: payment.id }
})

// Run with full observability
await processOrder.pipe(
  Effect.withSpan("process-order"),
  Effect.provide(Live),
  Effect.runPromise
)`;

const ANNOTATIONS = [
	{
		lineStart: 4,
		lineEnd: 5,
		title: "Type-safe validation",
		description:
			"Validation errors are typed. If it fails, the type tells you exactly what went wrong.",
	},
	{
		lineStart: 8,
		lineEnd: 15,
		title: "Automatic retries with backoff",
		description:
			"3 retries with exponential backoff, plus a 10-second timeout. All declarative, all composable.",
	},
	{
		lineStart: 18,
		lineEnd: 20,
		title: "Graceful degradation",
		description:
			"If the email fails, log a warning but don't fail the order. Error recovery is explicit.",
	},
	{
		lineStart: 26,
		lineEnd: 30,
		title: "Built-in observability",
		description:
			"Every operation is traced with withSpan. Full visibility in your observability platform.",
	},
];

export function RealWorldExampleSection() {
	const [activeAnnotation, setActiveAnnotation] = useState<number | null>(null);

	return (
		<section className="relative w-full overflow-hidden py-16 md:pt-32 md:pb-8">
			<div className="relative mx-auto w-full max-w-295 px-4">
				{/* Header */}
				<div className="mb-12 max-w-[40rem]">
					<p className="mb-3 font-mono text-sm font-semibold tracking-wider text-zinc-400 uppercase">
						Real-world code
					</p>
					<h2 className="leading-tighter text-2xl font-semibold text-white md:text-3xl">
						Process payments with retries, timeouts, and full observability
					</h2>
					<p className="mt-4 text-lg text-zinc-400">
						Every step is typed. Every failure is visible.
					</p>
				</div>

				<div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
					{/* Code block - takes 2 columns */}
					<div className="lg:col-span-2">
						<div className="overflow-hidden rounded-md border border-zinc-700 bg-zinc-900">
							{/* Code header */}
							<div className="flex items-center justify-between border-b border-zinc-700 px-4 py-3">
								<span className="font-mono text-xs text-zinc-400">
									process-order.ts
								</span>
								<div className="flex items-center gap-2 text-xs text-zinc-400">
									<span className="flex items-center gap-1">
										<i className="ri-checkbox-circle-line text-emerald-400" />
										Typed errors
									</span>
									<span className="flex items-center gap-1">
										<i className="ri-checkbox-circle-line text-emerald-400" />
										Retries
									</span>
									<span className="flex items-center gap-1">
										<i className="ri-checkbox-circle-line text-emerald-400" />
										Tracing
									</span>
								</div>
							</div>

							{/* Code content */}
							<div className="overflow-x-auto p-5">
								<pre className="font-mono text-[13px] leading-relaxed">
									<code className="text-zinc-300">
										{CODE_EXAMPLE.split("\n").map((line: string, i: number) => {
											const lineNum = i + 1;
											const isHighlighted =
												activeAnnotation !== null &&
												lineNum >= ANNOTATIONS[activeAnnotation].lineStart &&
												lineNum <= ANNOTATIONS[activeAnnotation].lineEnd;

											return (
												<div
													key={i}
													className={`flex transition-colors ${isHighlighted ? "bg-violet-500/10" : ""}`}
												>
													<span className="w-6 pr-3 text-right text-zinc-600 select-none">
														{lineNum}
													</span>
													<span>{highlightLine(line)}</span>
												</div>
											);
										})}
									</code>
								</pre>
							</div>
						</div>
					</div>

					{/* Annotations - takes 1 column */}
					<div className="flex flex-col gap-3">
						<p className="mb-2 font-mono text-sm text-zinc-400">
							Hover to explore
						</p>
						{ANNOTATIONS.map((annotation, index) => (
							<button
								key={index}
								type="button"
								onMouseEnter={() => setActiveAnnotation(index)}
								onMouseLeave={() => setActiveAnnotation(null)}
								className={`rounded-lg border p-4 text-left transition-all ${
									activeAnnotation === index
										? "border-violet-500/50 bg-violet-500/10"
										: "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
								}`}
							>
								<div className="mb-1 flex items-center gap-2">
									<span className="font-mono text-xs text-zinc-400">
										L{annotation.lineStart}-{annotation.lineEnd}
									</span>
								</div>
								<h4 className="text-sm font-semibold text-zinc-200">
									{annotation.title}
								</h4>
								<p className="mt-1 text-sm text-zinc-400">
									{annotation.description}
								</p>
							</button>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}

// Simple syntax highlighting
function highlightLine(line: string): React.ReactNode {
	// Comments
	if (line.trim().startsWith("//")) {
		return <span className="text-zinc-400 italic">{line}</span>;
	}

	const parts: React.ReactNode[] = [];
	const stringPattern = /(["'`][^"'`]*["'`])/g;
	const segments = line.split(stringPattern);

	segments.forEach((segment, i) => {
		if (
			segment.startsWith('"') ||
			segment.startsWith("'") ||
			segment.startsWith("`")
		) {
			parts.push(
				<span key={i} className="text-emerald-400">
					{segment}
				</span>,
			);
		} else {
			const keywords = [
				"const",
				"await",
				"import",
				"from",
				"new",
				"return",
				"function",
			];
			let remaining = segment;

			keywords.forEach((kw) => {
				const regex = new RegExp(`\\b(${kw})\\b`, "g");
				remaining = remaining.replace(regex, `<<<KW_${kw}>>>`);
			});

			const kwSegments = remaining.split(/(<<<KW_[^>]+>>>)/g);
			kwSegments.forEach((seg, j) => {
				const kwMatch = seg.match(/<<<KW_([^>]+)>>>/);
				if (kwMatch) {
					parts.push(
						<span key={`${i}-${j}`} className="text-violet-400">
							{kwMatch[1]}
						</span>,
					);
				} else {
					parts.push(<span key={`${i}-${j}`}>{seg}</span>);
				}
			});
		}
	});

	return <>{parts}</>;
}
