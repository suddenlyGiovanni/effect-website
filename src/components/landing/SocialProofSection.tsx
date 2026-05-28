import { useRef } from "react";
const useCases = [
	{
		logo: "/assets/quotes-logos/masterclass-noM.svg",
		title: "Voice AI Orchestration",
		href: "https://youtu.be/Cj2pVPqdOVs",
		alt: "MasterClass",
		thumbnail: "/assets/images/david-golightly – banner_compressed.webp",
	},
	{
		logo: "/assets/test-logos/warp-logo-white.svg",
		title: "HR Systems",
		href: "https://youtu.be/2cN1R9zIxp4",
		alt: "Warp",
		thumbnail: "/assets/images/adam-rankin-banner_compressed.webp",
	},
	{
		logo: "/assets/test-logos/open-router.svg",
		title: "Internal Tooling",
		href: "https://youtu.be/x6-AVCwBIWc",
		alt: "OpenRouter",
		thumbnail: "/assets/images/louis-vichy– banner_compressed.webp",
	},
	{
		logo: "/assets/test-logos/14-ai.svg",
		title: "AI Customer Service",
		href: "https://youtu.be/gGFPhFrGCng",
		alt: "14.ai",
		thumbnail: "/assets/images/michael-fester – banner_compressed (1).webp",
	},
];

const quotes = [
	{
		text: "Effect makes doing the hard, tedious, and error-prone tasks that require discipline, easy, natural, first-class.",
		author: "Dillon Mulroy",
		company: "Cloudflare",
		logo: "/assets/quotes-logos/Cloudflare_logo_wht 2.svg",
	},
	{
		text: "Effect tracing is simply magical. Was able to fully integrate with our existing microservice observability stack fairly easily.",
		author: "Zach Warunek",
		company: "Twitter",
		logo: undefined,
	},
	{
		text: "I feel like I'm writing some of the best code in my career using Effect.",
		author: "Matt Pocock",
		company: "Total TypeScript",
		logo: "/assets/test-logos/total-typescript-logo.png",
	},
	{
		text: "The real-world impact is tangible: few production bugs, simple testing, and clear code organization.",
		author: "Samuel Briole",
		company: "Spiko",
		logo: "/assets/quotes-logos/spiko-logo.svg",
	},
	{
		text: "I think it's one of the most important libraries being developed today.",
		author: "Matthew Phillips",
		company: "Astro",
		logo: "/assets/quotes-logos/Astro.svg",
	},
	{
		text: "The spaghetti code really turns into something that's just very linear and clean.",
		author: "David Golightly",
		company: "Masterclass",
		logo: "/assets/quotes-logos/masterclass-noM.svg",
		logoSize: "h-2.5",
	},
	{
		text: "Perhaps the most ergonomic and safe method of Dependency Injection I've ever seen.",
		author: "Cor",
		company: "Union Build",
		logo: "/assets/quotes-logos/union-build.svg",
	},
	{
		text: "Effect puts you on the path to writing more performant async code by default.",
		author: "Ethan Niser",
		company: "Vercel",
		logo: "/assets/quotes-logos/vercel-logotype-dark.svg",
	},
];

export function SocialProofSection() {
	const scrollContainerRef = useRef<HTMLDivElement>(null);

	const cardWidth = 320;
	const gap = 16;

	const scroll = (direction: "left" | "right") => {
		if (!scrollContainerRef.current) return;

		const container = scrollContainerRef.current;
		const scrollAmount = cardWidth + gap;
		const maxScroll = container.scrollWidth - container.clientWidth;

		if (direction === "right") {
			if (container.scrollLeft >= maxScroll - 10) {
				container.scrollTo({ left: 0, behavior: "smooth" });
			} else {
				container.scrollBy({ left: scrollAmount, behavior: "smooth" });
			}
		} else {
			container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
		}
	};

	return (
		<section className="relative py-24 md:pt-40 md:pb-20">
			{/* Header */}
			<div className="mx-auto mb-10 w-full max-w-[73.75rem] px-4">
				<p className="mb-3 font-mono text-sm font-semibold tracking-wider text-zinc-400 uppercase">
					// Trusted in Production
				</p>
				<h2 className="leading-tighter text-2xl font-bold text-white md:text-3xl">
					Real-world production systems
				</h2>
				{/* Resource links */}
				<div className="mt-8 flex flex-wrap items-center gap-3">
					<a
						href="https://www.youtube.com/playlist?list=PLDf3uQLaK2lbPLQT6I6xkiV_W3NxnPXRE"
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900/50 px-5 py-2.5 text-base font-medium text-white transition-all hover:border-zinc-500 hover:bg-zinc-800"
					>
						Cause & Effect Podcast
						<i className="ri-arrow-right-up-line text-base" />
					</a>
					<a
						href="https://www.youtube.com/playlist?list=PLDf3uQLaK2lY8cjMh4dmq3eFSGJVwPBPO"
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900/50 px-5 py-2.5 text-base font-medium text-white transition-all hover:border-zinc-500 hover:bg-zinc-800"
					>
						Effect Days 2024
						<i className="ri-arrow-right-up-line text-base" />
					</a>
					<a
						href="https://www.youtube.com/playlist?list=PLDf3uQLaK2lZoJQ7BVtIbKs2P8i-xVmhP"
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900/50 px-5 py-2.5 text-base font-medium text-white transition-all hover:border-zinc-500 hover:bg-zinc-800"
					>
						Effect Days 2025
						<i className="ri-arrow-right-up-line text-base" />
					</a>
				</div>
			</div>

			{/* Use Case Cards - Video thumbnails grid */}
			<div className="mx-auto mb-16 w-full max-w-[73.75rem] px-4">
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{useCases.map((useCase, index) => (
						<a
							key={index}
							href={useCase.href}
							target="_blank"
							rel="noopener noreferrer"
							className="group relative flex flex-col overflow-hidden rounded-md border border-zinc-700 bg-zinc-900/50 transition-all hover:border-zinc-500 hover:bg-zinc-900"
						>
							{/* Video thumbnail area */}
							<div className="relative aspect-video w-full overflow-hidden bg-zinc-900">
								<img
									src={useCase.thumbnail}
									alt={`${useCase.alt} case study`}
									className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
								/>
							</div>
							{/* Label area */}
							<div className="flex items-center justify-between px-3 py-2">
								<span className="text-sm font-medium text-zinc-400">
									{useCase.title}
								</span>
								<i className="ri-arrow-right-up-line text-zinc-400 transition-colors group-hover:text-zinc-400" />
							</div>
						</a>
					))}
				</div>
			</div>

			{/* Quotes section */}
			<div className="mx-auto w-full max-w-[73.75rem] px-4">
				{/* Header row with title and navigation arrows */}
				<div className="mb-10 flex items-end justify-between">
					<div>
						<p className="mb-2 font-mono text-sm font-semibold tracking-wider text-zinc-400 uppercase">
							Testimonials
						</p>
						<h2 className="leading-tighter text-2xl font-semibold text-white md:text-3xl">
							What developers are saying...
						</h2>
					</div>
					{/* Navigation arrows */}
					<div className="flex gap-2">
						<button
							type="button"
							onClick={() => scroll("left")}
							className="group flex h-10 w-10 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900/50 transition-all hover:border-zinc-500 hover:bg-zinc-800"
							aria-label="Scroll left"
						>
							<i className="ri-arrow-left-line text-base text-zinc-400 transition-colors group-hover:text-white" />
						</button>
						<button
							type="button"
							onClick={() => scroll("right")}
							className="group flex h-10 w-10 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900/50 transition-all hover:border-zinc-500 hover:bg-zinc-800"
							aria-label="Scroll right"
						>
							<i className="ri-arrow-right-line text-base text-zinc-400 transition-colors group-hover:text-white" />
						</button>
					</div>
				</div>
			</div>

			{/* Slider container - full width with fade edges */}
			<div className="relative">
				<div
					ref={scrollContainerRef}
					className="scrollbar-hide flex gap-4 overflow-x-auto px-4"
					style={{
						scrollbarWidth: "none",
						msOverflowStyle: "none",
						WebkitOverflowScrolling: "touch",
						paddingLeft: "max(1rem, calc((100vw - 73.75rem) / 2 + 1rem))",
						paddingRight: "max(1rem, calc((100vw - 73.75rem) / 2 + 1rem))",
					}}
				>
					{quotes.map((quote, index) => (
						<div
							key={index}
							className="group flex h-56 w-80 shrink-0 flex-col justify-between rounded-md border border-zinc-800 bg-zinc-950 p-6 transition-all hover:border-zinc-700 hover:bg-zinc-900"
						>
							<p className="line-clamp-4 text-base leading-relaxed text-zinc-300">
								"{quote.text}"
							</p>
							<div className="flex items-center justify-between">
								<span className="text-sm font-medium text-white">
									{quote.author}
								</span>
								{quote.logo ? (
									<img
										src={quote.logo}
										alt={quote.company}
										className={quote.logoSize || "h-4"}
									/>
								) : (
									<i className="ri-twitter-x-line text-lg text-zinc-400" />
								)}
							</div>
						</div>
					))}
				</div>

				{/* Left fade gradient */}
				<div
					className="pointer-events-none absolute top-0 bottom-0 left-0 w-16"
					style={{
						background: "linear-gradient(to right, rgb(9 9 11), transparent)",
					}}
				/>
				{/* Right fade gradient */}
				<div
					className="pointer-events-none absolute top-0 right-0 bottom-0 w-16"
					style={{
						background: "linear-gradient(to left, rgb(9 9 11), transparent)",
					}}
				/>
			</div>
		</section>
	);
}
