import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	BLOG_POSTS,
	BLOG_TAGS,
	type BlogPost,
	type BlogTag,
	getPostUrl,
	getTagColor,
} from "../../data/blog";
import { getAssetPath } from "../../utils/assetPath";
import { GridOverlay } from "../GridOverlay";
import { Footer } from "./Footer";
import { Navigation } from "./Navigation";

const POSTS_PER_PAGE = 12;

// React-idiomatic avatar with fallback to initials on load error
function AvatarWithFallback({
	src,
	alt,
	className,
}: { src: string; alt: string; className: string }) {
	const [failed, setFailed] = useState(false);
	if (failed) {
		return (
			<div
				className={className}
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					background: "#27272a",
					color: "#a1a1aa",
					fontSize: "0.6em",
					fontWeight: 600,
				}}
			>
				{(alt || "?").charAt(0).toUpperCase()}
			</div>
		);
	}
	return (
		<img
			src={src}
			alt={alt}
			onError={() => setFailed(true)}
			className={className}
		/>
	);
}

// ── Featured Post ─────────────────────────────────────────────────
function FeaturedPost({ post }: { post: BlogPost }) {
	const url = getPostUrl(post);
	const isExternal = url.startsWith("http");
	return (
		<a
			href={isExternal ? url : getAssetPath(url)}
			{...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
			className="group relative block overflow-hidden rounded-md border border-zinc-800 bg-zinc-900/40 transition-colors duration-200 hover:border-zinc-600 hover:bg-zinc-900/70"
		>
			<div className="relative grid grid-cols-1 gap-4 p-5 md:grid-cols-12 md:items-center md:gap-10 md:p-6">
				<div className="min-w-0 md:col-span-7">
					{/* Label + tags */}
					<div className="mb-3 flex flex-wrap items-center gap-2">
						<span className="inline-flex items-center rounded-md border border-zinc-400 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-[0.18em] text-white uppercase">
							Release
						</span>
					{[...post.tags].filter((tag) => tag !== "Effect" && tag !== "Release").sort((a, b) => a.localeCompare(b)).map((tag) => (
						<span
							key={tag}
							className="inline-flex items-center rounded-md border border-zinc-400 px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] text-zinc-200 uppercase"
							>
								{tag}
							</span>
						))}
					</div>

					<h2 className="text-2xl font-semibold leading-tight tracking-tight text-white md:text-3xl">
						{post.title}
					</h2>

					<p className="mt-2 line-clamp-3 max-w-xl text-base text-zinc-300">
						{post.excerpt}
					</p>

				</div>

				{/* Right side: cover image or CTA arrow */}
				<div className="hidden md:col-span-5 md:flex md:flex-col md:items-center md:gap-3">
					{post.coverImage ? (
						<div className="relative aspect-2/1 w-full overflow-hidden rounded-md border border-zinc-800/50">
							<img
								src={getAssetPath(post.coverImage)}
								alt={post.title}
								className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
							/>
							{/* Bottom fade to blend with card */}
							<div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-zinc-900/60 to-transparent" />
						</div>
					) : (
						<div className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-700 text-zinc-300 transition-colors duration-200 group-hover:border-white group-hover:text-white">
							<i
								className="ri-arrow-right-line text-lg"
							/>
						</div>
					)}
				</div>

				{/* Mobile: cover image below text */}
				{post.coverImage && (
					<div className="relative aspect-video overflow-hidden rounded-md border border-zinc-800/50 md:hidden">
						<img
							src={getAssetPath(post.coverImage)}
							alt={post.title}
							className="absolute inset-0 h-full w-full object-cover"
						/>
					</div>
				)}
			</div>
		</a>
	);
}

// ── Shared Horizontal Scroll Rail ─────────────────────────────────
function HorizontalScrollRail({
	title,
	ariaLabel,
	onViewAll,
	children,
	itemCount,
}: {
	title: string;
	ariaLabel: string;
	onViewAll: () => void;
	children: React.ReactNode;
	itemCount: number;
}) {
	const scrollRef = useRef<HTMLDivElement>(null);
	const [canScrollLeft, setCanScrollLeft] = useState(false);
	const [canScrollRight, setCanScrollRight] = useState(false);

	const updateScrollState = useCallback(() => {
		const el = scrollRef.current;
		if (!el) return;
		setCanScrollLeft(el.scrollLeft > 0);
		setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
	}, []);

	useEffect(() => {
		// Re-check scroll bounds when the number of items changes
		void itemCount;
		updateScrollState();
	}, [updateScrollState, itemCount]);

	const scroll = useCallback((direction: "left" | "right") => {
		const el = scrollRef.current;
		if (!el) return;
		const amount = 300;
		el.scrollBy({
			left: direction === "left" ? -amount : amount,
			behavior: "smooth",
		});
	}, []);

	if (itemCount === 0) return null;

	return (
		<section aria-label={ariaLabel} className="pt-16 pb-8 md:pt-20 md:pb-10">
			{/* Section header */}
			<div className="mb-6 flex items-center justify-between">
				<h2 className="text-xl font-semibold text-white">
					{title}
				</h2>

				<div className="flex items-center gap-5">
					<button
						type="button"
						onClick={onViewAll}
						className="font-mono text-xs tracking-wider text-zinc-200 uppercase transition-colors hover:text-white"
					>
						View all
					</button>

					{/* Scroll arrows */}
					<div className="hidden items-center gap-2 sm:flex">
						<button
							type="button"
							onClick={() => scroll("left")}
							disabled={!canScrollLeft}
							aria-label="Scroll left"
							className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-700 text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white disabled:pointer-events-none disabled:opacity-30"
						>
							<i className="ri-arrow-left-s-line text-base" />
						</button>
						<button
							type="button"
							onClick={() => scroll("right")}
							disabled={!canScrollRight}
							aria-label="Scroll right"
							className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-700 text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white disabled:pointer-events-none disabled:opacity-30"
						>
							<i className="ri-arrow-right-s-line text-base" />
						</button>
					</div>
				</div>
			</div>

			{/* Scrollable track */}
			<div className="relative">
				<div
					ref={scrollRef}
					onScroll={updateScrollState}
					className="scrollbar-hide flex gap-3 overflow-x-auto py-1 pb-2"
					style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
				>
					{children}
				</div>

				{/* Right fade affordance */}
				{canScrollRight && (
					<div className="pointer-events-none absolute top-0 right-0 bottom-2 w-16 bg-gradient-to-l from-zinc-950 to-transparent" />
				)}

				{/* Left fade affordance */}
				{canScrollLeft && (
					<div className="pointer-events-none absolute top-0 bottom-2 left-0 w-16 bg-gradient-to-r from-zinc-950 to-transparent" />
				)}

				{/* Mobile swipe hint */}
				{canScrollRight && (
					<div className="pointer-events-none absolute right-2 bottom-4 flex items-center gap-1 text-xs text-zinc-400 sm:hidden">
						<span>Swipe</span>
						<i className="ri-arrow-right-line text-xs" />
					</div>
				)}
			</div>
		</section>
	);
}

// ── TWIE Horizontal Scroll ────────────────────────────────────────
function TWIECard({ post }: { post: BlogPost }) {
	const url = getPostUrl(post);
	// Extract issue number from title (e.g. "This Week in Effect - 2026-02-27" or "#107")
	const issueMatch = post.title.match(/#(\d+)/);
	const issueNumber = issueMatch ? `#${issueMatch[1]}` : null;
	return (
		<a
			href={url}
			target="_blank"
			rel="noopener noreferrer"
			className="group relative flex w-[280px] shrink-0 flex-col justify-between overflow-hidden rounded-md border border-zinc-800 bg-zinc-900/40 p-4 pb-5 transition-colors duration-200 hover:border-zinc-600 hover:bg-zinc-900/70"
		>
			<div>
				<div className="flex items-center justify-between">
					{issueNumber && (
						<span className="font-mono text-base font-semibold text-white">
							{issueNumber}
						</span>
					)}
					<time className="font-mono text-xs text-zinc-400 tabular-nums">
						{post.date}
					</time>
				</div>

				<p className="mt-3 line-clamp-3 text-sm leading-relaxed text-zinc-300">
					{post.excerpt}
				</p>
			</div>
		</a>
	);
}

function TWIESection({ posts, onViewAll }: { posts: BlogPost[]; onViewAll: () => void }) {
	return (
		<HorizontalScrollRail
			title="This Week in Effect"
			ariaLabel="This Week in Effect posts"
			onViewAll={onViewAll}
			itemCount={posts.length}
		>
			{posts.map((post) => (
				<TWIECard key={post.slug} post={post} />
			))}
		</HorizontalScrollRail>
	);
}

// ── Post Card (list row style) ──────────────────────────────────
function PostCard({ post }: { post: BlogPost }) {
	const url = getPostUrl(post);
	const isExternal = url.startsWith("http");
	return (
		<a
			href={isExternal ? url : getAssetPath(url)}
			{...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
			className="group block -mx-4 border-t border-zinc-700/80 px-4 py-6 transition-colors first:border-t-0 hover:bg-zinc-900/60"
		>
			<div className="grid grid-cols-12 items-baseline gap-4">
				<div className="col-span-12 min-w-0 md:col-span-8">
					<h3 className="relative inline-block text-lg font-semibold text-white">
						<span>{post.title}</span>
						<i
							aria-hidden="true"
							className="ri-arrow-right-line ml-2 align-middle text-base text-white opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0"
						/>
						<span className="absolute right-0 -bottom-0.5 left-0 h-px origin-left scale-x-0 bg-white transition-transform duration-300 ease-out group-hover:scale-x-100" />
					</h3>
					{/* Excerpt */}
					<p className="mt-2 line-clamp-2 text-base leading-relaxed text-zinc-400 transition-colors group-hover:text-zinc-200">
						{post.excerpt}
					</p>
				</div>
				<div className="col-span-12 flex flex-wrap items-baseline gap-x-3 gap-y-2 md:col-span-4 md:flex-col md:items-end md:gap-2">
					<div className="flex flex-wrap items-center gap-2 md:justify-end">
						{[...post.tags].sort((a, b) => a.localeCompare(b)).slice(0, 2).map((tag) => (
							<span
								key={tag}
								className="inline-flex items-center rounded-md border border-zinc-600 px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] text-zinc-200 uppercase"
							>
								{tag}
							</span>
						))}
						{post.tags.length > 2 && (
							<span className="inline-flex items-center rounded-md border border-zinc-700 px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] text-zinc-400 uppercase">
								+{post.tags.length - 2}
							</span>
						)}
					</div>
					<time className="shrink-0 font-mono text-xs text-zinc-400 tabular-nums">
						{post.date}
					</time>
				</div>
			</div>
		</a>
	);
}

export function BlogPage() {
	const [activeTag, setActiveTag] = useState<BlogTag>(() => {
		if (typeof window === "undefined") return "All";
		const param = new URLSearchParams(window.location.search).get("category");
		if (param && (BLOG_TAGS as readonly string[]).includes(param)) {
			return param as BlogTag;
		}
		return "All";
	});
	const [currentPage, setCurrentPage] = useState(1);
	const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
	const [catOpen, setCatOpen] = useState(false);
	const postListRef = useRef<HTMLDivElement>(null);
	const contentZoneRef = useRef<HTMLDivElement>(null);
	const catRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!catOpen) return;
		const handleClick = (e: MouseEvent) => {
			if (!catRef.current?.contains(e.target as Node)) setCatOpen(false);
		};
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") setCatOpen(false);
		};
		window.addEventListener("mousedown", handleClick);
		window.addEventListener("keydown", handleKey);
		return () => {
			window.removeEventListener("mousedown", handleClick);
			window.removeEventListener("keydown", handleKey);
		};
	}, [catOpen]);

	const goToPage = useCallback((page: number | ((prev: number) => number)) => {
		setCurrentPage(page);
		postListRef.current?.scrollIntoView({
			behavior: "smooth",
			block: "start",
		});
	}, []);

	// Separate TWIE posts from everything else
	const twiePosts = useMemo(
		() => BLOG_POSTS.filter((p) => p.tags.includes("This Week In Effect")),
		[],
	);

	// Posts that are not TWIE (main grid — includes Release posts)
	const nonTwiePosts = useMemo(
		() =>
			BLOG_POSTS.filter(
				(p) => !p.tags.includes("This Week In Effect"),
			),
		[],
	);

	const filteredPosts = useMemo(() => {
		// When the user explicitly selects TWIE tag, show those in the grid
		if (activeTag === "This Week In Effect") {
			return twiePosts;
		}

		// For "All" — show posts that are NOT in TWIE (they have their own rail)
		// For a specific tag — search ALL posts so dual-tagged posts appear
		let posts = activeTag === "All" ? nonTwiePosts : BLOG_POSTS;

		if (activeTag !== "All") {
			posts = posts.filter((p) => p.tags.includes(activeTag));
		}

		const sorted = [...posts].sort((a, b) => {
			const cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
			return sortBy === "newest" ? -cmp : cmp;
		});

		return sorted;
	}, [activeTag, twiePosts, nonTwiePosts, sortBy]);

	const hasActiveFilters = activeTag !== "All";


	// Separate featured post from the rest (search all posts — featured may be a Release)
	const featuredPost = useMemo(() => {
		return BLOG_POSTS.find((p) => p.featured) ?? null;
	}, []);

	const displayPosts = useMemo(() => {
		if (featuredPost) {
			return filteredPosts.filter((p) => p.slug !== featuredPost.slug);
		}
		return filteredPosts;
	}, [filteredPosts, featuredPost]);

	// Pagination
	const totalPages = Math.max(
		1,
		Math.ceil(displayPosts.length / POSTS_PER_PAGE),
	);
	const safePage = Math.min(currentPage, totalPages);
	const paginatedPosts = useMemo(
		() =>
			displayPosts.slice(
				(safePage - 1) * POSTS_PER_PAGE,
				safePage * POSTS_PER_PAGE,
			),
		[displayPosts, safePage],
	);

	// Compute tag counts (for sidebar, use all posts for accurate counts)
	const tagCounts = useMemo(() => {
		const counts: Record<string, number> = {};
		for (const tag of BLOG_TAGS) {
			if (tag === "All") {
				counts[tag] = nonTwiePosts.length;
			} else if (tag === "This Week In Effect") {
				counts[tag] = twiePosts.length;
			} else {
				counts[tag] = BLOG_POSTS.filter((p) => p.tags.includes(tag)).length;
			}
		}
		return counts;
	}, [nonTwiePosts, twiePosts]);

	const syncUrl = useCallback((tag: BlogTag) => {
		if (typeof window === "undefined") return;
		const url = new URL(window.location.href);
		if (tag === "All") url.searchParams.delete("category");
		else url.searchParams.set("category", tag);
		window.history.pushState({ category: tag }, "", url);
	}, []);

	const clearFilters = useCallback(() => {
		setActiveTag("All");
		setCurrentPage(1);
		syncUrl("All");
	}, [syncUrl]);

	const handleTagChange = useCallback((tag: BlogTag) => {
		setActiveTag(tag);
		setCurrentPage(1);
		syncUrl(tag);
		// Only scroll up when the post list has scrolled out of view (tab-like behavior)
		if (postListRef.current) {
			const navbarHeight = 64;
			const { top } = postListRef.current.getBoundingClientRect();
			if (top < navbarHeight) {
				const targetTop = top + window.scrollY - navbarHeight;
				window.scrollTo({ top: targetTop, behavior: "smooth" });
			}
		}
	}, [syncUrl]);

	useEffect(() => {
		const handlePopState = () => {
			const param = new URLSearchParams(window.location.search).get("category");
			if (param && (BLOG_TAGS as readonly string[]).includes(param)) {
				setActiveTag(param as BlogTag);
			} else {
				setActiveTag("All");
			}
			setCurrentPage(1);
		};
		window.addEventListener("popstate", handlePopState);
		return () => window.removeEventListener("popstate", handlePopState);
	}, []);

	return (
		<div className="relative min-h-screen bg-zinc-950 text-white antialiased">
			<a
				href="#main-content"
				className="absolute -left-[9999px] z-[999] rounded-br-lg bg-zinc-800 px-6 py-4 font-semibold text-white no-underline focus:top-0 focus:left-0"
			>
				Skip to main content
			</a>

			<Navigation activePath="/blog" />
			<GridOverlay />

			{/* Dithered background overlay - subtle texture across entire page */}
			<div
				className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]"
				style={{
					backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect x='0' y='0' width='1' height='1' fill='white'/%3E%3Crect x='2' y='2' width='1' height='1' fill='white'/%3E%3C/svg%3E")`,
					backgroundSize: "4px 4px",
				}}
			/>

			{/* Vertical border lines */}
			<div className="pointer-events-none absolute top-0 right-0 bottom-0 left-0 z-[60] hidden lg:block">
				<div className="relative mx-auto h-full w-full max-w-[73.75rem]">
					<div className="absolute top-0 bottom-0 left-0 w-px bg-zinc-800" />
					<div className="absolute top-0 right-0 bottom-0 w-px bg-zinc-800" />
				</div>
			</div>

			{/* ── Header zone ────────────────────────────── */}
			<div className="relative overflow-hidden">
				{/* Grid background */}
				<div
					className="pointer-events-none absolute inset-0"
					style={{
						backgroundImage: `
							linear-gradient(to right, rgba(24, 24, 27, 0.8) 1px, transparent 1px),
							linear-gradient(to bottom, rgba(24, 24, 27, 0.8) 1px, transparent 1px)
						`,
						backgroundSize: "196.6px 194px",
						backgroundPosition: "calc(50% + 97px) 0",
					}}
				/>

				{/* Fade grid at edges */}
				<div
					className="pointer-events-none absolute inset-0"
					style={{
						background:
							"linear-gradient(to bottom, #09090b 0%, transparent 30%, transparent 50%, #09090b 100%)",
					}}
				/>

				{/* Ambient glow */}
				<div
					className="pointer-events-none absolute inset-x-0 top-0 h-[500px]"
					style={{
						background: `
							radial-gradient(ellipse 50% 80% at 50% -20%, rgba(255, 255, 255, 0.08) 0%, transparent 50%),
							radial-gradient(ellipse 30% 50% at 70% 0%, rgba(255, 255, 255, 0.05) 0%, transparent 40%)
						`,
					}}
				/>

				{/* Noise texture */}
				<div
					className="pointer-events-none absolute inset-x-0 top-0 h-[500px] opacity-[0.12] mix-blend-overlay"
					style={{
						backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
						backgroundRepeat: "repeat",
					}}
				/>

				<main id="main-content" className="relative w-full pt-16">
					<div className="mx-auto w-full max-w-[73.75rem] px-4">
						{/* Page header */}
						<div className="pt-16 pb-8 md:pt-24 md:pb-12">
							<p className="mb-4 font-mono text-sm font-medium tracking-wider text-zinc-400 uppercase">
								// Effect Blog
							</p>
							<h1
								className="max-w-2xl text-3xl font-semibold leading-tighter tracking-tight text-white"
							>
								Releases, write-ups, and notes{" "}
								<br className="hidden md:block" />
								from the Effect team
							</h1>
						</div>

						{/* Featured post — first thing after heading */}
						{featuredPost && (
							<div className="border-t border-zinc-800 py-5 md:py-6">
								<FeaturedPost post={featuredPost} />
							</div>
						)}
					</div>
				</main>
			</div>

			{/* Section divider */}
			<div className="h-px w-full bg-zinc-800" />

			{/* ── Content zone ───────────────────────────── */}
			<div ref={contentZoneRef} className="relative">
				<div className="mx-auto w-full max-w-[73.75rem] px-4">

					{/* TWIE horizontal scroll rail */}
					<TWIESection posts={twiePosts} onViewAll={() => handleTagChange("This Week In Effect")} />
					<div className="h-px w-full bg-zinc-800" />

					{/* Single-column layout */}
					<div>
						<div className="min-w-0 pb-24">
							{/* Header row: heading + Category filter + Sort */}
							<div ref={postListRef} className="mt-16 flex flex-wrap items-baseline justify-between gap-4 border-b border-zinc-700/80 pb-4 md:mt-20">
								<h2 className="text-2xl font-semibold tracking-tight text-white">
									{activeTag === "All" ? "All posts" : activeTag}
								</h2>
								<div className="flex flex-wrap items-baseline gap-x-4 gap-y-3 sm:gap-x-6">
									{/* Category dropdown */}
									<div ref={catRef} className="relative">
										<button
											type="button"
											onClick={() => setCatOpen((o) => !o)}
											aria-haspopup="listbox"
											aria-expanded={catOpen}
											className="group inline-flex items-baseline gap-1.5 font-mono text-xs tracking-wider uppercase transition-colors"
										>
											<span className="hidden text-zinc-500 group-hover:text-zinc-400 sm:inline">Category:</span>
											<span className="text-zinc-200 group-hover:text-white">{activeTag}</span>
											<i className={`ri-arrow-down-s-line text-sm text-zinc-500 transition-transform group-hover:text-zinc-300 ${catOpen ? "rotate-180" : ""}`} />
										</button>
										{catOpen && (
											<ul
												role="listbox"
												className="absolute right-0 z-20 mt-2 w-64 rounded-md border border-zinc-700 bg-zinc-950 py-2 shadow-lg shadow-black/40"
											>
												{[...BLOG_TAGS]
													.sort((a, b) => {
														if (a === "All") return -1;
														if (b === "All") return 1;
														return (tagCounts[b] ?? 0) - (tagCounts[a] ?? 0);
													})
													.map((tag) => {
														const isActive = activeTag === tag;
														return (
															<li key={tag}>
																<button
																	type="button"
																	role="option"
																	aria-selected={isActive}
																	onClick={() => {
																		handleTagChange(tag);
																		setCatOpen(false);
																	}}
																	className={`group/item relative flex w-full items-baseline justify-between gap-3 px-4 py-2 text-left font-mono text-xs tracking-wider uppercase transition-colors ${
																		isActive
																			? "text-white"
																			: "text-zinc-300 hover:text-white"
																	}`}
																>
																	<span>{tag}</span>
																	<span className={`tabular-nums ${isActive ? "text-white" : "text-zinc-500"}`}>
																		{String(tagCounts[tag] ?? 0).padStart(3, "0")}
																	</span>
																	<span
																		className={`pointer-events-none absolute right-4 bottom-1 left-4 h-px bg-white transition-transform duration-300 ease-out origin-left ${
																			isActive ? "scale-x-100" : "scale-x-0 group-hover/item:scale-x-[0.08]"
																		}`}
																	/>
																</button>
															</li>
														);
													})}
											</ul>
										)}
									</div>
									{/* Sort toggle */}
									<button
										type="button"
										onClick={() => setSortBy((s) => (s === "newest" ? "oldest" : "newest"))}
										aria-label={`Sort: ${sortBy === "newest" ? "Newest" : "Oldest"} first. Click to toggle.`}
										className="group inline-flex items-baseline gap-1.5 font-mono text-xs tracking-wider uppercase transition-colors"
									>
										<span className="text-zinc-200 group-hover:text-white">
											{sortBy === "newest" ? "Newest" : "Oldest"}
										</span>
										<i className="ri-arrow-up-down-line text-sm text-zinc-500 group-hover:text-zinc-300" />
									</button>
									{/* RSS feed */}
									<a
										href="/rss.xml"
										aria-label="RSS feed"
										className="group inline-flex items-baseline gap-1.5 font-mono text-xs tracking-wider text-zinc-200 uppercase transition-colors hover:text-white"
									>
										<span>RSS</span>
										<i className="ri-rss-line text-sm text-zinc-500 group-hover:text-zinc-300" aria-hidden="true" />
									</a>
								</div>
							</div>

							{/* Post grid */}
							{paginatedPosts.length > 0 ? (
								<>
									<div
										key={`${activeTag}-${safePage}`}
										className="blog-grid-enter flex flex-col"
									>
										{paginatedPosts.map((post) => (
											<PostCard key={post.slug} post={post} />
										))}
									</div>

									{/* Pagination */}
									{totalPages > 1 && (
										<>
											<div className="mt-12 h-px bg-zinc-800" />
											<nav aria-label="Blog pagination" className="mt-8 flex items-center justify-center gap-1">
												<button
													type="button"
													disabled={safePage <= 1}
													onClick={() => goToPage((p) => p - 1)}
													aria-label="Previous page"
													className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-700 text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white disabled:pointer-events-none disabled:opacity-30"
												>
													<i className="ri-arrow-left-s-line text-base" />
												</button>

												{(() => {
													const pages: (number | "ellipsis")[] = [];
													if (totalPages <= 7) {
														for (let i = 1; i <= totalPages; i++) pages.push(i);
													} else {
														pages.push(1);
														if (safePage > 3) pages.push("ellipsis");
														const start = Math.max(2, safePage - 1);
														const end = Math.min(totalPages - 1, safePage + 1);
														for (let i = start; i <= end; i++) pages.push(i);
														if (safePage < totalPages - 2)
															pages.push("ellipsis");
														pages.push(totalPages);
													}
													return pages.map((page, idx) =>
														page === "ellipsis" ? (
															<span
																key={`ellipsis-${idx}`}
																className="px-1.5 font-mono text-xs text-zinc-500"
															>
																···
															</span>
														) : (
															<button
																key={page}
																type="button"
																onClick={() => goToPage(page)}
																aria-current={page === safePage ? "page" : undefined}
																className={`group/page relative flex h-8 min-w-8 items-center justify-center px-2 font-mono text-xs tabular-nums transition-colors ${
																	page === safePage
																		? "text-white"
																		: "text-zinc-400 hover:text-white"
																}`}
															>
																<span className={page === safePage ? "font-semibold" : ""}>
																	{String(page).padStart(2, "0")}
																</span>
																<span
																	className={`pointer-events-none absolute right-2 -bottom-0.5 left-2 h-px bg-white transition-transform duration-300 ease-out origin-left ${
																		page === safePage ? "scale-x-100" : "scale-x-0 group-hover/page:scale-x-[0.2]"
																	}`}
																/>
															</button>
														),
													);
												})()}

												<button
													type="button"
													disabled={safePage >= totalPages}
													onClick={() => goToPage((p) => p + 1)}
													aria-label="Next page"
													className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-700 text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white disabled:pointer-events-none disabled:opacity-30"
												>
													<i className="ri-arrow-right-s-line text-base" />
												</button>
											</nav>
										</>
									)}
								</>
							) : (
								<div className="flex flex-col items-center justify-center py-24">
									<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900/60">
										<i className="ri-file-search-line text-2xl text-zinc-400" />
									</div>
									<p className="mt-6 text-base font-medium text-zinc-300">
										No posts found
									</p>
									<p className="mt-2 max-w-sm text-center text-sm leading-relaxed text-zinc-400">
										No posts match the current filters.
									</p>

									{/* Suggested tags */}
									<div className="mt-6 flex flex-wrap items-center justify-center gap-2">
										{(["Release", "Effect", "TypeScript"] as const).map(
											(tag) => (
												<button
													key={tag}
													type="button"
													onClick={() => {
														handleTagChange(tag as BlogTag);
													}}
													className="inline-flex items-center rounded-md border border-zinc-800 px-3 py-1.5 font-mono text-[10px] tracking-[0.12em] text-zinc-400 uppercase transition-colors hover:border-zinc-500 hover:text-white"
												>
													{tag}
												</button>
											),
										)}
									</div>

									<button
										type="button"
										onClick={clearFilters}
										className="mt-6 rounded-md border border-zinc-700 px-4 py-2 font-mono text-xs tracking-wider text-zinc-300 uppercase transition-colors hover:border-zinc-500 hover:text-white"
									>
										Clear all filters
									</button>
								</div>
							)}
						</div>

					</div>
				</div>
			</div>

			<Footer />
		</div>
	);
}
