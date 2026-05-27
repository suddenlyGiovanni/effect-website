import { useState } from "react";
import type { Episode } from "../../data/episodes";
import { formatTimestamp } from "../../utils/srtParser";
import { GridOverlay } from "../GridOverlay";
import { Footer } from "./Footer";
import { Navigation } from "./Navigation";

interface TranscriptParagraph {
	startTime: string;
	text: string;
}

interface EpisodePageProps {
	episode: Episode;
	transcript?: TranscriptParagraph[];
}

export function EpisodePage({ episode, transcript = [] }: EpisodePageProps) {
	const [isExpanded, setIsExpanded] = useState(false);

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
				{/* Episode header */}
				<section className="relative w-full bg-zinc-950 pt-16 pb-10">
					<div className="mx-auto max-w-[73.75rem] px-4">
						<nav aria-label="Breadcrumb" className="mb-4">
							<ol className="flex items-center gap-2 font-mono font-medium text-sm tracking-wider text-zinc-500 uppercase">
								<li>
									<a
										href={"/podcast"}
										className="text-white transition-opacity hover:opacity-80"
									>
										Cause & Effect 🎙️
									</a>
								</li>
								<li>/</li>
								<li className="text-zinc-400">
									Episode #{episode.number.toString().padStart(2, "0")}
								</li>
							</ol>
						</nav>

						<h1 className="max-w-2/3 text-3xl font-semibold tracking-tight text-white">{episode.title}</h1>
					</div>
				</section>

				{/* Video + Transcript Section */}
				<section className="w-full border-t border-zinc-800 bg-zinc-950 py-8">
					<div className="mx-auto max-w-[73.75rem] px-4">
						{/* When expanded: Video is full width, content below in grid */}
						{isExpanded ? (
							<>
								{/* Full-width video */}
								<div className="relative aspect-video w-full overflow-hidden rounded-lg bg-zinc-900">
									<iframe
										src={`https://www.youtube.com/embed/${episode.youtubeId}`}
										title={episode.title}
										allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
										referrerPolicy="no-referrer-when-downgrade"
										allowFullScreen
										loading="lazy"
										className="absolute inset-0 h-full w-full border-0"
									/>
								</div>

								{/* Collapse button */}
								<div className="mt-4 hidden lg:block">
									<button
										onClick={() => setIsExpanded(false)}
										className="inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
									>
										<i className="ri-collapse-diagonal-line" />
										<span>Collapse video</span>
									</button>
								</div>

								{/* Content grid below video */}
								<div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
									{/* About and Chapters - Main column */}
									<div className="lg:col-span-2 lg:pr-16">
										{/* Chapters */}
										{episode.chapters && episode.chapters.length > 0 && (
											<div className="mt-6">
												<h3 className="mb-3 text-lg font-semibold text-white">
													Chapters
												</h3>
												<ul className="space-y-2">
													{episode.chapters.map((chapter, i) => (
														<li
															key={i}
															className="flex items-start gap-3 text-sm"
														>
															<span className="font-mono text-zinc-400">
																{chapter.time}
															</span>
															<span className="text-zinc-400">
																{chapter.title}
															</span>
														</li>
													))}
												</ul>
											</div>
										)}
									</div>

									{/* Sidebar - Guest info and Transcript */}
									<div>
										<div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
											<p className="mb-2 text-xs font-medium tracking-wider text-zinc-300 uppercase">
												Featured Guest
											</p>
											<p className="text-lg font-semibold text-white">
												{episode.guest}
											</p>
											<div className="mt-3 flex items-center gap-2 text-sm text-zinc-400">
												{episode.companyLogo && (
													<a href={episode.companyUrl} target="_blank" rel="noopener noreferrer">
														<img src={episode.companyLogo} alt={episode.company} className="h-5" />
													</a>
												)}
												<span>·</span>
												<span>{episode.date}</span>
												<span>·</span>
												<span>{episode.duration}</span>
											</div>

											{/* Listen on platforms */}
											<div className="mt-4 border-t border-zinc-800 pt-4">
												<p className="mb-3 text-xs font-medium tracking-wider text-zinc-400 uppercase">
													Listen on
												</p>
												<div className="flex items-center gap-4">
													<a
														href="https://podcasts.apple.com/us/podcast/cause-effect/id1781879869"
														target="_blank"
														rel="noopener noreferrer"
														className="flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
													>
														<svg
															className="h-5 w-5 shrink-0"
															viewBox="0 0 300 300"
															fill="none"
															xmlns="http://www.w3.org/2000/svg"
														>
															<defs>
																<linearGradient
																	id="podcastGradientExpanded"
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
																fill="url(#podcastGradientExpanded)"
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
														<span className="text-white hover:underline">
															Apple Podcasts
														</span>
													</a>
													<a
														href="https://open.spotify.com/show/4QTFiem4o0G9V2vXtv8vMU"
														target="_blank"
														rel="noopener noreferrer"
														className="flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
													>
														<i className="ri-spotify-fill text-lg text-green-500" />
														<span className="text-white hover:underline">
															Spotify
														</span>
													</a>
													<a
														href={`https://www.youtube.com/watch?v=${episode.youtubeId}`}
														target="_blank"
														rel="noopener noreferrer"
														className="flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
													>
														<i className="ri-youtube-fill text-lg text-red-500" />
														<span className="text-white hover:underline">
															YouTube
														</span>
													</a>
												</div>
											</div>

										</div>

										{/* Transcript */}
										{transcript && transcript.length > 0 && (
											<div className="relative mt-6">
												<h3 className="mb-4 text-lg font-semibold text-white">
													Transcript
												</h3>
												<div className="relative">
													<div className="scrollbar-thin max-h-[500px] space-y-2 overflow-y-auto pr-4">
														{transcript.map((entry, i) => (
															<div key={i} className="flex gap-4">
																<span className="w-12 shrink-0 font-mono text-sm text-zinc-400">
																	{formatTimestamp(entry.startTime)}
																</span>
																<p className="flex-1 text-sm leading-relaxed text-zinc-300">
																	{entry.text}
																</p>
															</div>
														))}
													</div>
													{/* Bottom fade to indicate more content */}
													<div
														className="pointer-events-none absolute right-0 bottom-0 left-0 h-16"
														style={{
															background:
																"linear-gradient(to bottom, transparent, #09090b)",
														}}
													/>
												</div>
											</div>
										)}
									</div>
								</div>
							</>
						) : (
							/* Collapsed: Video in grid with sidebar */
							<div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
								{/* Video, About, and Chapters - Main column */}
								<div className="lg:col-span-2 lg:pr-16">
									<div className="relative aspect-video w-full overflow-hidden rounded-lg bg-zinc-900">
										<iframe
											src={`https://www.youtube.com/embed/${episode.youtubeId}`}
											title={episode.title}
											allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
											referrerPolicy="no-referrer-when-downgrade"
											allowFullScreen
											loading="lazy"
											className="absolute inset-0 h-full w-full border-0"
										/>
									</div>

									{/* Expand button */}
									<div className="mt-4 hidden justify-end lg:flex">
										<button
											onClick={() => setIsExpanded(true)}
											className="inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
										>
											<i className="ri-expand-diagonal-line" />
											<span>Expand video</span>
										</button>
									</div>

									{/* Chapters */}
									{episode.chapters && episode.chapters.length > 0 && (
										<div className="mt-8 mb-12">
											<h3 className="mb-3 text-lg font-semibold text-white">
												Chapters
											</h3>
											<ul className="space-y-2">
												{episode.chapters.map((chapter, i) => (
													<li
														key={i}
														className="flex items-start gap-3 text-sm"
													>
														<span className="font-mono text-zinc-400">
															{chapter.time}
														</span>
														<span className="text-zinc-200">
															{chapter.title}
														</span>
													</li>
												))}
											</ul>
										</div>
									)}
								</div>

								{/* Sidebar - Guest info and Transcript */}
								<div>
									<div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
										<p className="mb-2 text-xs font-medium tracking-wider text-zinc-400 uppercase">
											Featured Guest
										</p>
										<p className="text-lg font-semibold text-white">
											{episode.guest}
										</p>
										<div className="mt-3 flex items-center gap-2 text-sm text-zinc-400">
											{episode.companyLogo && (
												<a href={episode.companyUrl} target="_blank" rel="noopener noreferrer">
													<img src={episode.companyLogo} alt={episode.company} className="h-5" />
												</a>
											)}
											<span>·</span>
											<span>{episode.date}</span>
											<span>·</span>
											<span>{episode.duration}</span>
										</div>

										{/* Listen on platforms */}
										<div className="mt-4 border-t border-zinc-800 pt-4">
											<p className="mb-3 text-xs font-medium tracking-wider text-zinc-400 uppercase">
												Listen on
											</p>
											<div className="flex items-center gap-4">
												<a
													href="https://podcasts.apple.com/us/podcast/cause-effect/id1781879869"
													target="_blank"
													rel="noopener noreferrer"
													className="flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
												>
													<svg
														className="h-5 w-5 shrink-0"
														viewBox="0 0 300 300"
														fill="none"
														xmlns="http://www.w3.org/2000/svg"
													>
														<defs>
															<linearGradient
																id="podcastGradientCollapsed"
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
															fill="url(#podcastGradientCollapsed)"
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
													<span className="text-white hover:underline">
														Apple Podcasts
													</span>
												</a>
												<a
													href="https://open.spotify.com/show/4QTFiem4o0G9V2vXtv8vMU"
													target="_blank"
													rel="noopener noreferrer"
													className="flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
												>
													<i className="ri-spotify-fill text-lg text-green-500" />
													<span className="text-white hover:underline">
														Spotify
													</span>
												</a>
												<a
													href={`https://www.youtube.com/watch?v=${episode.youtubeId}`}
													target="_blank"
													rel="noopener noreferrer"
													className="flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
												>
													<i className="ri-youtube-fill text-lg text-red-500" />
													<span className="text-white hover:underline">
														YouTube
													</span>
												</a>
											</div>
										</div>

									</div>

									{/* Transcript */}
									{transcript && transcript.length > 0 && (
										<div className="relative mt-6">
											<h3 className="mb-4 text-lg font-semibold text-white">
												Transcript
											</h3>
											<div className="relative">
												<div className="scrollbar-thin max-h-[500px] space-y-2 overflow-y-auto pr-4">
													{transcript.map((entry, i) => (
														<div key={i} className="flex gap-4">
															<span className="w-12 shrink-0 font-mono text-sm text-zinc-400">
																{formatTimestamp(entry.startTime)}
															</span>
															<p className="flex-1 text-sm leading-relaxed text-zinc-300">
																{entry.text}
															</p>
														</div>
													))}
												</div>
												{/* Bottom fade to indicate more content */}
												<div
													className="pointer-events-none absolute right-0 bottom-0 left-0 h-16"
													style={{
														background:
															"linear-gradient(to bottom, transparent, #09090b)",
													}}
												/>
											</div>
										</div>
									)}
								</div>
							</div>
						)}
					</div>
				</section>

				{/* More episodes CTA */}
				<section className="relative w-full overflow-hidden border-t border-zinc-800 py-20">
					<div
						className="pointer-events-none absolute inset-0"
						style={{
							background: "radial-gradient(circle at 50% 50%, rgba(34, 197, 94, 0.12) 0%, transparent 30%)",
						}}
					/>
					<div className="relative mx-auto max-w-[73.75rem] px-4 text-center">
						<p className="mb-3 font-mono text-sm font-medium tracking-wider text-zinc-400 uppercase">
							{"// Cause & Effect 🎙️"}
						</p>
						<h3 className="text-3xl font-semibold tracking-tight text-white">
							Real-world systems with Effect
						</h3>
						<p className="mt-2 text-zinc-400">
							How teams like Vercel, MasterClass, and others build in production.
						</p>
						<a
							href={"/podcast"}
							className="mt-6 inline-flex items-center gap-2 rounded-md bg-white px-6 py-3 text-base font-medium text-zinc-900 transition-all hover:bg-zinc-200"
						>
							<span>See all episodes</span>
							<i className="ri-arrow-right-line" />
						</a>
					</div>
				</section>
			</main>

			<Footer hideCommunityBorder activePath="/podcast" />
		</div>
	);
}
