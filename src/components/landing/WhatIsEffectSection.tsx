import { Link } from "@/components/ui";
import { useState } from "react";

export function WhatIsEffectSection() {
	const [hoveredType, setHoveredType] = useState<
		"success" | "error" | "requirements" | null
	>(null);

	return (
		<section className="relative w-full overflow-hidden py-24 md:pt-40 md:pb-24">
			{/* Subtle background gradient */}
			<div
				className="pointer-events-none absolute inset-0"
				style={{
					background:
						"radial-gradient(ellipse 80% 50% at 70% 50%, rgba(139, 92, 246, 0.03) 0%, transparent 60%)",
				}}
			/>

			<div className="relative mx-auto w-full max-w-295 px-4">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-12">
					{/* Left column - Copy */}
					<div>
						<p className="mb-3 font-mono text-sm font-medium tracking-wider text-zinc-400 uppercase">
							// The Mental Model
						</p>
						<h2 className="text-2xl leading-tighter font-semibold text-white md:text-3xl max-w-lg">
							Track successes, errors, dependencies in one type
						</h2>
						<p className="mt-4 text-lg text-zinc-400 max-w-lg">
							The type signature tells you everything. The compiler catches what
							you miss. No more runtime surprises.
						</p>

						<ul className="mt-5 space-y-2 text-sm text-zinc-400">
							<li className="flex items-center gap-2">
								<i className="ri-check-line text-emerald-500" />
								<span>
									No more{" "}
									<code className="text-zinc-300">catch (e: unknown)</code> --
									errors are fully typed
								</span>
							</li>
							<li className="flex items-center gap-2">
								<i className="ri-check-line text-emerald-500" />
								<span>Dependencies are explicit -- nothing is hidden</span>
							</li>
							<li className="flex items-center gap-2">
								<i className="ri-check-line text-emerald-500" />
								<span>
									Async is structured -- no more promise chains you can't follow
								</span>
							</li>
						</ul>

						<Link
							href="https://effect.website/docs/getting-started/why-effect/"
							variant="inline"
							className="group mt-8 inline-flex items-center gap-2 text-base font-medium"
						>
							<span>Why Effect</span>
							<i className="ri-arrow-right-line text-base transition-transform group-hover:translate-x-0.5" />
						</Link>
					</div>

					{/* Right column - Type signature */}
					<div className="flex items-center justify-center">
						<div className="relative w-full max-w-md">
							{/* Subtle glow behind */}
							<div
								className="pointer-events-none absolute -inset-4 rounded-2xl opacity-30 blur-xl"
								style={{
									background:
										"radial-gradient(ellipse at center, rgba(255, 255, 255, 0.2) 0%, transparent 70%)",
								}}
							/>

							{/* Type signature */}
							<div className="group relative w-full border border-zinc-700 bg-zinc-900/50 px-6 py-4 font-mono text-base text-center transition-all hover:border-zinc-500 hover:bg-zinc-800/50">
								<span className="text-white select-all">Effect</span>
								<span className="text-zinc-400">&lt;</span>
								<span
									className={`cursor-pointer transition-opacity text-emerald-400 ${hoveredType && hoveredType !== "success" ? "opacity-50" : "opacity-100"}`}
									onMouseEnter={() => setHoveredType("success")}
									onMouseLeave={() => setHoveredType(null)}
								>
									Success
								</span>
								<span className="text-zinc-400">, </span>
								<span
									className={`cursor-pointer transition-opacity text-red-400 ${hoveredType && hoveredType !== "error" ? "opacity-50" : "opacity-100"}`}
									onMouseEnter={() => setHoveredType("error")}
									onMouseLeave={() => setHoveredType(null)}
								>
									Error
								</span>
								<span className="text-zinc-400">, </span>
								<span
									className={`cursor-pointer transition-opacity text-violet-400 ${hoveredType && hoveredType !== "requirements" ? "opacity-50" : "opacity-100"}`}
									onMouseEnter={() => setHoveredType("requirements")}
									onMouseLeave={() => setHoveredType(null)}
								>
									Requirements
								</span>
								<span className="text-zinc-400">&gt;</span>
							</div>

							{/* Arrows pointing down */}
							<svg
								className="w-full h-8 mt-2"
								viewBox="0 0 400 32"
								fill="none"
								preserveAspectRatio="xMidYMid meet"
							>
								<path
									d="M100 0 L100 16 L67 16 L67 32"
									stroke="rgb(113 113 122)"
									strokeWidth="1"
									strokeOpacity="0.5"
									fill="none"
								/>
								<path
									d="M200 0 L200 32"
									stroke="rgb(113 113 122)"
									strokeWidth="1"
									strokeOpacity="0.5"
									fill="none"
								/>
								<path
									d="M300 0 L300 16 L333 16 L333 32"
									stroke="rgb(113 113 122)"
									strokeWidth="1"
									strokeOpacity="0.5"
									fill="none"
								/>
							</svg>

							{/* Three columns */}
							<div className="grid grid-cols-3 gap-4 text-sm">
								<div
									className={`text-center cursor-pointer transition-opacity ${hoveredType && hoveredType !== "success" ? "opacity-50" : "opacity-100"}`}
									onMouseEnter={() => setHoveredType("success")}
									onMouseLeave={() => setHoveredType(null)}
								>
									<p className="font-medium text-zinc-200">Success</p>
									<p className="text-xs mt-1 text-zinc-400">What it returns</p>
								</div>
								<div
									className={`text-center cursor-pointer transition-opacity ${hoveredType && hoveredType !== "error" ? "opacity-50" : "opacity-100"}`}
									onMouseEnter={() => setHoveredType("error")}
									onMouseLeave={() => setHoveredType(null)}
								>
									<p className="font-medium text-zinc-200">Error</p>
									<p className="text-xs mt-1 text-zinc-400">What can fail</p>
								</div>
								<div
									className={`text-center cursor-pointer transition-opacity ${hoveredType && hoveredType !== "requirements" ? "opacity-50" : "opacity-100"}`}
									onMouseEnter={() => setHoveredType("requirements")}
									onMouseLeave={() => setHoveredType(null)}
								>
									<p className="font-medium text-zinc-200">Requirements</p>
									<p className="text-xs mt-1 text-zinc-400">
										Dependencies needed
									</p>
								</div>
							</div>

							{/* Effect.gen explanation */}
							<div className="mt-8 ring-1 ring-inset ring-zinc-700 bg-zinc-900/50 p-6 font-mono text-sm">
								<div>
									<span className="text-white">Effect</span>
									<span className="text-zinc-400">.</span>
									<span className="text-zinc-300">gen</span>
									<span className="text-zinc-400">(</span>
									<span className="text-violet-400">function*</span>
									<span className="text-zinc-400">() {"{"}</span>
								</div>
								<div className="pl-4 mt-1">
									<span className="text-violet-400">const </span>
									<span className="text-zinc-300">example</span>
									<span className="text-zinc-400"> = </span>
									<span className="text-violet-400">yield* </span>
									<span className="text-zinc-300">someOtherEffect</span>
								</div>
								<div className="mt-1">
									<span className="text-zinc-400">{"})"}</span>
								</div>
								<div className="mt-3 pt-3 border-t border-zinc-800 text-zinc-400 text-xs leading-relaxed">
									<p>
										→ <span className="text-violet-400">yield*</span> gives you
										the <span className="text-zinc-300">Success</span> value
									</p>
									<p>
										→ <span className="text-zinc-300">Errors</span> &{" "}
										<span className="text-zinc-300">dependencies</span> are
										tracked in the parent Effect
									</p>
								</div>
							</div>

							{/* Attribution - centered */}
							<div className="mt-2 text-center">
							<Link
								href="https://effect.website/docs/getting-started/why-effect/"
								variant="subtle"
								className="inline-flex items-center gap-1.5"
							>
								Why Effect was designed this way
								<i className="ri-arrow-right-up-line text-sm" />
							</Link>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
