export function TransitionSection() {
	return (
		<section className="relative w-full overflow-hidden pt-12 md:pt-20">
			{/* Grid background - vertical lines */}
			<div
				className="pointer-events-none absolute inset-0"
				style={{
					backgroundImage:
						"linear-gradient(to right, rgba(24, 24, 27, 0.8) 1px, transparent 1px)",
					backgroundSize: "196.6px 100%",
					backgroundPosition: "calc(50% + 97px) 0",
				}}
			/>
			{/* Horizontal line in middle - constrained to max-w-295 */}
			<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
				<div
					className="w-full max-w-295 h-px"
					style={{
						backgroundColor: "rgba(24, 24, 27, 0.8)",
					}}
				/>
			</div>

			<div className="relative mx-auto w-full max-w-295 px-4">
				<div className="text-center max-w-[48rem] mx-auto">
					<p className="font-mono uppercase text-lg text-zinc-200">
						Effect gives TypeScript the missing pieces
					</p>
					<p className="font-mono uppercase text-base text-zinc-300 mt-2">
						structured concurrency · typed errors · observability · Dependency
						Injection
					</p>
				</div>

				{/* Dashed line connector */}
				<div
					className="mt-12 md:mt-16 h-px"
					style={{
						backgroundImage:
							"repeating-linear-gradient(to right, rgb(39 39 42) 0px, rgb(39 39 42) 2px, transparent 2px, transparent 4px)",
					}}
				/>
			</div>
		</section>
	);
}
