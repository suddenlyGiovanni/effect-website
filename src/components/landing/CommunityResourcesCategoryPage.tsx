import { useMemo } from "react";
import {
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

// ── Category Page ────────────────────────────────────────────────

export function CommunityResourcesCategoryPage({
	category,
}: {
	category: Category;
}) {
	const color = CATEGORY_COLORS[category];
	const icon = CATEGORY_ICONS[category];
	const displayName = CATEGORY_DISPLAY_NAMES[category];

	const items = useMemo(() => {
		return COMMUNITY_ITEMS.filter((item) => item.category === category)
			.sort(
				(a, b) =>
					new Date(b.dateAdded).getTime() -
					new Date(a.dateAdded).getTime(),
			);
	}, [category]);

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
						<div className="pt-12 pb-8 md:pt-20 md:pb-10">
						{/* Breadcrumb */}
						<nav
							aria-label="Breadcrumb"
							className="flex items-center gap-2 font-mono text-sm uppercase tracking-wider"
						>
							<span className="text-zinc-600">{"// "}</span>
							<a
								href="/community-resources"
								className="text-zinc-400 transition-colors hover:text-white"
							>
								Community Resources
							</a>
							<i
								className="ri-arrow-right-s-line text-zinc-600"
								aria-hidden="true"
							/>
							<div className="flex items-center gap-2">
								<div
									className={`flex h-5 w-5 items-center justify-center rounded ${color.bg}`}
								>
									<i
										className={`${icon} text-xs ${color.text}`}
										aria-hidden="true"
									/>
								</div>
								<span className="text-zinc-200">
									{displayName}
								</span>
							</div>
							<span className="text-zinc-600">·</span>
							<span className="text-zinc-400 normal-case tracking-normal">
								{items.length} resource
								{items.length === 1 ? "" : "s"}
							</span>
						</nav>
						</div>
					</div>
				</div>
			</div>

			{/* ── Content ─────────────────────────────────── */}
			<main id="main-content" className="relative">
				<div className="mx-auto w-full max-w-[73.75rem] px-4">
					<div className="pb-12 md:pb-16">
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
							{items.map((item) => (
								<ResourceCard
									key={item.url}
									item={item}
									color={color}
								/>
							))}
						</div>
					</div>

					{/* ── Back link ────────────────────────── */}
					<div className="border-t border-zinc-800 py-8">
						<Link
							href="/community-resources"
							variant="subtle"
							className="group inline-flex items-center gap-2 font-medium"
						>
							<i
								className="ri-arrow-left-line text-sm"
								aria-hidden="true"
							/>
							Back to Community Resources
						</Link>
					</div>

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
