import { getAssetPath } from "../../utils/assetPath";

const useCases = [
	{
		logo: getAssetPath("/assets/test-logos/warp-logo-white.svg"),
		title: "HR Systems",
		href: "https://youtu.be/2cN1R9zIxp4",
		alt: "Warp",
		thumbnail: getAssetPath(
			"/assets/images/adam-rankin-banner_compressed.webp",
		),
	},
	{
		logo: getAssetPath("/assets/test-logos/open-router.svg"),
		title: "Internal Tooling",
		href: "https://youtu.be/x6-AVCwBIWc",
		alt: "OpenRouter",
		thumbnail: getAssetPath(
			"/assets/images/louis-vichy-banner_compressed.webp",
		),
	},
	{
		logo: getAssetPath("/assets/test-logos/zendesk-logo.svg"),
		title: "Enerprise Customer Support",
		href: "https://www.youtube.com/watch?v=rNAqPHBQFEQ",
		alt: "Attila Večerek",
		thumbnail: getAssetPath(
			"/assets/images/attila-vecerek-banner_compressed.webp",
		),
	},
	{
		logo: getAssetPath("/assets/quotes-logos/spiko-logo.svg"),
		title: "Fintech Infrastructure",
		href: "https://www.youtube.com/watch?v=lFOHVZnJLew",
		alt: "Samuel Briole",
		thumbnail: getAssetPath(
			"/assets/images/samuel-briole-banner_compressed.webp",
		),
	},
];

export function TestimonialsSection() {
	return (
		<section className="relative py-24 md:pt-40 md:pb-24">
			{/* Header - with padding */}
			<div className="mx-auto mb-12 w-full max-w-[73.75rem] px-4">
				<p className="mb-3 font-mono text-sm font-medium tracking-wider text-zinc-400 uppercase">
					// Who uses Effect
				</p>
				<h2 className="leading-tighter text-2xl font-semibold text-white md:text-3xl">
					Real-world production systems
				</h2>
				{/* Resource links */}
				<div className="mt-8 flex flex-wrap items-center gap-6">
					<a
						href="https://www.youtube.com/playlist?list=PLDf3uQLaK2lbPLQT6I6xkiV_W3NxnPXRE"
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-1 text-base font-medium text-zinc-300 transition-colors hover:text-zinc-300"
					>
						Cause & Effect Podcast
						<i className="ri-arrow-right-up-line text-base" />
					</a>
					<a
						href="https://www.youtube.com/playlist?list=PLDf3uQLaK2lY8cjMh4dmq3eFSGJVwPBPO"
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-1 text-base font-medium text-zinc-300 transition-colors hover:text-zinc-300"
					>
						Effect Days 2024
						<i className="ri-arrow-right-up-line text-base" />
					</a>
					<a
						href="https://www.youtube.com/playlist?list=PLDf3uQLaK2lZoJQ7BVtIbKs2P8i-xVmhP"
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-1 text-base font-medium text-zinc-300 transition-colors hover:text-zinc-300"
					>
						Effect Days 2025
						<i className="ri-arrow-right-up-line text-base" />
					</a>
				</div>
			</div>

			{/* Use Case Cards - Video thumbnails grid */}
			<div className="mx-auto w-full max-w-[73.75rem] px-4">
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{useCases.map((useCase, index) => (
						<a
							key={index}
							href={useCase.href}
							{...(useCase.href.startsWith("http")
								? { target: "_blank", rel: "noopener noreferrer" }
								: {})}
							className="group relative flex flex-col overflow-hidden transition-all hover:border-zinc-500"
						>
							{/* Video thumbnail area */}
							<div className="relative aspect-video w-full overflow-hidden rounded-md border border-zinc-800 bg-zinc-900">
								<img
									src={useCase.thumbnail}
									alt={`${useCase.alt} case study`}
									className="h-full w-full object-cover"
								/>
								<div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-300 group-hover:bg-black/20">
									<div className="flex h-12 w-12 scale-0 items-center justify-center rounded-full bg-white/90 transition-transform duration-300 group-hover:scale-100">
										<svg
											className="ml-1 h-5 w-5 text-zinc-900"
											viewBox="0 0 24 24"
											fill="currentColor"
										>
											<path d="M8 5v14l11-7z" />
										</svg>
									</div>
								</div>
							</div>
							{/* Label area */}
							<div className="flex items-center justify-between px-0 py-2">
								<span className="font-mono text-[13px] text-zinc-400 uppercase group-hover:text-zinc-200">
									{useCase.title}
								</span>
								<i className="ri-arrow-right-up-line text-zinc-400 transition-colors group-hover:text-zinc-200" />
							</div>
						</a>
					))}
				</div>
			</div>
		</section>
	);
}
