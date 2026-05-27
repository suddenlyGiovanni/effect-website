import { getAssetPath } from "../../utils/assetPath";
import { Button, Link } from "@/components/ui";
import { GridOverlay } from "../GridOverlay";
import { Footer } from "./Footer";
import { Navigation } from "./Navigation";

const PAST_EDITIONS = [
	{
		year: "2024",
		location: "Vienna, Austria 🇦🇹",
		dates: "Feb 22-24, 2024",
		talks: 15,
		workshops: 2,
		badge: "Inaugural Edition",
		description:
			"Where the Effect community gathered for the first time to share from early experiments to production systems.",
		playlistUrl:
			"https://www.youtube.com/playlist?list=PLDf3uQLaK2B_XZ8k3gD8R1k4-LBz8JmHP",
		image: "/assets/images/ed-24-2.png",
	},
	{
		year: "2025",
		location: "Livorno, Italy 🇮🇹",
		dates: "Mar 19-21, 2025",
		talks: 19,
		workshops: 2,
		badge: "Past Edition",
		description:
			"A more in-depth event spotlighting advanced use cases and real production stories, showing the evolution of Effect.",
		playlistUrl:
			"https://www.youtube.com/playlist?list=PLDf3uQLaK2B9vHzUNyvOSvoMv61LW7792",
		image: "/assets/images/ed-25-2.png",
	},
];

const STATS = [
	{
		value: "3rd",
		label: "Edition",
		icon: "/assets/icons-svgs/edition-graphic.svg",
	},
	{
		value: "100%",
		label: "Community-driven",
		icon: "/assets/icons-svgs/community-graphic.svg",
	},
	{
		value: "Global",
		label: "Developer network",
		icon: "/assets/icons-svgs/globe-graphic.svg",
	},
];

export function EffectDaysPage() {
	return (
		<div className="relative min-h-screen bg-zinc-950 text-white">
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
				className="text-whiteno-underline absolute -left-[9999px] z-[999] rounded-br-lg bg-zinc-800 px-6 py-4 font-semibold focus:top-0 focus:left-0"
			>
				Skip to main content
			</a>

      <Navigation activePath="/events" transparent />
			<GridOverlay />

			{/* Vertical border lines container */}
			<div className="pointer-events-none fixed top-0 right-0 bottom-0 left-0 z-[101] hidden lg:block">
				<div className="relative mx-auto h-full w-full max-w-[73.75rem]">
					{/* Left vertical line */}
					<div className="absolute top-0 bottom-0 left-0 w-px bg-zinc-600/50" />
					{/* Right vertical line */}
					<div className="absolute top-0 right-0 bottom-0 w-px bg-zinc-600/50" />
				</div>
			</div>

			{/* Center vertical line - dashed, behind content */}
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

			<main id="main-content" className="relative z-10 w-full pt-16">
				{/* Background image with gradient overlay */}
				<div
					className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[39.4rem] overflow-hidden"
					style={{
						backgroundImage: `linear-gradient(to bottom, rgba(9, 9, 11, 0.1) 0%, rgba(9, 9, 11, 0.2) 50%, #09090b 100%), url(${getAssetPath("/assets/images/malaga-bg-1.png")})`,
						backgroundSize: "100% 40rem",
						backgroundPosition: "center",
						backgroundRepeat: "no-repeat",
						opacity: 0.75,
					}}
				/>

				{/* Hero Section */}
				<section className="relative w-full pt-20 pb-16 md:pt-24 md:pb-32">
					<div className="relative mx-auto w-full max-w-[73.75rem] px-4">
						<div className="flex flex-col lg:flex-row lg:items-start lg:justify-between lg:gap-12">
							{/* Left side - Main content */}
							<div className="flex-1">
								<p className="mb-4 font-mono text-base font-semibold tracking-wide text-zinc-100">
									<span className="text-violet-400">import</span> {"{"}{" "}
									yourTicket {"}"} <span className="text-violet-400">from</span>{" "}
									<span className="text-emerald-400">"effect-days-2026"</span>
								</p>
								<h1 className="text-4xl font-bold text-white md:text-6xl lg:text-7xl">
									Effect Days 2026
								</h1>
								<p className="mt-6 text-xl font-medium text-white">
									Workshop Day · Conference Day · Community Day
								</p>

								{/* CTA Buttons */}
								<div className="mt-10 flex flex-col items-start gap-4 sm:flex-row">
									<Button
										href="#tickets"
										variant="primary"
										size="lg"
										className="group"
									>
										<i className="ri-coupon-line text-lg" />
										Get your ticket
									</Button>
									<Button
										href="https://discord.gg/effect-ts"
										variant="secondary"
										size="lg"
										className="border-zinc-300 bg-zinc-400/5 backdrop-blur-[3px] hover:border-zinc-400 hover:bg-zinc-700/10"
									>
										<i className="ri-discord-fill text-lg" />
										Join the community
									</Button>
								</div>
							</div>

							{/* Right side - Event info (ticket stub style) */}
							<div className="mt-10 hidden shrink-0 lg:mt-0 lg:block">
								{/* Hidden SVG for clip-path definition - must be rendered first */}
								<svg className="absolute h-0 w-0" aria-hidden="true">
									<defs>
										<clipPath
											id="ticket-clip-path"
											clipPathUnits="userSpaceOnUse"
										>
											{/* Ticket shape with semicircular cutouts on both sides */}
											<path d="M 0,0 H 280 V 51.5 A 8.5,8.5 0 0 0 280,68.5 V 120 H 0 V 68.5 A 8.5,8.5 0 0 0 0,51.5 Z" />
										</clipPath>
									</defs>
								</svg>

								<div className="relative h-[120px] w-[280px]">
									{/* Backdrop blur layer with clip-path */}
									<div
										className="absolute inset-0 bg-zinc-700/10 backdrop-blur-[5px]"
										style={{
											clipPath: "url(#ticket-clip-path)",
										}}
									/>

									{/* SVG for border */}
									<svg
										className="absolute inset-0 h-full w-full"
										viewBox="0 0 280 120"
										fill="none"
									>
										{/* Border - top, bottom, and sides (without perforations) */}
										<path
											d="M 0.5,51.5 V 0.5 H 279.5 V 51.5"
											fill="none"
											stroke="rgb(161, 161, 170)"
											strokeWidth="1"
										/>
										<path
											d="M 279.5,68.5 V 119.5 H 0.5 V 68.5"
											fill="none"
											stroke="rgb(161, 161, 170)"
											strokeWidth="1"
										/>
										{/* Solid perforation arcs - curving outward (into the cutout) */}
										<path
											d="M 279.5,51.5 A 8,8 0 0 0 279.5,68.5"
											fill="none"
											stroke="rgb(161, 161, 170)"
											strokeWidth="1"
										/>
										<path
											d="M 0.5,68.5 A 8,8 0 0 0 0.5,51.5"
											fill="none"
											stroke="rgb(161, 161, 170)"
											strokeWidth="1"
										/>
										{/* Dashed line between cutouts */}
										<line
											x1="20"
											y1="60"
											x2="260"
											y2="60"
											stroke="rgb(113, 113, 122)"
											strokeWidth="1"
											strokeDasharray="2 2"
										/>
									</svg>

									{/* Content overlay */}
									<div className="absolute inset-0 flex flex-col">
										{/* Top section - Date */}
										<div className="flex flex-1 items-center px-6">
											<div className="flex items-center gap-2.5">
												<i className="ri-calendar-line text-[1.1rem] text-zinc-200" />
												<p className="font-mono text-[1.1rem] font-medium text-white uppercase">
													May 6–8, 2026
												</p>
											</div>
										</div>
										{/* Bottom section - Location */}
										<div className="flex flex-1 items-center px-6">
											<div className="flex items-center gap-2.5">
												<i className="ri-map-pin-2-line text-[1.1rem] text-zinc-200" />
												<p className="font-mono text-[1.1rem] font-medium text-white uppercase">
													Málaga, Spain
												</p>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* Stats Section */}
				<section className="pb-24">
					<div className="mx-auto w-full max-w-[73.75rem] px-4">
						<div className="border-t border-zinc-700 pt-24">
							<div className="grid grid-cols-1 gap-8 md:grid-cols-3">
								{STATS.map((stat, index) => (
									<div
										key={index}
										className="flex flex-col items-center text-center"
									>
										<img
											src={getAssetPath(stat.icon)}
											alt=""
											className="mb-4 h-10 w-10"
										/>
										<div className="text-3xl font-bold text-white md:text-4xl">
											{stat.value}
										</div>
										<div className="mt-2 font-mono text-sm tracking-wide text-zinc-400 uppercase">
											{stat.label}
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</section>

				{/* Speakers Section */}
				<section className="pb-32">
					<div className="mx-auto w-full max-w-[73.75rem] px-4">
						<div className="border-t border-zinc-800 pt-12">
							{/* Header with button */}
							<div className="mb-10 flex items-center justify-between">
								<div className="flex items-baseline gap-3">
									<h2 className="leading-tighter font-mono text-base font-semibold tracking-wide text-zinc-200 uppercase">
										<span className="text-violet-400">//</span> Speakers
									</h2>
									<span className="text-sm text-zinc-400">
										+ more coming soon
									</span>
								</div>
								<Button
									href="https://docs.google.com/forms/d/e/1FAIpQLSeOd9On6nWXgysWDk49Ti3zYX11TS6ZkuoC-4Qofs8ieVmP4A/viewform"
									variant="secondary"
									className="text-base"
								>
									<i className="ri-mic-line text-lg" />
									Apply to speak
								</Button>
							</div>

							{/* Speaker Grid */}
							<div className="grid grid-cols-2 gap-0 sm:grid-cols-4">
								{/* Dillon Mulroy */}
								<a
									href="https://x.com/dillon_mulroy"
									target="_blank"
									rel="noopener noreferrer"
									className="group relative aspect-square overflow-hidden"
								>
									<img
										src={getAssetPath("/assets/images/dillon-1.png")}
										alt="Dillon Mulroy"
										className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
									/>
									<div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
									<div className="absolute right-3 bottom-3 left-3">
										<span className="block text-sm font-medium text-white">
											Dillon Mulroy
										</span>
										<span className="text-xs text-zinc-400">Cloudflare</span>
									</div>
								</a>

								{/* Kit Langton */}
								<a
									href="https://x.com/kitlangton"
									target="_blank"
									rel="noopener noreferrer"
									className="group relative aspect-square overflow-hidden"
								>
									<img
										src={getAssetPath("/assets/images/kitlangton.jpg")}
										alt="Kit Langton"
										className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
									/>
									<div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
									<div className="absolute right-3 bottom-3 left-3">
										<span className="block text-sm font-medium text-white">
											Kit Langton
										</span>
										<span className="text-xs text-zinc-400">Effectful</span>
									</div>
								</a>

								{/* Tim Smart */}
								<a
									href="https://x.com/tim_smart"
									target="_blank"
									rel="noopener noreferrer"
									className="group relative aspect-square overflow-hidden"
								>
									<img
										src={getAssetPath("/assets/images/timsmart.jpg")}
										alt="Tim Smart"
										className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
									/>
									<div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
									<div className="absolute right-3 bottom-3 left-3">
										<span className="block text-sm font-medium text-white">
											Tim Smart
										</span>
										<span className="text-xs text-zinc-400">Effectful</span>
									</div>
								</a>

								{/* Maxwell Brown */}
								<a
									href="https://x.com/imax153"
									target="_blank"
									rel="noopener noreferrer"
									className="group relative aspect-square overflow-hidden"
								>
									<img
										src={getAssetPath("/assets/images/max.png")}
										alt="Maxwell Brown"
										className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
									/>
									<div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
									<div className="absolute right-3 bottom-3 left-3">
										<span className="block text-sm font-medium text-white">
											Maxwell Brown
										</span>
										<span className="text-xs text-zinc-400">Effectful</span>
									</div>
								</a>
							</div>
						</div>
					</div>
				</section>

				{/* Tickets Section */}
				<section id="tickets" className="scroll-mt-16 pb-16">
					<div className="mx-auto w-full max-w-[73.75rem] px-4">
						<div className="border-t border-zinc-800 pt-12">
							<h2 className="leading-tighter mb-10 font-mono text-base font-semibold tracking-wide text-zinc-200 uppercase">
								<span className="text-violet-400">//</span> Effect Days Tickets
							</h2>

							<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
								{/* Full Pass Card */}
								<div className="relative flex flex-col overflow-hidden border border-zinc-600 bg-zinc-900/50">
									<div className="p-6">
										{/* Header */}
										<div className="mb-6">
											<div className="flex items-baseline justify-between gap-4">
												<h3 className="text-xl font-semibold text-white">
													Full Pass
												</h3>
												<p className="text-sm text-zinc-400">
													The complete Effect Days experience
												</p>
											</div>
											<div
												className="mt-4 h-px w-full"
												style={{
													backgroundImage:
														"repeating-linear-gradient(to right, rgb(82 82 91) 0px, rgb(82 82 91) 2px, transparent 2px, transparent 4px)",
												}}
											/>
										</div>

										{/* Days included */}
										<div className="mb-6 space-y-3">
											<div className="flex items-center gap-3">
												<div className="flex h-8 w-8 items-center justify-center rounded-md border border-emerald-500/20 bg-emerald-500/10">
													<i className="ri-tools-line text-emerald-400" />
												</div>
												<p className="text-sm font-medium text-white">
													May 6 · Workshop Day
												</p>
											</div>
											<div className="flex items-center gap-3">
												<div className="flex h-8 w-8 items-center justify-center rounded-md border border-emerald-500/20 bg-emerald-500/10">
													<i className="ri-mic-line text-emerald-400" />
												</div>
												<p className="text-sm font-medium text-white">
													May 7 · Conference Day
												</p>
											</div>
											<div className="flex items-center gap-3">
												<div className="flex h-8 w-8 items-center justify-center rounded-md border border-emerald-500/20 bg-emerald-500/10">
													<i className="ri-group-line text-emerald-400" />
												</div>
												<p className="text-sm font-medium text-white">
													May 8 · Community Day
												</p>
											</div>
										</div>

										{/* CTAs */}
										<div className="space-y-3">
											<Button
												href="#"
												variant="primary"
												className="flex w-full items-center justify-between"
											>
												<div className="flex items-center gap-2">
													<i className="ri-user-line text-zinc-600" />
													<span className="text-base font-medium text-zinc-950">
														Individual
													</span>
												</div>
												<div className="flex items-center gap-2">
													<span className="text-lg font-bold text-zinc-900">
														$449
													</span>
													<i className="ri-arrow-right-up-line text-sm text-zinc-600" />
												</div>
											</Button>
											<Button
												href="#"
												variant="secondary"
												className="flex w-full items-center justify-between border-zinc-600 hover:bg-zinc-800/80"
											>
												<div className="flex items-center gap-2">
													<i className="ri-building-line text-zinc-300" />
													<span className="text-base font-medium text-white">
														Business
													</span>
												</div>
												<div className="flex items-center gap-2">
													<span className="text-lg font-bold text-white">
														$549
													</span>
													<i className="ri-arrow-right-up-line text-sm text-zinc-400" />
												</div>
											</Button>
										</div>
									</div>
								</div>

								{/* Conference Pass Card */}
								<div className="relative flex flex-col overflow-hidden border border-zinc-800 bg-zinc-900/30">
									<div className="p-6">
										{/* Header */}
										<div className="mb-6">
											<div className="flex items-baseline justify-between gap-4">
												<h3 className="text-xl font-semibold text-white">
													2-day Pass
												</h3>
												<p className="text-sm text-zinc-400">
													Conference & Community Day access
												</p>
											</div>
											<div
												className="mt-4 h-px w-full"
												style={{
													backgroundImage:
														"repeating-linear-gradient(to right, rgb(82 82 91) 0px, rgb(82 82 91) 2px, transparent 2px, transparent 4px)",
												}}
											/>
										</div>

										{/* Days included */}
										<div className="mb-6 space-y-3">
											<div className="flex items-center gap-3">
												<div className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-700 bg-zinc-800">
													<i className="ri-close-line text-zinc-600" />
												</div>
												<p className="text-sm font-medium text-zinc-400">
													May 6 · Workshop Day
												</p>
											</div>
											<div className="flex items-center gap-3">
												<div className="flex h-8 w-8 items-center justify-center rounded-md border border-emerald-500/20 bg-emerald-500/10">
													<i className="ri-mic-line text-emerald-400" />
												</div>
												<p className="text-sm font-medium text-white">
													May 7 · Conference Day
												</p>
											</div>
											<div className="flex items-center gap-3">
												<div className="flex h-8 w-8 items-center justify-center rounded-md border border-emerald-500/20 bg-emerald-500/10">
													<i className="ri-group-line text-emerald-400" />
												</div>
												<p className="text-sm font-medium text-white">
													May 8 · Community Day
												</p>
											</div>
										</div>

										{/* CTAs */}
										<div className="space-y-3">
											<Button
												href="#"
												variant="primary"
												className="flex w-full items-center justify-between"
											>
												<div className="flex items-center gap-2">
													<i className="ri-user-line text-zinc-600" />
													<span className="text-base font-medium text-zinc-950">
														Individual
													</span>
												</div>
												<div className="flex items-center gap-2">
													<span className="text-lg font-bold text-zinc-900">
														$314
													</span>
													<i className="ri-arrow-right-up-line text-sm text-zinc-600" />
												</div>
											</Button>
											<Button
												href="#"
												variant="secondary"
												className="flex w-full items-center justify-between border-zinc-600 hover:bg-zinc-800/80"
											>
												<div className="flex items-center gap-2">
													<i className="ri-building-line text-zinc-300" />
													<span className="text-base font-medium text-white">
														Business
													</span>
												</div>
												<div className="flex items-center gap-2">
													<span className="text-lg font-bold text-white">
														$399
													</span>
													<i className="ri-arrow-right-up-line text-sm text-zinc-400" />
												</div>
											</Button>
										</div>
									</div>
								</div>
							</div>

							<div className="mt-8 flex flex-col gap-4 text-sm text-zinc-400 md:flex-row md:justify-between">
								<p>
									Buying 4+ business tickets?{" "}
									<Link
										href="mailto:contact@effectful.co"
										variant="inline"
										className="underline-offset-2"
									>
										Contact us for group discounts.
									</Link>
								</p>
								<p className="flex shrink-0 items-center gap-2 md:text-right">
									<i className="ri-hand-heart-line text-white" />
									<span>
										<Link
											href="mailto:contact@effectful.co?subject=Effect Days 2026 - Sponsorship Inquiry"
											variant="inline"
											className="underline-offset-2"
										>
											Sponsor Effect Days
										</Link>{" "}
										and get tickets included.
									</span>
								</p>
							</div>
						</div>
					</div>
				</section>

				{/* Málaga Section */}
				<section className="py-16">
					<div className="mx-auto w-full max-w-[73.75rem] px-4">
						<div className="border-t border-zinc-800 pt-12">
							{/* Header */}
							<div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
								<div>
									<p className="mb-4 font-mono text-base font-semibold tracking-wide text-zinc-200 uppercase">
										<span className="text-violet-400">//</span> Why Málaga
									</p>
									<h3 className="text-2xl font-semibold text-white md:text-3xl">
										3 days on the Costa del Sol
									</h3>
									<p className="mt-4 max-w-lg text-base leading-relaxed text-zinc-400">
										Home to a growing startup ecosystem, world-class museums,
										and stunning architecture, Málaga is the perfect setting for
										Effect Days.
									</p>
								</div>
								<Link
									href="/events/effect-days/malaga"
									variant="subtle"
									className="inline-flex shrink-0 items-center gap-2 font-medium"
								>
									Discover Málaga
									<i className="ri-arrow-right-line text-xs" />
								</Link>
							</div>

							{/* Two featured images */}
							<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
								<div className="aspect-video overflow-hidden rounded-lg">
									<img
										src={getAssetPath(
											"/assets/images/david-ramirez-x-qfJn2F8KE-unsplash.jpg",
										)}
										alt="Málaga sunset"
										className="h-full w-full object-cover"
									/>
								</div>
								<div className="aspect-video overflow-hidden rounded-lg">
									<img
										src={getAssetPath("/assets/images/malaga-7.webp")}
										alt="Málaga panoramic view"
										className="h-full w-full object-cover"
										style={{ objectPosition: "center 20%" }}
									/>
								</div>
							</div>

							{/* Four smaller images below */}
							<div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
								<div className="aspect-4/3 overflow-hidden rounded-lg">
									<img
										src={getAssetPath(
											"/assets/images/maria-lopez-jorge-WTu0MyP8Vcw-unsplash.jpg",
										)}
										alt="Málaga harbor"
										className="h-full w-full object-cover"
									/>
								</div>
								<div className="aspect-4/3 overflow-hidden rounded-lg">
									<img
										src={getAssetPath(
											"/assets/images/yuliya-matuzava-0-cPhoediX8-unsplash.jpg",
										)}
										alt="Málaga cityscape"
										className="h-full w-full object-cover"
									/>
								</div>
								<div className="aspect-4/3 overflow-hidden rounded-lg">
									<img
										src={getAssetPath(
											"/assets/images/marek-zernik-RZ0m2Enxsc8-unsplash.jpg",
										)}
										alt="Málaga architecture"
										className="h-full w-full object-cover"
									/>
								</div>
								<div className="aspect-4/3 overflow-hidden rounded-lg">
									<img
										src={getAssetPath(
											"/assets/images/roberto-arias-E9llbh8kIqM-unsplash.jpg",
										)}
										alt="Málaga beach"
										className="h-full w-full object-cover"
									/>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* FAQ Section */}
				<section className="py-16">
					<div className="mx-auto w-full max-w-[73.75rem] px-4">
						<div className="border-t border-zinc-800 pt-12">
							<h2 className="leading-tighter mb-10 font-mono text-base font-semibold tracking-wide text-zinc-200 uppercase">
								<span className="text-violet-400">//</span> Frequently Asked
								Questions
							</h2>

							<div className="grid grid-cols-1 gap-x-12 gap-y-0 md:grid-cols-2">
								<div className="border-b border-zinc-800/50 py-5">
									<h3 className="text-[15px] font-semibold text-white">
										1. What is Effect Days?
									</h3>
									<p className="mt-2 text-sm leading-relaxed text-zinc-400">
										Effect Days is a non-profit event dedicated to{" "}
										<Link
											href="https://effect.website"
											variant="inline"
											className="decoration-zinc-600 underline-offset-2 hover:decoration-zinc-400"
										>
											Effect
										</Link>
										, an open-source software library for building
										production-grade applications in TypeScript.
									</p>
								</div>

								<div className="border-b border-zinc-800/50 py-5">
									<h3 className="text-[15px] font-semibold text-white">
										2. What is the schedule of the conference?
									</h3>
									<p className="mt-2 text-sm leading-relaxed text-zinc-400">
										The conference schedule will be shared as we get closer to
										the event.
									</p>
								</div>

								<div className="border-b border-zinc-800/50 py-5">
									<h3 className="text-[15px] font-semibold text-white">
										3. Will the Effect Days conference be recorded?
									</h3>
									<p className="mt-2 text-sm leading-relaxed text-zinc-400">
										The conference talks will be recorded and published on the{" "}
										<Link
											href="https://www.youtube.com/@effect-ts"
											variant="inline"
											className="decoration-zinc-600 underline-offset-2 hover:decoration-zinc-400"
										>
											Effect YouTube channel
										</Link>{" "}
										a few weeks later.
									</p>
								</div>

								<div className="border-b border-zinc-800/50 py-5">
									<h3 className="text-[15px] font-semibold text-white">
										4. What is the Community Day?
									</h3>
									<p className="mt-2 text-sm leading-relaxed text-zinc-400">
										The Community Day on May 8th is a full day dedicated to
										deeper discussions, networking, and community activities.
									</p>
								</div>

								<div className="border-b border-zinc-800/50 py-5">
									<h3 className="text-[15px] font-semibold text-white">
										5. Can I get a refund for my ticket?
									</h3>
									<p className="mt-2 text-sm leading-relaxed text-zinc-400">
										Please refer to our{" "}
										<Link
											href="#"
											variant="inline"
											className="decoration-zinc-600 underline-offset-2 hover:decoration-zinc-400"
										>
											Refund Policy
										</Link>{" "}
										for more details.
									</p>
								</div>

								<div className="border-b border-zinc-800/50 py-5">
									<h3 className="text-[15px] font-semibold text-white">
										6. Is there a Code of Conduct?
									</h3>
									<p className="mt-2 text-sm leading-relaxed text-zinc-400">
										Yes. Effect Days is dedicated to providing a harassment-free
										experience for everyone. Please read our{" "}
										<Link
											href="/events/code-of-conduct"
											variant="inline"
											className="decoration-zinc-600 underline-offset-2 hover:decoration-zinc-400"
										>
											Code of Conduct
										</Link>
										.
									</p>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* Past Editions Section */}
				<section id="past-editions" className="py-16">
					<div className="mx-auto w-full max-w-[73.75rem] px-4">
						<div className="border-t border-zinc-800 pt-12">
							<h2 className="leading-tighter mb-10 font-mono text-base font-semibold tracking-wide text-zinc-200 uppercase">
								<span className="text-violet-400">//</span> Relive Effect Days
							</h2>

							<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
								{PAST_EDITIONS.map((edition) => (
									<div
										key={edition.year}
										className="flex flex-col overflow-hidden border border-zinc-800 bg-zinc-900/20"
									>
										{/* Image with overlay */}
										<div className="relative aspect-[16/9] overflow-hidden">
											<img
												src={getAssetPath(edition.image)}
												alt={`Effect Days ${edition.year}`}
												className="h-full w-full object-cover"
											/>
											<div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
											<div className="absolute right-5 bottom-4 left-5">
												<span className="inline-block border border-white/10 bg-white/0 px-2.5 py-1 font-mono text-xs font-medium text-white/90 uppercase backdrop-blur-sm">
													{edition.badge}
												</span>
											</div>
										</div>

										{/* Content */}
										<div className="flex flex-1 flex-col p-5">
											<h3 className="text-xl font-semibold text-white">
												Effect Days {edition.year}
											</h3>

											<div className="mt-2 flex items-center gap-3 text-sm text-zinc-400">
												<span className="flex items-center gap-1">
													<i className="ri-map-pin-line" />
													{edition.location}
												</span>
												<span>·</span>
												<span>{edition.dates}</span>
											</div>

											<p className="mt-4 text-[15px] leading-relaxed text-zinc-400">
												{edition.description}
											</p>

											<div className="mt-5 flex items-center gap-4 border-t border-zinc-800 pt-5">
												<div className="flex items-center gap-5 text-sm text-zinc-400">
													<span className="flex items-center gap-1.5">
														<i className="ri-mic-line" />
														{edition.talks} talks
													</span>
													<span className="flex items-center gap-1.5">
														<i className="ri-tools-line" />
														{edition.workshops} workshops
													</span>
												</div>
												<Link
													href={edition.playlistUrl}
													variant="subtle"
													className="ml-auto inline-flex items-center gap-1.5 font-medium"
												>
													<i className="ri-youtube-fill text-base" />
													Full playlist
													<i className="ri-arrow-right-up-line text-xs" />
												</Link>
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</section>

				{/* Next Edition CTA Section */}
				<section className="relative overflow-hidden">
					{/* Grid background */}
					<div
						className="pointer-events-none absolute inset-0"
						style={{
							backgroundImage: `
                linear-gradient(to right, rgba(24, 24, 27, 0.8) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(24, 24, 27, 0.8) 1px, transparent 1px)
              `,
							backgroundSize: "196.6px 162px",
							backgroundPosition: "calc(50% + 97px) 0",
						}}
					/>
					{/* Fade out grid at top and bottom */}
					<div
						className="pointer-events-none absolute inset-0"
						style={{
							background:
								"linear-gradient(to bottom, #09090b 0%, transparent 15%, transparent 80%, #09090b 100%)",
						}}
					/>
					<div className="relative mx-auto w-full max-w-[73.75rem] px-4">
						<div className="border-t border-zinc-800 py-28">
							<div className="text-center">
								<h2 className="leading-tighter text-2xl font-bold text-white md:text-4xl">
									Ready for Effect Days 2026?
								</h2>
								<p className="mx-auto mt-4 max-w-2xl text-xl text-zinc-400">
									Secure your spot for May 6-8, 2026 and enjoy three days in the
									Mediterranean coast.
								</p>

								<div className="mt-8">
									<Button
										href="#tickets"
										variant="primary"
										size="xl"
										className="group"
									>
										<i className="ri-coupon-line text-lg" />
										Get your ticket
									</Button>
								</div>
							</div>
						</div>
					</div>
				</section>
			</main>

      <Footer activePath="/events" hideCommunityBorder />
		</div>
	);
}
