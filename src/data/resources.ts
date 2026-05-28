// ── Types ────────────────────────────────────────────────────────

export type Category = "Article" | "Learning" | "Other" | "Tools" | "Video";

export const CATEGORIES: Category[] = [
	"Article",
	"Learning",
	"Other",
	"Tools",
	"Video",
];

/** URL-friendly slug for each category */
export const CATEGORY_SLUGS: Record<Category, string> = {
	Article: "articles",
	Learning: "learning",
	Other: "other",
	Tools: "tools",
	Video: "videos",
};

/** Reverse lookup: slug → category */
export const SLUG_TO_CATEGORY: Record<string, Category> = Object.fromEntries(
	Object.entries(CATEGORY_SLUGS).map(([cat, slug]) => [slug, cat as Category]),
) as Record<string, Category>;

/** Category accent colors (used for section headers, badges) */
export const CATEGORY_COLORS: Record<
	Category,
	{ text: string; bg: string; border: string; dot: string; rgb: string }
> = {
	Article: {
		text: "text-blue-400",
		bg: "bg-blue-500/10",
		border: "border-blue-500/20",
		dot: "bg-blue-400",
		rgb: "96, 165, 250",
	},
	Learning: {
		text: "text-emerald-400",
		bg: "bg-emerald-500/10",
		border: "border-emerald-500/20",
		dot: "bg-emerald-400",
		rgb: "52, 211, 153",
	},
	Other: {
		text: "text-zinc-400",
		bg: "bg-zinc-500/10",
		border: "border-zinc-500/20",
		dot: "bg-zinc-400",
		rgb: "161, 161, 170",
	},
	Tools: {
		text: "text-amber-400",
		bg: "bg-amber-500/10",
		border: "border-amber-500/20",
		dot: "bg-amber-400",
		rgb: "251, 191, 36",
	},
	Video: {
		text: "text-violet-400",
		bg: "bg-violet-500/10",
		border: "border-violet-500/20",
		dot: "bg-violet-400",
		rgb: "167, 139, 250",
	},
};

/** Remixicon icon name for each category */
export const CATEGORY_ICONS: Record<Category, string> = {
	Article: "ri-article-line",
	Learning: "ri-graduation-cap-line",
	Other: "ri-shapes-line",
	Tools: "ri-tools-line",
	Video: "ri-play-circle-line",
};

/** Human-readable display names for each category */
export const CATEGORY_DISPLAY_NAMES: Record<Category, string> = {
	Article: "Articles",
	Learning: "Learning Effect",
	Other: "Other",
	Tools: "Tools",
	Video: "Videos",
};

export interface CommunityItem {
	/** Display title */
	title: string;
	/** Short description (1-2 sentences) */
	description: string;
	/** External URL */
	url: string;
	/** Category for filtering */
	category: Category;
	/** Author or organization name */
	author: string;
	/** Author URL (GitHub, Twitter, personal site) */
	authorUrl?: string;
	/** Optional tags for display on cards */
	tags?: string[];
	/** Date added (YYYY-MM-DD) — used for sorting */
	dateAdded: string;
	/** Whether to feature this item at the top */
	featured?: boolean;
	/** Thumbnail image URL (e.g. YouTube thumbnail) */
	thumbnail?: string;
}

// ── Data ─────────────────────────────────────────────────────────

export const COMMUNITY_ITEMS: CommunityItem[] = [
	// ── Featured ──────────────────────────────────────────────────
	{
		title: "Effect: the unreadable library that captured my heart",
		description:
			"From skepticism to understanding why Effect's approach to TypeScript is worth the learning curve.",
		url: "https://www.youtube.com/watch?v=S2GChOwivwQ&t=52s",
		category: "Video",
		author: "Matt Pocock",
		authorUrl: "https://www.youtube.com/@mattpocockuk",
		tags: ["Overview", "Beginner"],
		dateAdded: "2024-08-10",
		featured: true,
		thumbnail: "https://i.ytimg.com/vi/S2GChOwivwQ/hqdefault.jpg",
	},
	{
		title: "Maybe I Was Wrong About Effect...",
		description:
			"Revisiting Effect after initial skepticism — do the benefits outweigh the learning curve?",
		url: "https://www.youtube.com/watch?v=MHpf_XMz_aM",
		category: "Video",
		author: "Ben Davis",
		authorUrl: "https://www.youtube.com/@bmdavis419",
		tags: ["Review", "Beginner"],
		dateAdded: "2024-10-20",
		featured: true,
		thumbnail: "https://i.ytimg.com/vi/MHpf_XMz_aM/hqdefault.jpg",
	},
	{
		title: "Dependency Injection Has Never Been This Easy in TypeScript",
		description:
			"Effect's Layer system makes DI intuitive and type-safe — no decorators needed.",
		url: "https://www.youtube.com/watch?v=YHmioxgxQY8",
		category: "Video",
		author: "Lucas Barake",
		authorUrl: "https://www.youtube.com/@lucas-barake",
		tags: ["Dependency Injection", "Layers"],
		dateAdded: "2024-11-15",
		featured: true,
		thumbnail: "https://i.ytimg.com/vi/YHmioxgxQY8/hqdefault.jpg",
	},
	{
		title: "This library changed my life, it had such a big Effect on me",
		description:
			"How Effect transforms your approach to TypeScript — error handling, dependency management, and more.",
		url: "https://www.youtube.com/watch?v=NR_gJipShK8",
		category: "Video",
		author: "TJ DeVries",
		authorUrl: "https://www.youtube.com/@teikidev",
		tags: ["Overview", "Live Coding"],
		dateAdded: "2025-01-15",
		featured: true,
		thumbnail: "https://i.ytimg.com/vi/NR_gJipShK8/hqdefault.jpg",
	},
	{
		title: "The Simple Secret Behind Effect's Power",
		description:
			"The core idea behind Effect and why it changes how you think about TypeScript.",
		url: "https://www.youtube.com/watch?v=F5aWLtEdNjE&t=10s",
		category: "Video",
		author: "Kit Langton",
		authorUrl: "https://www.youtube.com/@kitlangton",
		tags: ["Beginner", "Concepts"],
		dateAdded: "2024-06-15",
		featured: true,
		thumbnail: "https://i.ytimg.com/vi/F5aWLtEdNjE/hqdefault.jpg",
	},

	// ── Tools & Libraries ────────────────────────────────────────
	{
		title: "effect-sql",
		description:
			"Type-safe SQL client for PostgreSQL, MySQL, SQLite, and MSSQL.",
		url: "https://github.com/Effect-TS/effect/tree/main/packages/sql",
		category: "Tools",
		author: "Tim Smart",
		authorUrl: "https://github.com/tim-smart",
		tags: ["SQL", "Database"],
		dateAdded: "2024-04-15",
	},
	{
		title: "effect-opentelemetry",
		description:
			"Automatic tracing, metrics, and context propagation via OpenTelemetry.",
		url: "https://github.com/Effect-TS/effect/tree/main/packages/opentelemetry",
		category: "Tools",
		author: "Tim Smart",
		authorUrl: "https://github.com/tim-smart",
		tags: ["Observability", "Tracing"],
		dateAdded: "2024-05-20",
	},
	{
		title: "effect-rpc",
		description:
			"Type-safe RPC with automatic serialization, error propagation, and streaming.",
		url: "https://github.com/Effect-TS/effect/tree/main/packages/rpc",
		category: "Tools",
		author: "Effect Team",
		authorUrl: "https://github.com/Effect-TS",
		tags: ["RPC", "Networking"],
		dateAdded: "2024-06-01",
	},
	{
		title: "effect-cluster",
		description:
			"Virtual actors, sharding, and distributed pub/sub primitives.",
		url: "https://github.com/Effect-TS/effect/tree/main/packages/cluster",
		category: "Tools",
		author: "Effect Team",
		authorUrl: "https://github.com/Effect-TS",
		tags: ["Distributed", "Clustering"],
		dateAdded: "2024-07-10",
	},
	{
		title: "sqlfx",
		description:
			"Community SQL toolkit with query builder, migrations, and connection pooling.",
		url: "https://github.com/tim-smart/sqlfx",
		category: "Tools",
		author: "Tim Smart",
		authorUrl: "https://github.com/tim-smart",
		tags: ["SQL", "Database"],
		dateAdded: "2024-02-28",
	},
	{
		title: "Effect MCP Server",
		description:
			"MCP server for connecting LLMs to your Effect services.",
		url: "https://github.com/tim-smart/effect-mcp",
		category: "Tools",
		author: "Tim Smart",
		authorUrl: "https://github.com/tim-smart",
		tags: ["AI", "MCP"],
		dateAdded: "2024-11-10",
	},
	{
		title: "Effect Playground",
		description:
			"Interactive browser playground with instant feedback and full type checking.",
		url: "https://effect.website/play/",
		category: "Tools",
		author: "Effect Team",
		authorUrl: "https://github.com/Effect-TS",
		tags: ["Playground"],
		dateAdded: "2024-01-01",
	},
	{
		title: "Effect VS Code Extension",
		description:
			"Effect-specific diagnostics, quick fixes, and pipeline visualization.",
		url: "https://marketplace.visualstudio.com/items?itemName=effectful-tech.effect-vscode",
		category: "Tools",
		author: "Effect Team",
		authorUrl: "https://github.com/Effect-TS",
		tags: ["VS Code", "Developer Tools"],
		dateAdded: "2024-08-20",
	},
	{
		title: "Effect DevTools",
		description:
			"Inspect fiber trees, trace spans, and debug concurrent workflows.",
		url: "https://github.com/Effect-TS/effect/tree/main/packages/experimental",
		category: "Tools",
		author: "Effect Team",
		authorUrl: "https://github.com/Effect-TS",
		tags: ["Debugging"],
		dateAdded: "2024-07-15",
	},
	{
		title: "Effect LSP",
		description:
			"Rich editor support — go-to-definition, hover info, and refactoring for Effect APIs.",
		url: "https://github.com/Effect-TS/language-service",
		category: "Tools",
		author: "Effect Team",
		authorUrl: "https://github.com/Effect-TS",
		tags: ["LSP", "Developer Tools"],
		dateAdded: "2024-09-15",
	},

	// ── Video ────────────────────────────────────────────────────
	{
		title: "Why Effect Is Taking Over TypeScript",
		description:
			"Why Effect is gaining traction and how it solves real production problems.",
		url: "https://www.youtube.com/watch?v=SloZE4i4Zfk",
		category: "Video",
		author: "Theo Browne",
		authorUrl: "https://twitter.com/t3dotgg",
		tags: ["Overview", "Beginner"],
		dateAdded: "2024-07-20",
	},
	{
		title: "Effect for React Developers",
		description:
			"Integrating Effect into React for data fetching, state management, and error boundaries.",
		url: "https://www.youtube.com/watch?v=zrNr3JVUc8I",
		category: "Video",
		author: "Ethan Niser",
		authorUrl: "https://twitter.com/ethanniser",
		tags: ["React", "Intermediate"],
		dateAdded: "2024-08-05",
	},
	{
		title: "Building a Full-Stack App with Effect",
		description:
			"Live-coding a full-stack app with Effect RPC and Schema.",
		url: "https://www.youtube.com/watch?v=grRHGQSn3hQ",
		category: "Video",
		author: "Michael Arnaldi",
		authorUrl: "https://github.com/mikearnaldi",
		tags: ["Full-Stack", "Advanced"],
		dateAdded: "2024-09-12",
	},
	{
		title: "Concurrency in Effect",
		description:
			"Fibers, structured concurrency, and safe concurrent operations.",
		url: "https://www.youtube.com/watch?v=PW_7bTgJweg",
		category: "Video",
		author: "Tim Smart",
		authorUrl: "https://github.com/tim-smart",
		tags: ["Concurrency", "Advanced"],
		dateAdded: "2024-10-01",
	},
	{
		title: "Reimagining TypeScript with Effect",
		description:
			"Keynote on the vision behind Effect and pushing TypeScript to its limits.",
		url: "https://www.youtube.com/watch?v=zrNr3JVUc8I",
		category: "Video",
		author: "Michael Arnaldi",
		authorUrl: "https://github.com/mikearnaldi",
		tags: ["Keynote"],
		dateAdded: "2024-03-16",
	},
	{
		title: "Scaling Effect at Effectful Technologies",
		description:
			"How the Effect team uses it internally for production infrastructure.",
		url: "https://www.youtube.com/watch?v=PW_7bTgJweg",
		category: "Video",
		author: "Maxwell Brown",
		authorUrl: "https://github.com/imax153",
		tags: ["Production", "Architecture"],
		dateAdded: "2024-03-17",
	},
	{
		title: "Effect Days Conference Talks",
		description:
			"Recorded talks covering core concepts, ecosystem libraries, and real-world use cases.",
		url: "https://www.youtube.com/playlist?list=PLDf3uQLaK2B-lRhTEEQ9vXCOsWDAboy_m",
		category: "Video",
		author: "Effect Team",
		authorUrl: "https://github.com/Effect-TS",
		tags: ["Conference"],
		dateAdded: "2024-03-15",
	},
	{
		title: "Intro to Effect with TypeScript",
		description:
			"Free video course from zero, with exercises and real-world examples.",
		url: "https://www.youtube.com/playlist?list=PLDf3uQLaK2B9DLv6bR7xfAtCtiCf4Osp5",
		category: "Video",
		author: "Sandro Maglione",
		authorUrl: "https://twitter.com/SandroMaworx",
		tags: ["Beginner", "Course"],
		dateAdded: "2024-05-25",
	},

	// ── Learning ─────────────────────────────────────────────────
	{
		title: "Effect: A Practical Introduction",
		description:
			"Written guide covering error handling, dependency injection, concurrency, and real-world patterns.",
		url: "https://effect.website/docs/getting-started/introduction/",
		category: "Learning",
		author: "Effect Team",
		authorUrl: "https://github.com/Effect-TS",
		tags: ["Beginner", "Official"],
		dateAdded: "2024-01-10",
	},
	{
		title: "Building REST APIs with Effect",
		description:
			"Build production-grade REST APIs with Effect's HTTP platform and Schema.",
		url: "https://effect.website/docs/guides/http-server/",
		category: "Learning",
		author: "Effect Team",
		authorUrl: "https://github.com/Effect-TS",
		tags: ["HTTP", "API"],
		dateAdded: "2024-05-01",
	},
	{
		title: "Error Handling in Effect",
		description:
			"Exhaustive error handling via typed error channels — no try-catch boilerplate.",
		url: "https://effect.website/docs/guides/error-management/two-error-types/",
		category: "Learning",
		author: "Effect Team",
		authorUrl: "https://github.com/Effect-TS",
		tags: ["Error Handling", "Beginner"],
		dateAdded: "2024-02-15",
	},
	{
		title: "Dependency Injection with Layers",
		description:
			"Compile-time safe dependency injection and modular service composition.",
		url: "https://effect.website/docs/guides/context-management/layers/",
		category: "Learning",
		author: "Effect Team",
		authorUrl: "https://github.com/Effect-TS",
		tags: ["Layers", "Intermediate"],
		dateAdded: "2024-04-10",
	},
	{
		title: "Effect Schema: Validation & Serialization",
		description:
			"Runtime validation, encoding/decoding, and type-safe data transformations.",
		url: "https://effect.website/docs/guides/schema/introduction/",
		category: "Learning",
		author: "Effect Team",
		authorUrl: "https://github.com/Effect-TS",
		tags: ["Schema", "Validation"],
		dateAdded: "2024-03-05",
	},
	{
		title: "Effect + Next.js Starter",
		description:
			"Full-stack TypeScript template with Effect and type-safe API routes.",
		url: "https://github.com/ethanniser/effect-nextjs-template",
		category: "Learning",
		author: "Ethan Niser",
		authorUrl: "https://twitter.com/ethanniser",
		tags: ["Next.js", "Template"],
		dateAdded: "2024-09-01",
	},
	{
		title: "Effect HTTP API Template",
		description:
			"Production-ready HTTP API template with auth, database, and OpenAPI docs.",
		url: "https://github.com/Effect-TS/examples",
		category: "Learning",
		author: "Effect Team",
		authorUrl: "https://github.com/Effect-TS",
		tags: ["HTTP", "Template"],
		dateAdded: "2024-08-15",
	},

	// ── Articles ─────────────────────────────────────────────────
	{
		title: "Effect vs. fp-ts: A Migration Guide",
		description:
			"fp-ts vs Effect comparison with a step-by-step migration path.",
		url: "https://effect.website/blog/fp-ts-to-effect/",
		category: "Article",
		author: "Giulio Canti",
		authorUrl: "https://github.com/gcanti",
		tags: ["fp-ts", "Migration"],
		dateAdded: "2024-04-20",
	},
	{
		title: "Why We Chose Effect at Scale",
		description:
			"Adopting Effect in production — what worked, what didn't, and lessons learned.",
		url: "https://dev.to/effect/why-effect-4k7f",
		category: "Article",
		author: "Sandro Maglione",
		authorUrl: "https://twitter.com/SandroMaworx",
		tags: ["Production", "Case Study"],
		dateAdded: "2024-11-05",
	},
	{
		title: "Typed Errors Are Underrated",
		description:
			"Why modeling errors in the type system matters and how Effect makes it ergonomic.",
		url: "https://ethanniser.dev/blog/effect-typed-errors/",
		category: "Article",
		author: "Ethan Niser",
		authorUrl: "https://twitter.com/ethanniser",
		tags: ["Error Handling", "TypeScript"],
		dateAdded: "2024-06-30",
	},
];
