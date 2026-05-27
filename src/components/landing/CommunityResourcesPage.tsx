import { useMemo, useState } from "react";
import {
	CATEGORIES,
	CATEGORY_COLORS,
	CATEGORY_DISPLAY_NAMES,
	CATEGORY_ICONS,
	CATEGORY_SLUGS,
	COMMUNITY_ITEMS,
	type Category,
	type CommunityItem,
} from "../../data/resources";
import { GridOverlay } from "../GridOverlay";
import { Button, Link } from "../ui";
import { Footer } from "./Footer";
import { Navigation } from "./Navigation";

// ── Constants ────────────────────────────────────────────────────

const ITEMS_PER_SECTION = 8; // 4 columns × 2 rows

// ── Resource Card ────────────────────────────────────────────────

function ResourceCard({
	item,
	color,
}: {
	item: CommunityItem;
	color: (typeof CATEGORY_COLORS)[Category];
}) {
	const rgb = color.rgb;

	return (
		<a
			href={item.url}
			target="_blank"
			rel="noopener noreferrer"
			className="group relative flex flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/40 p-6 transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
			onMouseEnter={(e) => {
				const el = e.currentTarget;
				el.style.borderColor = "rgba(82, 82, 91, 0.9)";
			}}
			onMouseLeave={(e) => {
				const el = e.currentTarget;
				el.style.borderColor = "";
			}}
		>
			{/* Left accent stripe */}
			<div
				className="pointer-events-none absolute top-3 bottom-3 left-0 w-px rounded-r-full transition-all duration-300 group-hover:top-2 group-hover:bottom-2"
				style={{ backgroundColor: `rgba(${rgb}, 0.5)` }}
			/>

			{/* Tags */}
			{item.tags && item.tags.length > 0 && (
				<div className="relative mb-4 flex flex-wrap gap-2">
					{item.tags.slice(0, 3).map((tag) => (
						<span
							key={tag}
							className="font-mono text-xs font-medium uppercase leading-relaxed text-zinc-400"
						>
							{tag}
						</span>
					))}
				</div>
			)}

			{/* Title */}
			<h3 className="relative text-base font-semibold text-white leading-snug">
				{item.title}
				<i
					className="ri-arrow-right-up-line ml-1 text-xs text-zinc-400 transition-all duration-300 group-hover:text-zinc-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
					aria-hidden="true"
				/>
			</h3>

			{/* Description */}
			<p className="relative mt-3 text-sm leading-relaxed text-zinc-400">
				{item.description}
			</p>

			{/* Footer */}
			<div className="relative mt-auto pt-8">
				<span className="text-xs text-zinc-400">{item.author}</span>
			</div>
		</a>
	);
}

// ── Featured Item Card ───────────────────────────────────────────

function FeaturedItemCard({ item, large }: { item: CommunityItem; large?: boolean }) {
	return (
		<a
			href={item.url}
			target="_blank"
			rel="noopener noreferrer"
			className={`group relative overflow-hidden rounded-lg border border-zinc-800/60 transition-all duration-300 hover:border-zinc-700/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${large ? "aspect-auto h-full min-h-[280px] lg:min-h-0" : "aspect-video"}`}
		>
			{/* Thumbnail */}
			{item.thumbnail && (
				<img
					src={item.thumbnail}
					alt=""
					className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
					loading="lazy"
				/>
			)}

			{/* Bottom gradient overlay */}
			<div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/40 to-transparent" />

			{/* Title overlay */}
			<div className={`absolute inset-x-0 bottom-0 px-4 pb-4 ${large ? "px-6 pb-6" : ""}`}>
				<h3 className={`font-semibold leading-snug text-white drop-shadow-sm ${large ? "text-lg" : "text-[15px]"}`}>
					{item.title}
					<i
						className="ri-arrow-right-up-line ml-1 text-xs text-zinc-400 transition-colors duration-300 group-hover:text-zinc-200"
						aria-hidden="true"
					/>
				</h3>
			</div>
		</a>
	);
}

// ── Category Section ─────────────────────────────────────────────

function CategorySection({ category }: { category: Category }) {
	const color = CATEGORY_COLORS[category];
	const icon = CATEGORY_ICONS[category];
	const slug = CATEGORY_SLUGS[category];
	const displayName = CATEGORY_DISPLAY_NAMES[category];

	const items = useMemo(() => {
		return COMMUNITY_ITEMS.filter(
			(item) => item.category === category,
		)
			.sort(
				(a, b) =>
					new Date(b.dateAdded).getTime() -
					new Date(a.dateAdded).getTime(),
			)
			.slice(0, ITEMS_PER_SECTION);
	}, [category]);

	const totalCount = useMemo(
		() =>
			COMMUNITY_ITEMS.filter(
				(item) => item.category === category,
			).length,
		[category],
	);

	if (items.length === 0) return null;

	return (
		<section aria-label={`${displayName} resources`} className="py-10 md:py-14">
			{/* Section header */}
			<div className="mb-8 flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div
						className={`flex h-8 w-8 items-center justify-center rounded-lg ${color.bg}`}
					>
						<i
							className={`${icon} text-base ${color.text}`}
							aria-hidden="true"
						/>
					</div>
					<h2 className="text-lg font-semibold text-white">
						{displayName}
					</h2>
					<span className="text-sm text-zinc-400">{totalCount}</span>
				</div>
				<Link
					href={`/community-resources/${slug}`}
					variant="subtle"
					className="group/link flex items-center gap-1 font-medium"
				>
					View all
					<i
						className="ri-arrow-right-line text-sm transition-transform group-hover/link:translate-x-0.5"
						aria-hidden="true"
					/>
				</Link>
			</div>

			{/* 4-column grid, 2 rows max */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{items.map((item) => (
					<ResourceCard key={item.url} item={item} color={color} />
				))}
			</div>
		</section>
	);
}

// ── Search Results ───────────────────────────────────────────────

function SearchResults({
	query,
	onClear,
}: {
	query: string;
	onClear: () => void;
}) {
	const results = useMemo(() => {
		const q = query.toLowerCase();
		return COMMUNITY_ITEMS.filter(
			(item) =>
				item.title.toLowerCase().includes(q) ||
				item.description.toLowerCase().includes(q) ||
				item.author.toLowerCase().includes(q) ||
				item.tags?.some((t) => t.toLowerCase().includes(q)),
		).sort(
			(a, b) =>
				new Date(b.dateAdded).getTime() -
				new Date(a.dateAdded).getTime(),
		);
	}, [query]);

	if (results.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-16 md:py-24">
				<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900/60">
					<i
						className="ri-search-line text-2xl text-zinc-400"
						aria-hidden="true"
					/>
				</div>
				<p className="mt-6 text-base font-medium text-zinc-300">
					No resources found
				</p>
				<p className="mt-2 max-w-sm text-center text-sm leading-relaxed text-zinc-400">
					Nothing matched &ldquo;{query}&rdquo;. Try a different
					search term.
				</p>
				<button
					type="button"
					onClick={onClear}
					className="mt-4 rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-900/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
				>
					Clear search
				</button>
			</div>
		);
	}

	return (
		<div className="py-8">
			<p className="mb-6 text-sm text-zinc-400">
				{results.length} result{results.length === 1 ? "" : "s"}{" "}
				matching &ldquo;{query}&rdquo;
			</p>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{results.map((item) => (
					<ResourceCard
						key={item.url}
						item={item}
						color={CATEGORY_COLORS[item.category]}
					/>
				))}
			</div>
		</div>
	);
}

// ── Main Page ────────────────────────────────────────────────────

export function CommunityResourcesPage() {
	const [searchQuery, setSearchQuery] = useState("");

	// Featured items — always visible
	const featuredItems = useMemo(
		() => COMMUNITY_ITEMS.filter((item) => item.featured),
		[],
	);

	// Categories that have at least one item
	const activeCategories = useMemo(
		() =>
			CATEGORIES.filter((cat) =>
				COMMUNITY_ITEMS.some(
					(item) => item.category === cat,
				),
			),
		[],
	);

	const isSearching = searchQuery.trim().length > 0;

	return (
		<div className="relative min-h-screen bg-zinc-950 text-white antialiased">
			<a
				href="#main-content"
				className="absolute -left-[9999px] z-[999] rounded-br-lg bg-zinc-800 px-6 py-4 font-semibold text-white no-underline focus:top-0 focus:left-0"
			>
				Skip to main content
			</a>

			<Navigation activePath="/community-resources" />
			<GridOverlay />

			{/* Vertical border lines */}
			<div className="pointer-events-none absolute top-0 right-0 bottom-0 left-0 z-[60] hidden lg:block">
				<div className="relative mx-auto h-full w-full max-w-[73.75rem]">
					<div className="absolute top-0 bottom-0 left-0 w-px bg-zinc-800" />
					<div className="absolute top-0 right-0 bottom-0 w-px bg-zinc-800" />
				</div>
			</div>

			{/* Center vertical line - dashed */}
			<div className="pointer-events-none absolute left-0 right-0 top-0 bottom-0 z-0 hidden px-8 lg:block">
				<div className="relative mx-auto h-full w-full max-w-[73.75rem]">
					<div
						className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2"
						style={{
							width: "1px",
							backgroundImage:
								"repeating-linear-gradient(to bottom, rgb(39 39 42) 0px, rgb(39 39 42) 2px, transparent 2px, transparent 4px)",
						}}
					/>
				</div>
			</div>

			{/* ── Hero ────────────────────────────────────── */}
			<div className="relative">
				<div className="relative w-full pt-16">
					<div className="mx-auto w-full max-w-[73.75rem] px-4">
						<div className="pt-12 pb-12 md:pt-20 md:pb-16">
							<p className="mb-4 font-mono text-sm font-medium tracking-wider text-zinc-400 uppercase">
								{"// Projects Showcase"}
							</p>
							<h1 className="max-w-3xl text-3xl font-bold text-white sm:text-4xl">
								Community Resources
							</h1>
							<p className="mt-4 max-w-3xl text-base text-zinc-400 sm:text-lg">
								Projects, libraries, tutorials, videos, and
								tools built by the Effect community.
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Divider */}
			<div className="h-px w-full bg-zinc-800" />

			{/* ── Content ─────────────────────────────────── */}
			<main id="main-content" className="relative">
				<div className="mx-auto w-full max-w-[73.75rem] px-4">
				{/* Featured items — always visible */}
				{featuredItems.length > 0 && (
					<section
						aria-label="Featured resources"
						className="pt-12 pb-4"
					>
						{/* Hero row: large feature + 2×2 grid */}
						<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
							{/* Primary featured video — half width */}
							{featuredItems[0] && (
								<FeaturedItemCard
									item={featuredItems[0]}
									large
								/>
							)}

							{/* 2×2 grid of next 4 videos */}
							{featuredItems.length > 1 && (
								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
									{featuredItems.slice(1, 5).map((item) => (
										<FeaturedItemCard
											key={item.url}
											item={item}
										/>
									))}
								</div>
							)}
						</div>

						{/* Remaining featured items below */}
						{featuredItems.length > 5 && (
							<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
								{featuredItems.slice(5).map((item) => (
									<FeaturedItemCard
										key={item.url}
										item={item}
									/>
								))}
							</div>
						)}
					</section>
				)}

					{/* Divider below featured */}
					{featuredItems.length > 0 && (
						<div className="mt-8 h-px w-full bg-zinc-800" />
					)}

					{/* ── Search ──────────────────────────── */}
					<div className="pt-8 pb-2">
						<div className="relative w-full md:w-1/2 md:pr-4">
							<i
								className="ri-search-line pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-base text-zinc-400"
								aria-hidden="true"
							/>
							<input
								type="text"
								placeholder="Search resources..."
								value={searchQuery}
								onChange={(e) =>
									setSearchQuery(e.target.value)
								}
								aria-label="Search resources"
								className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 py-2.5 pr-4 pl-10 text-sm text-white placeholder-zinc-400 outline-none transition-all duration-200 focus:border-zinc-700 focus:bg-zinc-900/80 focus:ring-1 focus:ring-zinc-700"
							/>
							{searchQuery && (
								<button
									type="button"
									onClick={() => setSearchQuery("")}
									aria-label="Clear search"
									className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-0.5 text-zinc-400 transition-colors hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
								>
									<i
										className="ri-close-line text-base"
										aria-hidden="true"
									/>
								</button>
							)}
						</div>
					</div>

					{/* ── Category Sections or Search Results ── */}
					{isSearching ? (
						<SearchResults
							query={searchQuery.trim()}
							onClear={() => setSearchQuery("")}
						/>
					) : (
						<div className="divide-y divide-zinc-800/60">
							{activeCategories.map((cat) => (
								<CategorySection
									key={cat}
									category={cat}
								/>
							))}
						</div>
					)}

					{/* ── Submit CTA ──────────────────────── */}
					<section
						aria-label="Share your project"
						className="border-t border-zinc-800 py-12 md:py-16"
					>
						<div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<p className="font-mono text-xs uppercase tracking-wider text-zinc-400">
									{"// Share your project"}
								</p>
								<h2 className="mt-2 text-xl font-semibold text-white">
									Built something with Effect?
								</h2>
								<p className="mt-1 text-sm text-zinc-400">
									Drop it in{" "}
									<a href="https://discord.com/channels/795981131316985866/1072147395632185354" target="_blank" rel="noopener noreferrer" className="font-medium text-zinc-300 underline hover:text-white transition-colors">🟢-projects-showcase</a>{" "}
									on Discord, or{" "}
									<a href="https://discord.com/channels/795981131316985866/1134767195239485440" target="_blank" rel="noopener noreferrer" className="font-medium text-zinc-300 underline hover:text-white transition-colors">🔵-effect-content</a>{" "}
									for articles and tutorials.
								</p>
							</div>
							<div className="flex items-center gap-3">
								<Button
									href="https://discord.gg/effect-ts"
									variant="secondary"
								>
									<i
										className="ri-discord-fill text-base"
										aria-hidden="true"
									/>
									Discord
								</Button>
								<Button
									href="#"
									variant="secondary"
								>
									<i
										className="ri-file-list-line text-base"
										aria-hidden="true"
									/>
									Submit Form
								</Button>
							</div>
						</div>
					</section>
				</div>
			</main>

			<Footer activePath="/community-resources" hideCommunityBorder />
		</div>
	);
}
