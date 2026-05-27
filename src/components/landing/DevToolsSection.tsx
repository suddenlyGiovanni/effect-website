import { useState } from "react";
import { getAssetPath } from "../../utils/assetPath";

const tools = [
	{
		id: "diagnostics",
		label: "Diagnostics",
		description: "Real-time type errors and suggestions",
		video: getAssetPath("/videos/diagnostics.mp4"),
	},
	{
		id: "refactors",
		label: "Refactors",
		description: "Automated code transformations",
		video: getAssetPath("/videos/refactors.mp4"),
	},
	{
		id: "debugger",
		label: "Debugger",
		description: "Visual fiber inspection",
		video: getAssetPath("/videos/visuals.mp4"),
	},
];

export function DevToolsSection() {
	const [activeTab, setActiveTab] = useState(0);
	const activeTool = tools[activeTab];

	return (
		<section className="relative w-full py-24 md:pt-40 md:pb-20">
			<div className="mx-auto w-full max-w-[73.75rem] px-4">
				{/* Header row - split layout */}
				<div className="mb-16 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-0">
					<div>
						<p className="mb-3 font-mono text-sm font-semibold tracking-wider text-zinc-400 uppercase">
							Developer Experience
						</p>
						<h2 className="leading-tighter text-2xl font-bold text-white md:text-3xl">
							IDE-native tooling
						</h2>
					</div>
					<div className="pl-4 lg:pt-8">
						<p className="max-w-lg text-lg leading-relaxed text-zinc-400">
							The Effect Language Service brings real-time diagnostics and
							intelligent refactoring to your editor.
						</p>

						{/* Links */}
						<div className="mt-6 flex flex-wrap gap-3">
							<a
								href="https://effect.website/docs/getting-started/devtools/"
								target="_blank"
								rel="noopener noreferrer"
								className="group inline-flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900/50 px-5 py-2.5 text-base font-medium text-white transition-all hover:border-zinc-500 hover:bg-zinc-800"
							>
								<span>Read the docs</span>
								<i className="ri-arrow-right-line text-base transition-transform group-hover:translate-x-0.5" />
							</a>
							<a
								href="https://marketplace.visualstudio.com/items?itemName=effectful-tech.effect-vscode"
								target="_blank"
								rel="noopener noreferrer"
								className="group inline-flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900/50 px-5 py-2.5 text-base font-medium text-white transition-all hover:border-zinc-500 hover:bg-zinc-800"
							>
								<i className="ri-vscode-line text-base" />
								<span>VSCode Extension</span>
							</a>
							<a
								href="https://effect.website/play/"
								target="_blank"
								rel="noopener noreferrer"
								className="group inline-flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900/50 px-5 py-2.5 text-base font-medium text-white transition-all hover:border-zinc-500 hover:bg-zinc-800"
							>
								<i className="ri-play-circle-line text-base" />
								<span>Playground</span>
							</a>
						</div>
					</div>
				</div>

				{/* Video with vertical tabs on right */}
				<div className="flex gap-4">
					{/* Video container */}
					<div className="flex-1 overflow-hidden rounded-md border border-zinc-700 bg-zinc-900/30">
						<div className="relative aspect-video">
							<video
								key={activeTool.video}
								src={activeTool.video}
								className="absolute inset-0 h-full w-full object-cover"
								autoPlay
								loop
								muted
								playsInline
								controls
								aria-label={`Effect ${activeTool.label} demonstration`}
							>
								<track kind="captions" />
								Your browser does not support the video tag.
							</video>
							{/* Overlay */}
							<div className="pointer-events-none absolute inset-0 bg-[#18181B]/40" />
						</div>
					</div>

					{/* Vertical tabs on right */}
					<div className="flex flex-col gap-3">
						{tools.map((tool, index) => (
							<button
								key={tool.id}
								type="button"
								onClick={() => setActiveTab(index)}
								className={`relative cursor-pointer rounded-md border px-3 py-2 text-left transition-colors ${
									activeTab === index
										? "border-zinc-500 bg-zinc-900/50"
										: "border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900/40"
								}`}
							>
								<span
									className={`font-mono text-sm font-medium tracking-wide uppercase ${activeTab === index ? "text-white" : "text-zinc-400"}`}
								>
									{tool.label}
								</span>
								<p className="mt-1 text-sm text-zinc-400">{tool.description}</p>
							</button>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
