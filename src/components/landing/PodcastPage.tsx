import { GridOverlay } from "../GridOverlay";
import { Link } from "../ui";
import { Footer } from "./Footer";
import { Navigation } from "./Navigation";

interface Episode {
	number: number;
	title: string;
	slug: string;
	guest: string;
	company: string;
	companyLogo?: string;
	description: string;
	date: string;
	duration: string;
	youtubeId: string;
	thumbnailUrl: string;
}

const EPISODES: Episode[] = [
	{
		number: 7,
		title: "Reliable Payroll Systems in TypeScript with Effect",
		slug: "reliable-payroll-systems-warp",
		guest: "Adam Rankin",
		company: "Warp",
		description:
			"In this episode, Johannes Schickling talks with Adam Rankin, CTO at Warp, about using Effect to bring structure and composability to a growing TypeScript codebase, enabling a small, fast-moving team to stay productive while shipping reliable payment & payroll...",
		date: "Dec 16, 2025",
		duration: "59:54",
		youtubeId: "zxCR6rG4snY",
		thumbnailUrl: "https://img.youtube.com/vi/zxCR6rG4snY/hqdefault.jpg",
	},
	{
		number: 6,
		title: "Inside OpenRouter's Tech Stack and Use of Effect",
		slug: "scaling-ai-openrouter",
		guest: "Louis Vichy",
		company: "OpenRouter",
		description:
			"Louis Vichy, co-founder of OpenRouter, joins Johannes Schickling and Michael Arnaldi to talk about OpenRouter's TypeScript stack, internal tooling powered by Effect, and the engineering challenges of scaling an AI platform processing trillions of tokens weekly.",
		date: "Nov 11, 2025",
		duration: "86:11",
		youtubeId: "AVJIqQi11lM",
		thumbnailUrl: "https://img.youtube.com/vi/AVJIqQi11lM/hqdefault.jpg",
	},
	{
		number: 5,
		title: "Event-Driven Systems in FinTech. How Spiko Leverages Effect",
		slug: "event-driven-systems-spiko",
		guest: "Samuel Briole",
		company: "Spiko",
		description:
			"This podcast episode features Samuel Briole, CTO of Spiko, a Paris-based FinTech startup building infrastructure for issuing regulated financial products on public blockchains, specifically risk-free products. Spiko utilizes the Effect extensively from...",
		date: "Sep 15, 2025",
		duration: "58:03",
		youtubeId: "lFOHVZnJLew",
		thumbnailUrl: "https://img.youtube.com/vi/lFOHVZnJLew/hqdefault.jpg",
	},
	{
		number: 4,
		title: "From Skeptic to Advocate, Scaling Effect at Vercel",
		slug: "scaling-effect-vercel",
		guest: "Dillon Mulroy",
		company: "Vercel",
		description:
			"In this episode of Cause & Effect, Johannes Schickling is joined by Dillon Mulroy, Domains Lead at Vercel, who shares his personal journey with Effect and how Vercel gradually adopted it across their Domains platform. Dillon explains why Effect feels like...",
		date: "Aug 4, 2025",
		duration: "53:53",
		youtubeId: "rPKohHGPqCY",
		thumbnailUrl: "https://img.youtube.com/vi/rPKohHGPqCY/hqdefault.jpg",
	},
	{
		number: 3,
		title: "Scaling Voice AI at MasterClass with Effect & TypeScript",
		slug: "scaling-voice-ai-masterclass",
		guest: "David Golightly",
		company: "MasterClass",
		description:
			"In this episode Johannes Schickling had a conversation with David Golightly, Staff Engineer at MasterClass, to explore how his team built Cortex – a real-time voice AI orchestration layer that powers personalized conversations with celebrity instructors li...",
		date: "Jun 24, 2025",
		duration: "69:26",
		youtubeId: "x2bUuOZ-htU",
		thumbnailUrl: "https://img.youtube.com/vi/x2bUuOZ-htU/hqdefault.jpg",
	},
	{
		number: 2,
		title: "Scaling AI for Customer Support at Markprompt with Effect",
		slug: "scaling-ai-customer-support-markprompt",
		guest: "Michael Fester",
		company: "Markprompt",
		description:
			"Join us as we talk with Michael Fester from Markprompt about scaling AI-powered customer support with Effect, building reliable and high-performance infrastructure, and enhancing developer productivity in a fast-evolving AI landscape.",
		date: "Mar 7, 2025",
		duration: "52:51",
		youtubeId: "8lz9-0y58Jc",
		thumbnailUrl: "https://img.youtube.com/vi/8lz9-0y58Jc/hqdefault.jpg",
	},
	{
		number: 1,
		title: "Adopting Effect at Zendesk with Attila Večerek",
		slug: "adopting-effect-zendesk",
		guest: "Attila Večerek",
		company: "Zendesk",
		description:
			"In this inaugural episode, Johannes Schickling speaks with Attila Večerek, Tech Lead and Staff Engineer at Zendesk, about their journey adopting Effect incrementally within a large-scale, diverse codebase environment.",
		date: "Nov 26, 2024",
		duration: "80:31",
		youtubeId: "rNAqPHBQFEQ",
		thumbnailUrl: "https://img.youtube.com/vi/rNAqPHBQFEQ/hqdefault.jpg",
	},
];

function EpisodeCard({ episode }: { episode: Episode }) {
	return (
		<a
			href={`/podcast/episodes/${episode.slug}`}
			className="group my-4 flex flex-col gap-8 p-4 transition-colors hover:bg-zinc-900/60 md:flex-row md:gap-8"
		>
			{/* Thumbnail */}
			<div className="relative aspect-video w-full flex-shrink-0 overflow-hidden md:w-[40%]">
				<img
					src={episode.thumbnailUrl}
					alt={episode.guest}
					className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
				/>
			</div>

			{/* Episode content */}
			<div className="flex flex-1 flex-col justify-center pr-8">
				<p className="mb-2 font-mono text-sm font-medium tracking-wider text-zinc-400 uppercase transition-colors duration-300 group-hover:text-zinc-300">
					// Episode #{episode.number.toString().padStart(2, "0")}
				</p>
				<h4 className="text-lg font-semibold text-white md:text-xl">
					{episode.title}
				</h4>
				<p className="mt-2 line-clamp-3 text-sm leading-relaxed text-zinc-400 md:text-base">
					{episode.description}
				</p>
				<div className="mt-4 flex items-center gap-2 text-sm text-zinc-400 transition-colors duration-300 group-hover:text-zinc-400">
					<span>{episode.date}</span>
					<span>·</span>
					<span>{episode.duration}</span>
				</div>
			</div>
		</a>
	);
}

export function PodcastPage() {
	return (
		<div className="relative min-h-screen bg-zinc-950 text-white antialiased">
			{/* Dithered background overlay */}
			<div
				className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]"
				style={{
					backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect x='0' y='0' width='1' height='1' fill='white'/%3E%3Crect x='2' y='2' width='1' height='1' fill='white'/%3E%3C/svg%3E")`,
					backgroundSize: "4px 4px",
				}}
			/>

			{/* Skip Navigation Link */}
			<a
				href="#main-content"
				className="absolute -left-[9999px] z-[999] rounded-br-lg bg-zinc-800 px-6 py-4 font-semibold text-white no-underline focus:top-0 focus:left-0"
			>
				Skip to main content
			</a>

			<Navigation activePath="/podcast" />
			<GridOverlay />

			{/* Vertical border lines container */}
			<div className="pointer-events-none absolute top-0 right-0 bottom-0 left-0 z-[60] hidden lg:block">
				<div className="relative mx-auto h-full w-full max-w-[73.75rem]">
					<div className="absolute top-0 bottom-0 left-0 w-px bg-zinc-800" />
					<div className="absolute top-0 right-0 bottom-0 w-px bg-zinc-800" />
				</div>
			</div>

			{/* Center vertical line - dashed */}
			<div className="pointer-events-none absolute top-0 right-0 bottom-0 left-0 z-0 hidden px-8 lg:block">
				<div className="relative mx-auto h-full w-full max-w-[73.75rem]">
					<div
						className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2"
						style={{
							width: "1px",
							backgroundImage:
								"repeating-linear-gradient(to bottom, rgb(39 39 42) 0px, rgb(39 39 42) 2px, transparent 2px, transparent 4px)",
						}}
					/>
				</div>
			</div>

			{/* Main Content */}
			<main id="main-content" className="relative w-full pt-16">
				{/* Hero Section */}
				<section className="relative w-full overflow-hidden bg-zinc-950 pt-16 pb-12 md:pt-24 md:pb-24">
					{/* Grid background */}
					<div
						className="pointer-events-none absolute inset-0"
						style={{
							backgroundImage: `
                linear-gradient(to right, rgba(24, 24, 27, 0.8) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(24, 24, 27, 0.8) 1px, transparent 1px)
              `,
							backgroundSize: "196.6px 186px",
							backgroundPosition: "calc(50% + 97px) 0",
						}}
					/>

					{/* Fade out grid at top and bottom */}
					<div
						className="pointer-events-none absolute inset-0"
						style={{
							background:
								"linear-gradient(to bottom, #09090b 0%, transparent 20%, transparent 60%, #09090b 100%)",
						}}
					/>

					<div className="relative mx-auto max-w-[73.75rem] px-4">
						<div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:gap-12">
							{/* Text content */}
							<div className="max-w-3xl">
								<p className="mb-2 font-mono text-sm font-medium tracking-wider text-zinc-400 uppercase">
									// Cause & Effect 🎙️
								</p>
								<h1 className="text-3xl font-semibold text-white sm:text-4xl md:text-4xl">
									How companies ship with Effect
								</h1>
								<p className="mt-2.5 text-base leading-snug text-zinc-400 sm:text-lg">
									Stories from engineering teams at Vercel, Zendesk, MasterClass, and more.
								</p>

								{/* Mobile platform links */}
								<div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 lg:hidden">
								<Link
									href="https://podcasts.apple.com/us/podcast/cause-effect/id1781879869"
									variant="icon"
									className="group flex items-center gap-3"
									aria-label="Listen on Apple Podcasts"
								>
										<svg
											className="h-5 w-5 shrink-0"
											viewBox="0 0 300 300"
											fill="none"
											xmlns="http://www.w3.org/2000/svg"
										>
											<defs>
												<linearGradient
													id="podcastGradientMobile"
													x1="150"
													y1="0"
													x2="150"
													y2="300"
													gradientUnits="userSpaceOnUse"
												>
													<stop stopColor="#833AB4" />
													<stop offset="1" stopColor="#E040FB" />
												</linearGradient>
											</defs>
											<rect
												width="300"
												height="300"
												rx="67.5"
												fill="url(#podcastGradientMobile)"
											/>
											<path
												d="M150 65c-46.9 0-85 38.1-85 85 0 29.5 15.1 55.5 38 70.7v-1.2c0-5.7.7-11.2 2-16.5-14.2-12.5-23.2-30.8-23.2-51.2 0-37.6 30.6-68.2 68.2-68.2s68.2 30.6 68.2 68.2c0 20.4-9 38.7-23.2 51.2 1.3 5.3 2 10.8 2 16.5v1.2c22.9-15.2 38-41.2 38-70.7 0-46.9-38.1-85-85-85z"
												fill="#fff"
											/>
											<path
												d="M150 95c-30.4 0-55 24.6-55 55 0 18.5 9.1 34.8 23.1 44.8.5-4.8 1.5-9.4 3-13.8-9.3-8.2-15.1-20.2-15.1-33.5 0-24.3 19.7-44 44-44s44 19.7 44 44c0 13.3-5.9 25.3-15.1 33.5 1.5 4.4 2.5 9 3 13.8 14-10 23.1-26.3 23.1-44.8 0-30.4-24.6-55-55-55z"
												fill="#fff"
											/>
											<path
												d="M150 125c-13.8 0-25 11.2-25 25 0 8.5 4.2 15.9 10.7 20.4-.3 2.5-.5 5-.5 7.6v37c0 11 8.9 20 20 20h-10.4c-11 0-20-8.9-20-20v-37c0-16.6 13.4-30 30-30s30 13.4 30 30v37c0 11-8.9 20-20 20H150c11 0 20-8.9 20-20v-37c0-2.6-.2-5.1-.5-7.6 6.5-4.5 10.7-11.9 10.7-20.4 0-13.8-11.2-25-25-25h-5.2z"
												fill="#fff"
											/>
										</svg>
										<span className="text-sm text-white group-hover:underline">
											Apple Podcasts
										</span>
									</Link>
									<Link
										href="https://open.spotify.com/show/4QTFiem4o0G9V2vXtv8vMU"
										variant="icon"
										className="group flex items-center gap-3"
										aria-label="Listen on Spotify"
									>
										<svg
											className="h-5 w-5 shrink-0"
											viewBox="0 0 24 24"
											fill="#1DB954"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
										</svg>
										<span className="text-sm text-white group-hover:underline">
											Spotify
										</span>
									</Link>
									<Link
										href="https://youtube.com/playlist?list=PLDf3uQLaK2B_jaZ5Fy7IPNq0FIViV_CQl"
										variant="icon"
										className="group flex items-center gap-3"
										aria-label="Watch on YouTube"
									>
										<svg
											className="h-5 w-5 shrink-0"
											viewBox="0 0 24 24"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												fill="#FF0000"
												d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
											/>
											<path
												fill="#fff"
												d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z"
											/>
										</svg>
										<span className="text-sm text-white group-hover:underline">
											YouTube
										</span>
									</Link>
									<Link
										href={"/podcast/rss.xml"}
										variant="icon"
										className="group flex items-center gap-3"
										aria-label="RSS Feed"
									>
										<svg
											className="h-5 w-5 shrink-0 text-white"
											viewBox="0 0 24 24"
											fill="currentColor"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path d="M6.18 15.64a2.18 2.18 0 1 1 0 4.36 2.18 2.18 0 0 1 0-4.36zM4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44zm0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93v-2.83z" />
										</svg>
										<span className="text-sm text-white group-hover:underline">
											RSS
										</span>
									</Link>
								</div>
							</div>
							{/* Platform links */}
							<div className="hidden lg:block">
								<div className="relative px-8 py-6">
									{/* Corner brackets */}
									<span className="absolute top-0 left-0 h-3 w-3 border-t border-l border-zinc-700" />
									<span className="absolute top-0 right-0 h-3 w-3 border-t border-r border-zinc-700" />
									<span className="absolute bottom-0 left-0 h-3 w-3 border-b border-l border-zinc-700" />
									<span className="absolute right-0 bottom-0 h-3 w-3 border-r border-b border-zinc-700" />

									<p className="mb-4 font-mono text-xs tracking-wider text-zinc-400 uppercase">
										// Available on
									</p>
									<div className="flex flex-col gap-3">
										<Link
											href="https://podcasts.apple.com/us/podcast/cause-effect/id1781879869"
											variant="icon"
											className="group flex items-center gap-3"
											aria-label="Listen on Apple Podcasts"
										>
											<svg
												className="h-5 w-5 shrink-0"
												viewBox="0 0 300 300"
												fill="none"
												xmlns="http://www.w3.org/2000/svg"
											>
												<defs>
													<linearGradient
														id="podcastGradient"
														x1="150"
														y1="0"
														x2="150"
														y2="300"
														gradientUnits="userSpaceOnUse"
													>
														<stop stopColor="#833AB4" />
														<stop offset="1" stopColor="#E040FB" />
													</linearGradient>
												</defs>
												<rect
													width="300"
													height="300"
													rx="67.5"
													fill="url(#podcastGradient)"
												/>
												<path
													d="M150 65c-46.9 0-85 38.1-85 85 0 29.5 15.1 55.5 38 70.7v-1.2c0-5.7.7-11.2 2-16.5-14.2-12.5-23.2-30.8-23.2-51.2 0-37.6 30.6-68.2 68.2-68.2s68.2 30.6 68.2 68.2c0 20.4-9 38.7-23.2 51.2 1.3 5.3 2 10.8 2 16.5v1.2c22.9-15.2 38-41.2 38-70.7 0-46.9-38.1-85-85-85z"
													fill="#fff"
												/>
												<path
													d="M150 95c-30.4 0-55 24.6-55 55 0 18.5 9.1 34.8 23.1 44.8.5-4.8 1.5-9.4 3-13.8-9.3-8.2-15.1-20.2-15.1-33.5 0-24.3 19.7-44 44-44s44 19.7 44 44c0 13.3-5.9 25.3-15.1 33.5 1.5 4.4 2.5 9 3 13.8 14-10 23.1-26.3 23.1-44.8 0-30.4-24.6-55-55-55z"
													fill="#fff"
												/>
												<path
													d="M150 125c-13.8 0-25 11.2-25 25 0 8.5 4.2 15.9 10.7 20.4-.3 2.5-.5 5-.5 7.6v37c0 11 8.9 20 20 20h-10.4c-11 0-20-8.9-20-20v-37c0-16.6 13.4-30 30-30s30 13.4 30 30v37c0 11-8.9 20-20 20H150c11 0 20-8.9 20-20v-37c0-2.6-.2-5.1-.5-7.6 6.5-4.5 10.7-11.9 10.7-20.4 0-13.8-11.2-25-25-25h-5.2z"
													fill="#fff"
												/>
											</svg>
											<span className="text-sm text-white group-hover:underline">
												Apple Podcasts
											</span>
										</Link>

										<Link
											href="https://open.spotify.com/show/4QTFiem4o0G9V2vXtv8vMU"
											variant="icon"
											className="group flex items-center gap-3"
											aria-label="Listen on Spotify"
										>
											<svg
												className="h-5 w-5 shrink-0"
												viewBox="0 0 24 24"
												fill="#1DB954"
												xmlns="http://www.w3.org/2000/svg"
											>
												<path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
											</svg>
											<span className="text-sm text-white group-hover:underline">
												Spotify
											</span>
										</Link>

										<Link
											href="https://youtube.com/playlist?list=PLDf3uQLaK2B_jaZ5Fy7IPNq0FIViV_CQl"
											variant="icon"
											className="group flex items-center gap-3"
											aria-label="Watch on YouTube"
										>
											<svg
												className="h-5 w-5 shrink-0"
												viewBox="0 0 24 24"
												xmlns="http://www.w3.org/2000/svg"
											>
												<path
													fill="#FF0000"
													d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
												/>
												<path
													fill="#fff"
													d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z"
												/>
											</svg>
											<span className="text-sm text-white group-hover:underline">
												YouTube
											</span>
										</Link>

										<Link
											href={"/podcast/rss.xml"}
											variant="icon"
											className="group flex items-center gap-3"
											aria-label="RSS Feed"
										>
											<svg
												className="h-5 w-5 shrink-0 text-white"
												viewBox="0 0 24 24"
												fill="currentColor"
												xmlns="http://www.w3.org/2000/svg"
											>
												<path d="M6.18 15.64a2.18 2.18 0 1 1 0 4.36 2.18 2.18 0 0 1 0-4.36zM4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44zm0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93v-2.83z" />
											</svg>
											<span className="text-sm text-white group-hover:underline">
												RSS
											</span>
										</Link>
									</div>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* Episodes Section */}
				<section className="w-full gap-16 border-t border-zinc-800 bg-zinc-950 pb-24">
					<div className="mx-auto max-w-[73.75rem] px-4">
						<div className="flex flex-col">
							{EPISODES.map((episode, index) => (
								<div key={episode.number}>
									<EpisodeCard episode={episode} />
									{index < EPISODES.length - 1 && (
										<div className="h-px w-full bg-zinc-800" />
									)}
								</div>
							))}
						</div>
					</div>
				</section>
			</main>

			<Footer hideCommunityBorder activePath="/podcast" />
		</div>
	);
}
