import { Button } from "@/components/ui";
import { getAssetPath } from "../../utils/assetPath";

export function AISection() {
	return (
		<section className="relative w-full overflow-hidden py-24 md:pt-40 md:pb-24">
			{/* Subtle gradient background */}
			<div className="absolute inset-0 bg-gradient-to-b from-zinc-950/0 via-zinc-950/0 to-zinc-900/50" />

			<div className="relative mx-auto w-full max-w-[73.75rem]">
				{/* Header row - Two columns: heading left, tweet right */}
				<div className="mb-20 grid grid-cols-1 gap-6 px-4 lg:grid-cols-2 lg:items-start">
					{/* Left column - Heading section */}
					<div>
						<p className="mb-3 font-mono text-sm font-medium tracking-wider text-zinc-400 uppercase">
							// LLMs ❤️ Effect
						</p>
						<h2 className="leading-tighter max-w-2xl text-2xl font-semibold text-white md:text-3xl">
							Write Effect code with AI
						</h2>
						<p className="mt-4 max-w-lg text-lg leading-snug text-zinc-400">
							Effect's declarative patterns and strong type system make it
							easier for LLMs to generate correct, production-ready code.
						</p>
					<Button
						href="https://www.effect.solutions/"
						variant="secondary"
						className="mt-6 inline-flex items-center gap-2"
					>
						Quick start LLM guide
						<i className="ri-arrow-right-up-line text-base" />
					</Button>
					</div>

					{/* Right column - Tweet card */}
					<a
						href="https://x.com/davis7/status/1988847914538672262"
						target="_blank"
						rel="noopener noreferrer"
						className="block rounded-lg border border-zinc-700/70 bg-zinc-900 p-5 transition-colors hover:border-zinc-700/80 hover:bg-zinc-900/60"
					>
						{/* Author row */}
						<div className="mb-4 flex items-center justify-between">
							<div className="flex items-center gap-3">
								<img
									src={getAssetPath("/assets/images/bendavis.jpg")}
									alt="Ben Davis"
									className="h-10 w-10 rounded-full object-cover"
								/>
								<div>
									<div className="text-sm font-medium text-white">
										Ben Davis
									</div>
									<div className="text-xs text-zinc-400">@davis7</div>
								</div>
							</div>
							<i className="ri-twitter-x-line text-white" />
						</div>
						{/* Quote */}
						<p className="text-sm leading-relaxed text-zinc-300">
							<span className="text-zinc-400">@MichaelArnaldi</span> suggested
							cloning the effect repo as a git subtree, giving it to Claude,
							then using that as docs. It sounds absurd, but it's actually kind
							amazing...
						</p>
						<span className="mt-3 inline-flex items-center gap-1 text-xs text-zinc-400">
							Full post <i className="ri-arrow-right-up-line" />
						</span>
					</a>
				</div>

				{/* Features - 1x4 grid */}
				<div className="px-4">
					<div className="grid grid-cols-1 gap-6 md:grid-cols-4">
						<div className="flex flex-col gap-2">
							<span className="font-mono text-sm text-zinc-400">01</span>
							<p className="text-base leading-relaxed text-zinc-400">
								<span className="font-medium text-white">
									Predictable structure:
								</span>{" "}
								every operation follows a declarative pattern, no guesswork for
								LLMs.
							</p>
						</div>
						<div className="flex flex-col gap-2">
							<span className="font-mono text-sm text-zinc-400">02</span>
							<p className="text-base leading-relaxed text-zinc-400">
								<span className="font-medium text-white">
									Typed feedback loop:
								</span>{" "}
								detailed error traces show what failed, enabling precise
								self-repair.
							</p>
						</div>
						<div className="flex flex-col gap-2">
							<span className="font-mono text-sm text-zinc-400">03</span>
							<p className="text-base leading-relaxed text-zinc-400">
								<span className="font-medium text-white">
									Built-in reliability:
								</span>{" "}
								error handling, supervision, and recovery, production-ready by
								default.
							</p>
						</div>
						<div className="flex flex-col gap-2">
							<span className="font-mono text-sm text-zinc-400">04</span>
							<p className="text-base leading-relaxed text-zinc-400">
								<span className="font-medium text-white">Rich toolbox:</span>{" "}
								from schema validation to workflows, build in a language LLMs
								understand.
							</p>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
