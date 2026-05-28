export interface BlogAuthor {
	name: string;
	title: string;
	avatar: string;
	url: string;
}

export interface BlogPost {
	slug: string;
	title: string;
	excerpt: string;
	date: string;
	readingTime: string;
	tags: string[];
	authors: BlogAuthor[];
	featured?: boolean;
	coverImage?: string;
	/** If true, this post has local content and should be rendered on this site */
	hasLocalContent?: boolean;
}

const MONTH_MAP: Record<string, string> = {
	Jan: "01",
	Feb: "02",
	Mar: "03",
	Apr: "04",
	May: "05",
	Jun: "06",
	Jul: "07",
	Aug: "08",
	Sep: "09",
	Oct: "10",
	Nov: "11",
	Dec: "12",
};

/**
 * Returns the URL for a blog post.
 * - Posts with `hasLocalContent` link to the local route.
 * - "This Week In Effect" posts link to effect.website with date-based paths.
 * - All other posts link to effect.website using the slug directly.
 */
export function getPostUrl(post: BlogPost): string {
	if (post.hasLocalContent) {
		return `/blog/${post.slug}`;
	}

	if (post.tags.includes("This Week In Effect")) {
		// Parse date like "Feb 27, 2026" into "/blog/this-week-in-effect/2026/02/27/"
		const parts = post.date.replace(",", "").split(" ");
		const month = MONTH_MAP[parts[0]] ?? "01";
		const day = parts[1].padStart(2, "0");
		const year = parts[2];
		return `https://effect.website/blog/this-week-in-effect/${year}/${month}/${day}/`;
	}

	return `https://effect.website/blog/${post.slug}/`;
}

export const AUTHORS: Record<string, BlogAuthor> = {
	michael: {
		name: "Michael Arnaldi",
		title: "BDFL",
		avatar: "/authors/michael_arnaldi.png",
		url: "https://github.com/mikearnaldi",
	},
	mirela: {
		name: "Mirela Prifti",
		title: "Community Manager",
		avatar: "/authors/mirela_prifti.png",
		url: "https://twitter.com/MirelaPriftix",
	},
	davide: {
		name: "Davide Scognamiglio",
		title: "Project Manager",
		avatar: "/authors/davide_scognamiglio.png",
		url: "https://twitter.com/DadeSkoTV",
	},
	maxwell: {
		name: "Maxwell Brown",
		title: "Effect Core Contributor",
		avatar: "/authors/maxwell_brown.png",
		url: "https://github.com/IMax153",
	},
	tim: {
		name: "Tim Smart",
		title: "Founding Engineer",
		avatar: "/authors/tim_smart.png",
		url: "https://github.com/tim-smart",
	},
	giulio: {
		name: "Giulio Canti",
		title: "Founding Engineer",
		avatar: "/authors/giulio_canti.png",
		url: "https://github.com/gcanti",
	},
};

export const BLOG_TAGS = [
	"All",
	"Cause & Effect",
	"Effect",
	"Effect Playground",
	"Effect Schema",
	"Effect Website",
	"Miscellaneous",
	"Release",
	"This Week In Effect",
	"TypeScript",
] as const;

export type BlogTag = (typeof BLOG_TAGS)[number];

// Tag color mapping -- distinct hues per category for visual scanning
export const TAG_COLORS: Record<string, string> = {
	Release: "#22c55e", // green
	Effect: "#818cf8", // indigo
	"This Week In Effect": "#a78bfa", // violet-400 (WCAG AA)
	"Cause & Effect": "#f472b6", // pink
	"Effect Schema": "#06b6d4", // cyan
	"Effect Playground": "#c4b5fd", // violet-300 (differentiate from TWIE)
	"Effect Website": "#fb923c", // orange
	TypeScript: "#3b82f6", // blue
	Miscellaneous: "#94a3b8", // slate
};

export function getTagColor(tag: string): string {
	return TAG_COLORS[tag] ?? "#a1a1aa"; // zinc-400 fallback (WCAG AA)
}

export const BLOG_POSTS: BlogPost[] = [
	{
		slug: "effect-v4-beta",
		title: "Effect v4 Beta",
		excerpt:
			"After years of experimentation, community feedback, and iteration, Effect v4 is officially in beta. Rewritten runtime, leaner bundles, unified versioning, and a consolidated core package.",
		date: "Feb 18, 2026",
		readingTime: "8 min read",
		tags: ["Release", "Effect"],
		authors: [AUTHORS.maxwell],
		featured: true,
		coverImage: "/assets/images/featured-post.png",
		hasLocalContent: true,
	},
	{
		slug: "this-week-in-effect-107",
		title: "This Week in Effect #107",
		excerpt:
			"Effect v4 Beta updates and a dedicated Office Hours Q&A covering the latest changes, improvements, and community feedback.",
		date: "Feb 27, 2026",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-106",
		title: "This Week in Effect #106",
		excerpt:
			"Effect v4 Beta release! Rewritten runtime. Smaller bundles. Unified package system.",
		date: "Feb 20, 2026",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-105",
		title: "This Week in Effect #105",
		excerpt:
			"Effect-viz, an Effect runtime visualizer. Lalph AI Agent Orchestrator 3 and Office Hours 15 coding sessions.",
		date: "Feb 13, 2026",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-104",
		title: "This Week in Effect #104",
		excerpt:
			"Claude Code recommending Effect, again! Effect and the Near Inexpressible Majesty of Layers by Kit Langton. Lalph & Effect Office Hours coding sessions.",
		date: "Feb 6, 2026",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-103",
		title: "This Week in Effect #103",
		excerpt:
			"Actor Model | Effect Cluster. Refactoring Twitch-Spotify Integration with Effect Cluster & Effect Office Hours coding sessions.",
		date: "Jan 30, 2026",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-102",
		title: "This Week in Effect #102",
		excerpt:
			"13k stars! I wish I learned Effect sooner, the secret to production-grade Typescript. RcMap | Effect in 5(ish). Hacking on Lalph & Effect Office Hours coding sessions.",
		date: "Jan 23, 2026",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-101",
		title: "This Week in Effect #101",
		excerpt:
			"6k Discord members. distilled-cloudflare by Alchemy. Cache Effect in 5(ish) by Lucas Barake. Effect Office Hours and ChEffect coding sessions.",
		date: "Jan 16, 2026",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-100",
		title: "This Week in Effect #100",
		excerpt:
			"Effect Institute Official Launch. effect-sql-pg support by Drizzle. Effect Berlin Meetup 2. Effect Office Hours 11 and ChEffect 12.",
		date: "Jan 9, 2026",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-99",
		title: "This Week in Effect #99",
		excerpt: "Happy New Year!",
		date: "Jan 2, 2026",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-98",
		title: "This Week in Effect #98",
		excerpt:
			"Xmas gift from the terminal.shop for the Effect community! effect-distributed-lock by Ethan Niser.",
		date: "Dec 27, 2025",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-97",
		title: "This Week in Effect #97",
		excerpt:
			"Cause & Effect 7 with Adam Rankin, CTO at Warp. Effect Office Hours 10. justfuckinguseeffect.dev.",
		date: "Dec 19, 2025",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-96",
		title: "This Week in Effect #96",
		excerpt:
			"Effect Institute by Kit Langton. The Case for Effect by Ryan Hunter. More Effect videos by Lucas Barake.",
		date: "Dec 12, 2025",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-95",
		title: "This Week in Effect #95",
		excerpt:
			"Advent of Effect. SvelteKit and Effect with Dillon Mulroy. New ChEffect episodes.",
		date: "Dec 5, 2025",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-94",
		title: "This Week in Effect #94",
		excerpt:
			"Effect Solutions and doctor-effect by Kit Langton. Office Hours and ChEffect 8 coding sessions.",
		date: "Nov 28, 2025",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-93",
		title: "This Week in Effect #93",
		excerpt:
			"12k stars on GitHub! Maybe I Was Wrong About Effect by Ben Davis. Effect NYC Meetup hosted by Warp. Effect Office Hours 9.",
		date: "Nov 21, 2025",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-92",
		title: "This Week in Effect #92",
		excerpt:
			"OpenRouter's co-founder, Louis Vichy, on the Cause & Effect podcast. Building AI applications with Effect & Netlify. Effect Office Hours 8.",
		date: "Nov 14, 2025",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-91",
		title: "This Week in Effect #91",
		excerpt:
			"5 million npm downloads per week milestone! Effect 3.19 release. Vienna Meetup Dec 18. Effect Office Hours 7 & ChEffect coding session.",
		date: "Nov 7, 2025",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-90",
		title: "This Week in Effect #90",
		excerpt:
			"Livestream with Teej DV & Kit Langton. Effect, the Good Parts, by Dillon Mulroy & Swyx. Effect + Next.js & Panel Discussion from Effect Milan Meetup. Effect Office Hours 6.",
		date: "Oct 31, 2025",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-89",
		title: "This Week in Effect #89",
		excerpt:
			"Learning Effect with teej dv & Kit Langton. Error Handling & Effectful Programming in TypeScript w/ Effect by Mattia Manzati. Effect Office Hours 5 & Rebuilding Contentlayer with Effect coding sessions.",
		date: "Oct 24, 2025",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-88",
		title: "This Week in Effect #88",
		excerpt:
			"Visual Effect is now open-source! Effect Milan Meetup. Effect Office Hours 4. Twitch-Spotify Integration and Effect AI SDK Refactor coding sessions.",
		date: "Oct 17, 2025",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-87",
		title: "This Week in Effect #87",
		excerpt:
			"effect-atom visualizer. AI SDK supporting Effect Schema. New Effect course by Lucas Barake. Effect Office Hours 3. ChEffect coding session.",
		date: "Oct 10, 2025",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-86",
		title: "This Week in Effect #86",
		excerpt:
			"Effect 3.18 release. Effect Docs search powered by Mixedbread. Effect Office Hours 2. ChEffect & Twitch - Spotify Integration coding sessions.",
		date: "Oct 3, 2025",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-85",
		title: "This Week in Effect #85",
		excerpt:
			"Chat persistence added to Effect AI SDK. Effect Office Hours Episode 1. Effect Milan Meetup on Oct 16th. ChEffect and Twitch - Spotify Integration development coding sessions.",
		date: "Sep 26, 2025",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-84",
		title: "This Week in Effect #84",
		excerpt:
			"Cause & Effect episode with the CTO of Spiko! Effect AI SDK Release. Building a CLI Application coding session.",
		date: "Sep 19, 2025",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-83",
		title: "This Week in Effect #83",
		excerpt:
			"Effect showcased at the official AWS Developers channel! Complex dependencies now more manageable with Effect Layers. Rewriting Effect's CLI code session.",
		date: "Sep 12, 2025",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-82",
		title: "This Week in Effect #82",
		excerpt:
			"The difficulty of complexity by Ethan Niser. Demystifying Effect Scopes by Harry Solovay. Coding sessions, Rebuilding ContentLayer, Effect API provider integration for Google & ChEffect development.",
		date: "Sep 5, 2025",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-81",
		title: "This Week in Effect #81",
		excerpt:
			"Effect Hamburg Meetup on Sept 5th. Dedicated support channels for companies using Effect. Twitch-Spotify Integration, Rebuilding ContentLayer & Building a GitHub Action coding sessions.",
		date: "Aug 29, 2025",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-80",
		title: "This Week in Effect #80",
		excerpt:
			"11k stars on GitHub! Building ChEffect (Part 2) & API Provider Integration for Google (PART 3). Leap now supports Effect.",
		date: "Aug 22, 2025",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-79",
		title: "This Week in Effect #79",
		excerpt:
			"Claude Code from scratch with Effect, by Kit Langton. Amazon Bedrock AI provider integration. Implementing a feature or Effect Workflows.",
		date: "Aug 15, 2025",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-78",
		title: "This Week in Effect #78",
		excerpt:
			"New Cause & Effect episode with Dillon Mulroy. effect-rx renamed to effect-atom. ChEffect - a local-first app with Effect & LiveStore, Effect on the front-end, and more content and technical updates.",
		date: "Aug 8, 2025",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-77",
		title: "This Week in Effect #77",
		excerpt:
			"Effect featured on the devtools-fm podcast, more debugging improvements including Span Stack & Current Fibers, plus content updates on the Effect API Provider Integration for Google, the Effect Warehouse App, and more.",
		date: "Aug 1, 2025",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-76",
		title: "This Week in Effect #76",
		excerpt:
			"Effect 3.17 is here! Key highlights - Effect RPC + TanStack Query setup by Michael Fester, Effect HTTP API with Next.js by Ethan Niser, live sessions on building a GitHub Action, local-first apps, Effect CLI, and more!",
		date: "Jul 25, 2025",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-75",
		title: "This Week in Effect #75",
		excerpt:
			"New Visual Effect demos, more livestreams and app-building tutorials from the Effect team and community, library improvements, and a podcast with Michael Arnaldi on building reliable systems with Effect.",
		date: "Jul 18, 2025",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-74",
		title: "This Week in Effect #74",
		excerpt:
			"Visual Effect by Kit Langton. Effect Workflows & Effect-native MCP Server live coding. Technical updates in Effect.",
		date: "Jul 11, 2025",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-73",
		title: "This Week in Effect #73",
		excerpt:
			"Effect hit 10K stars on GitHub. Matt Pocock's video on why Effect captured his heart. Technical updates in Effect.",
		date: "Jul 4, 2025",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-72",
		title: "This Week in Effect #72",
		excerpt:
			"Voice AI Orchestration Layer with Effect & TypeScript. Effect trending on GitHub. Schema v4 sneak peeks. Technical updates in Effect.",
		date: "Jun 27, 2025",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-71",
		title: "This Week in Effect #71",
		excerpt:
			"How DXOS uses Effect to transform AI and How Expand.ai turns the Internet into a Database with Effect from Effect Days 2025. Technical updates in Effect.",
		date: "Jun 20, 2025",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-70",
		title: "This Week in Effect #70",
		excerpt:
			"LSP 0.20.1 and Effect-mcp releases. Effective Pragmatism and Next-gen DevTools for Effect from Effect Days 2025. Technical updates in Effect.",
		date: "Jun 13, 2025",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-69",
		title: "This Week in Effect #69",
		excerpt:
			"Check out durable workflows in TypeScript with Effect and the latest Effect's LSP 0.18 release. Simplifying Forms with Effect & Incremental Adoption of Effect Workshop from Effect Days 2025.",
		date: "Jun 6, 2025",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-68",
		title: "This Week in Effect #68",
		excerpt:
			"MasterClass' AI Voice Chat built with Effect. Effect for AWS Lambda. Effect 3.16 release.",
		date: "May 30, 2025",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-67",
		title: "This Week in Effect #67",
		excerpt:
			"Effect Days 2025 talks, Structured Concurrency & Effect on the Frontend. Effect Paris Meetup 5 recap. Technical updates in Effect.",
		date: "May 23, 2025",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-66",
		title: "This Week in Effect #66",
		excerpt: "Effect Cluster by Tim Smart. Effect 3.15 release.",
		date: "May 16, 2025",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-65",
		title: "This Week in Effect #65",
		excerpt:
			"Building LLM Systems with Effect at Markprompt by Elliot Dauber. Testing with Effect by Edouard Penin. Technical Updates in Effect.",
		date: "May 9, 2025",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-64",
		title: "This Week in Effect #64",
		excerpt:
			"Production-grade app architecture (Effect Days 2025 Workshop Part 1). Building an Effect tracer using performance track by Mattia Manzati.",
		date: "May 2, 2025",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-63",
		title: "This Week in Effect #63",
		excerpt:
			"Rebuilding Redis for great Effect (Effect Days 2025). Mattia Manzati joins the Effectful Team. Technical updates in Effect.",
		date: "Apr 25, 2025",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-62",
		title: "This Week in Effect #62",
		excerpt:
			"Effect for Domains at Vercel (Effect Days 2025). The Death of tRPC? Effect's HttpApi Library - by Lucas Barake.",
		date: "Apr 18, 2025",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-61",
		title: "This Week in Effect #61",
		excerpt:
			"Building Effect 4.0 - Effect Days talk. Effect added to the X codebase. Technical updates.",
		date: "Apr 11, 2025",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-60",
		title: "This Week in Effect #60",
		excerpt:
			"Building Effect-ive Agents & Opening Remarks from Effect Days 2025. Developing AI Applications with Effect by Maxwell Brown. Technical updates.",
		date: "Apr 4, 2025",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-59",
		title: "This Week in Effect #59",
		excerpt: "Effect Days 2025 recap. Effect 3.14 Release.",
		date: "Mar 28, 2025",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-58",
		title: "This Week in Effect #58",
		excerpt:
			"Johannes Schickling MC at Effect Days. Technical updates in Effect.",
		date: "Mar 14, 2025",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-57",
		title: "This Week in Effect #57",
		excerpt:
			"Michael Arnaldi speaking at Effect Days. Cause & Effect Episode 2 Release. Technical updates in Effect.",
		date: "Mar 7, 2025",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-56",
		title: "This Week in Effect #56",
		excerpt:
			"Dmytro Maretskyi speaking at Effect Days. Technical updates in Effect.",
		date: "Feb 28, 2025",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-55",
		title: "This Week in Effect #55",
		excerpt:
			"Mattia Manzati & Elliot Dauber speaking at Effect Days. Reimagining Contentlayer with Effect Part 14. Technical updates in Effect.",
		date: "Feb 21, 2025",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-54",
		title: "This Week in Effect #54",
		excerpt:
			"Tim Suchanek & David Golightly speaking at Effect Days. Effect 3.13 has been released!",
		date: "Feb 14, 2025",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-53",
		title: "This Week in Effect #53",
		excerpt:
			"Edouard Penin speaking at the Effect Days. Evryg Effect Days sponsor announcement. Technical updates in Effect.",
		date: "Feb 7, 2025",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-52",
		title: "This Week in Effect #52",
		excerpt:
			"Antoine Coulon and Victor Korzunin speaking at the Effect Days. Re-building Contentlayer with Effect (Part 12) by Maxwell Brown and Tim Smart. Technical updates in Effect.",
		date: "Jan 31, 2025",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-51",
		title: "This Week in Effect #51",
		excerpt:
			"Attila Vecserek and Tim Smart speaking at the Effect Days. Effect Paris Meetup 4. Re-building Contentlayer with Effect (Part 11) by Maxwell Brown and Tim Smart. Technical updates in Effect.",
		date: "Jan 24, 2025",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-50",
		title: "This Week in Effect #50",
		excerpt:
			"Sandro Maglione speaking at the Effect Days. Re-building Contentlayer with Effect (Part 10) by Maxwell Brown and Tim Smart. Technical updates in Effect.",
		date: "Jan 17, 2025",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-49",
		title: "This Week in Effect #49",
		excerpt:
			"Inato sponsoring Effect Days 2025. Technical updates in Effect. Re-building Contentlayer with Effect (Part 8) by Maxwell Brown and Tim Smart.",
		date: "Jan 10, 2025",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-48",
		title: "This Week in Effect #48",
		excerpt:
			"Technical updates in Effect. Autonomous Software - Building Agentic Workflows with Effect talk by Maxwell Brown.",
		date: "Jan 3, 2025",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-47",
		title: "This Week in Effect #47",
		excerpt: "Effect 3.12 Release. Happy Holidays from the Effect Team.",
		date: "Dec 27, 2024",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-46",
		title: "This Week in Effect #46",
		excerpt:
			"Maxwell Brown speaking at Effect Days 2025. Building an Effect Warehouse App (Part 5) by Mattia Manzati. Technical updates in Effect.",
		date: "Dec 20, 2024",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-45",
		title: "This Week in Effect #45",
		excerpt:
			"Jeremie Dayan speaking at Effect Days 2025. My journey as a developer. Exploring TypeScript & Effect - talk by Dillon Mulroy. Reimagining ContentLayer with Effect (Part 8) by Maxwell Brown & Tim Smart. Technical updates in Effect.",
		date: "Dec 13, 2024",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-44",
		title: "This Week in Effect #44",
		excerpt:
			"Effect 3.11 Release. Sebastian Lorenz speaking at Effect Days 2025. Learning Effect talk by Elliot Dauber, Effect Meetup SF.",
		date: "Dec 6, 2024",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-43",
		title: "This Week in Effect #43",
		excerpt:
			"Cause & Effect Podcast Launch. New Effect Job Opportunities. Technical updates in Effect.",
		date: "Nov 29, 2024",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-42",
		title: "This Week in Effect #42",
		excerpt:
			"Ethan Niser joins Effect Days 2025 as a speaker. Technical updates, and more from the Effect ecosystem.",
		date: "Nov 22, 2024",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-41",
		title: "This Week in Effect #41",
		excerpt:
			"New Effect Playground feature launch. Technical updates in Effect. Second revision of HTTP API by Tim Smart.",
		date: "Nov 15, 2024",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-40",
		title: "This Week in Effect #40",
		excerpt:
			"New Effect Playground feature launch. Technical updates in Effect. Second revision of HTTP API by Tim Smart.",
		date: "Nov 8, 2024",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-39",
		title: "This Week in Effect #39",
		excerpt: "Effect Website 2.0. Technical updates in Effect.",
		date: "Nov 1, 2024",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-38",
		title: "This Week in Effect #38",
		excerpt: "Effect 3.10 release. Effect Meetup San Francisco recap.",
		date: "Oct 25, 2024",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-37",
		title: "This Week in Effect #37",
		excerpt:
			"Effect Paris Meetup on Nov 5th. Dillon Mulroy speaking at the San Francisco Effect Meetup on Oct 21st. Technical updates in Effect.",
		date: "Oct 18, 2024",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-36",
		title: "This Week in Effect #36",
		excerpt:
			"Effect Days 2025 announcement. Effect Paris Meetup #3. Effect Cluster - Design Sync Session part 7. Reimagining ContentLayer with Effect part 7.",
		date: "Oct 11, 2024",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-35",
		title: "This Week in Effect #35",
		excerpt:
			"Effect Days 2025 announcement. Effect Paris Meetup #3. Effect Cluster - Design Sync Session part 7. Reimagining ContentLayer with Effect part 7.",
		date: "Oct 4, 2024",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-34",
		title: "This Week in Effect #34",
		excerpt:
			"Effect technical updates. Effect Meetup San Francisco speakers announcement. Reimagining ContentLayer with Effect - Part 6 by Tim Smart.",
		date: "Sep 27, 2024",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-33",
		title: "This Week in Effect #33",
		excerpt:
			"Effect 3.8 release. VSCode extension update. Effect Cluster Development - Re-Thinking the Entity Manager by Maxwell Brown.",
		date: "Sep 20, 2024",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-32",
		title: "This Week in Effect #32",
		excerpt:
			"Effect technical updates. Create Effect App Release. Effect Meetup San Francisco on Oct 21. Effect Cluster - Design Sync Session ep. 6.",
		date: "Sep 13, 2024",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-31",
		title: "This Week in Effect #31",
		excerpt:
			"Effect technical updates. Effect Cluster - Design Sync Session ep. 5 by Michael Arnaldi and Maxwell Brown.",
		date: "Sep 6, 2024",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-30",
		title: "This Week in Effect #30",
		excerpt:
			"Effect 3.7 release. Reimagining ContentLayer With Effect by Maxwell Brown and Tim Smart ep.4.",
		date: "Aug 30, 2024",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-29",
		title: "This Week in Effect #29",
		excerpt:
			"Effect technical updates. From React to Effect by Michael Arnaldi. Effect Cluster - Design Sync Session (Part 2). Articles from community members about Effect RPC and Effect Schema.",
		date: "Aug 23, 2024",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-28",
		title: "This Week in Effect #28",
		excerpt:
			"Effect technical updates. The Problem With Error Handling in Typescript, video by Ethan Niser. Effect beginners course launch by Sandro Maglione.",
		date: "Aug 16, 2024",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-27",
		title: "This Week in Effect #27",
		excerpt:
			"Technical Updates in Effect. Effect Best Practises by Ethan Niser. Reimagining Contentlayer ep.3 & Effect Cluster ep.1 video releases.",
		date: "Aug 9, 2024",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-26",
		title: "This Week in Effect #26",
		excerpt:
			"Effect 3.6 and Effect Playground releases. Reimagining Contentlayer ep. 3 by Maxwell Brown and Tim Smart. Effect Cluster ep.1 by Michael Arnaldi, Maxwell Brown and Mattia Manzati.",
		date: "Aug 2, 2024",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-25",
		title: "This Week in Effect #25",
		excerpt:
			"Effect Schema 0.69 release. What is Concurrency? by Ethan Niser. Reimagining Contentlayer ep. 2 by Michael Arnaldi and Maxwell Brown.",
		date: "Jul 26, 2024",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-24",
		title: "This Week in Effect #24",
		excerpt:
			"Technical Updates in Effect. Reimagining Contentlayer by Michael Arnaldi and Maxwell Brown.",
		date: "Jul 19, 2024",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-23",
		title: "This Week in Effect #23",
		excerpt:
			"Straight from our Event in Vienna! A summary of what happened in the Effect Community and Ecosystem.",
		date: "Jul 12, 2024",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-22",
		title: "This Week in Effect #22",
		excerpt:
			"Technical updates in Effect. Effect, The Missing TypeScript Standard Library by Tomas Horacek.",
		date: "Jul 5, 2024",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-21",
		title: "This Week in Effect #21",
		excerpt:
			"Technical updates in Effect. Effect, The Origin Story by Michael Arnaldi. Community events updates.",
		date: "Jun 28, 2024",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-20",
		title: "This Week in Effect #20",
		excerpt:
			"Effect 3.4 & Schema 0.68.0 release. Discriminated Unions in TypeScript, Effect, and ArkType by David Blass. Michael Arnaldi joining the London Node.js group.",
		date: "Jun 21, 2024",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-19",
		title: "This Week in Effect #19",
		excerpt:
			"Technical updates in Effect. The Most Exciting Use of Technology award. Effect CLI - A love letter to developers tired of settling for less by Maxwell Brown.",
		date: "Jun 14, 2024",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-18",
		title: "This Week in Effect #18",
		excerpt:
			"Effect 3.3 release. Building type-safe REST APIs powered by @effect/schema by Anna DevMiner.",
		date: "Jun 7, 2024",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-17",
		title: "This Week in Effect #17",
		excerpt:
			"Technical updates in Effect. Next level type safety with Effect by Aleksandra Sikora. Effect Cluster Integration with Effect RPC Ep.2 by Mattia Manzati.",
		date: "May 31, 2024",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-16",
		title: "This Week in Effect #16",
		excerpt:
			"Effect 3.2 release. Durable Workflows with Effect Cluster by Mattia Manzati. New Effect Paris Meetup date announcement. Effect nomination for Javascript Open Source Award.",
		date: "May 24, 2024",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-15",
		title: "This Week in Effect #15",
		excerpt:
			"Technical updates in Effect. Effective State Machines for Complex Logic by David Khourshid. Integrating Effect with Remix Ep.1 by Michael Arnaldi.",
		date: "May 17, 2024",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-14",
		title: "This Week in Effect #14",
		excerpt:
			"Technical updates in Effect. Building AI Agents by Tim Suchanek. Building Skott, A Journey of Effect-Driven Development by Antoine Coulon.",
		date: "May 10, 2024",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-13",
		title: "This Week in Effect #13",
		excerpt:
			"Technical updates in Effect. Effect 3.1 release. AI-Native User Experiences. The Effect Opportunity talk by Guillermo Rauch. Effect Advanced workshop by Maxwell Brown.",
		date: "May 3, 2024",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-12",
		title: "This Week in Effect #12",
		excerpt:
			"Technical updates in Effect. Why Effect is more important than ZIO talk by John De Goes. Effect workshop by Ethan Niser.",
		date: "Apr 26, 2024",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-11",
		title: "This Week in Effect #11",
		excerpt:
			"Effect 3.0 announcement and community reactions. Technical updates in Effect.",
		date: "Apr 19, 2024",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-10",
		title: "This Week in Effect #10",
		excerpt:
			"Technical updates in Effect, effect/schema talk by Jess Martin, a new video about Effect by Lucas Barake, and Effect Paris Meetup update.",
		date: "Apr 12, 2024",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-9",
		title: "This Week in Effect #9",
		excerpt:
			"Technical updates in Effect, Effect's Latest and Greatest talk by Tim Smart & Upcoming Event.",
		date: "Apr 5, 2024",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-8",
		title: "This Week in Effect #8",
		excerpt:
			"Technical updates in Effect, first conference talk release, how to sign for Effect in sign language, and an upcoming event.",
		date: "Mar 29, 2024",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-7",
		title: "This Week in Effect #7",
		excerpt:
			"Key technology releases like Schema 0.64, more insights from the recent Effect Days conference in Vienna, and new exciting content from our community.",
		date: "Mar 22, 2024",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-6",
		title: "This Week in Effect #6",
		excerpt:
			"Technical updates and the exciting announcement of the first-ever Effect Paris meetup in April!",
		date: "Mar 15, 2024",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-5",
		title: "This Week in Effect #5",
		excerpt:
			"A summary of what happened in the Effect Community and Ecosystem to help you keep track of all the news, features and changes!",
		date: "Mar 8, 2024",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-4",
		title: "This Week in Effect #4",
		excerpt:
			"Straight from our Event in Vienna! A summary of what happened in the Effect Community and Ecosystem.",
		date: "Mar 1, 2024",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-3",
		title: "This Week in Effect #3",
		excerpt:
			"A weekly summary of what happened in the Effect Community and Ecosystem to help you keep track of all the news, features and changes!",
		date: "Feb 16, 2024",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-2",
		title: "This Week in Effect #2",
		excerpt:
			"A weekly summary of what happened in the Effect Community and Ecosystem to help you keep track of all the news, features and changes!",
		date: "Feb 9, 2024",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "this-week-in-effect-1",
		title: "This Week in Effect #1",
		excerpt:
			"A weekly summary of what happened in the Effect Community and Ecosystem to help you keep track of all the news, features and changes!",
		date: "Feb 2, 2024",
		readingTime: "5 min read",
		tags: ["This Week In Effect"],
		authors: [AUTHORS.davide, AUTHORS.mirela, AUTHORS.michael],
	},
	{
		slug: "effect-3.19",
		title: "Effect 3.19 (Release)",
		excerpt:
			"New Effect release featuring @effect/cluster improvements, HashRing module, Effect.fn improvements, and more!",
		date: "Nov 4, 2025",
		readingTime: "5 min read",
		tags: ["Release", "Effect"],
		authors: [AUTHORS.tim],
	},
	{
		slug: "effect-3.18",
		title: "Effect 3.18 (Release)",
		excerpt:
			"New Effect release featuring the Graph module, Context.ReadonlyTag, and more!",
		date: "Sep 30, 2025",
		readingTime: "5 min read",
		tags: ["Release", "Effect"],
		authors: [AUTHORS.tim],
	},
	{
		slug: "effect-3.17",
		title: "Effect 3.17 (Release)",
		excerpt:
			"New Effect release featuring Layer.mock, Effect.ensureErrorType, and more!",
		date: "Jul 22, 2025",
		readingTime: "5 min read",
		tags: ["Release", "Effect"],
		authors: [AUTHORS.tim],
	},
	{
		slug: "effect-3.16",
		title: "Effect 3.16 (Release)",
		excerpt:
			"New Effect release featuring the new ExecutionPlan module, Effect.Service & LayerMap improvements, and more!",
		date: "May 28, 2025",
		readingTime: "5 min read",
		tags: ["Release", "Effect"],
		authors: [AUTHORS.tim],
	},
	{
		slug: "effect-3.15",
		title: "Effect 3.15 (Release)",
		excerpt:
			"New Effect release featuring Stream.toAsyncIterable, Effect.catchTag & Effect.filterOr* improvements and more!",
		date: "May 12, 2025",
		readingTime: "5 min read",
		tags: ["Release", "Effect"],
		authors: [AUTHORS.tim],
	},
	{
		slug: "effect-3.14",
		title: "Effect 3.14 (Release)",
		excerpt:
			"New Effect release featuring LayerMap module, @effect/rpc refactor, and more.",
		date: "Mar 20, 2025",
		readingTime: "5 min read",
		tags: ["Release", "Effect"],
		authors: [AUTHORS.tim],
	},
	{
		slug: "effect-3.13",
		title: "Effect 3.13 (Release)",
		excerpt:
			"New Effect release featuring Standard Schema support, Effect.fn improvements & more!",
		date: "Feb 14, 2025",
		readingTime: "5 min read",
		tags: ["Release", "Effect"],
		authors: [AUTHORS.tim],
	},
	{
		slug: "effect-3.12",
		title: "Effect 3.12 (Release)",
		excerpt:
			"New Effect release featuring Effect.fn & Cron improvements, Schema additions, and more!",
		date: "Dec 23, 2024",
		readingTime: "5 min read",
		tags: ["Release", "Effect"],
		authors: [AUTHORS.tim],
	},
	{
		slug: "effect-3.11",
		title: "Effect 3.11 (Release)",
		excerpt:
			"New Effect release featuring Effect.fn, Micro improvements, and more!",
		date: "Dec 2, 2024",
		readingTime: "5 min read",
		tags: ["Release", "Effect"],
		authors: [AUTHORS.tim, AUTHORS.giulio],
	},
	{
		slug: "effect-website-2.0",
		title: "Effect Website 2.0 (Release)",
		excerpt:
			"Release post highlighting features and functionality of the newly rebuilt Effect Website.",
		date: "Oct 29, 2024",
		readingTime: "5 min read",
		tags: ["Release", "Effect Website"],
		authors: [AUTHORS.maxwell],
	},
	{
		slug: "effect-3.10",
		title: "Effect 3.10 (Release)",
		excerpt: "Release post highlighting new additions and changes.",
		date: "Oct 22, 2024",
		readingTime: "5 min read",
		tags: ["Release", "Effect"],
		authors: [AUTHORS.tim],
	},
	{
		slug: "effect-3.9",
		title: "Effect 3.9 (Release)",
		excerpt: "Release post highlighting new additions and changes.",
		date: "Oct 7, 2024",
		readingTime: "5 min read",
		tags: ["Release", "Effect"],
		authors: [AUTHORS.tim],
	},
	{
		slug: "effect-3.8",
		title: "Effect 3.8 (Release)",
		excerpt: "Release post highlighting new additions and changes.",
		date: "Sep 16, 2024",
		readingTime: "5 min read",
		tags: ["Release", "Effect"],
		authors: [AUTHORS.tim],
	},
	{
		slug: "create-effect-app",
		title: "Create Effect App (Release)",
		excerpt:
			"Release post highlighting features and functionality of the new create-effect-app command-line tool.",
		date: "Sep 13, 2024",
		readingTime: "5 min read",
		tags: ["Release"],
		authors: [AUTHORS.maxwell],
	},
	{
		slug: "effect-3.7",
		title: "Effect 3.7 (Release)",
		excerpt: "Release post highlighting new additions and changes.",
		date: "Aug 30, 2024",
		readingTime: "5 min read",
		tags: ["Release", "Effect"],
		authors: [AUTHORS.tim],
	},
	{
		slug: "effect-3.6",
		title: "Effect 3.6 (Release)",
		excerpt: "Release post highlighting new additions and changes.",
		date: "Jul 30, 2024",
		readingTime: "5 min read",
		tags: ["Release", "Effect"],
		authors: [AUTHORS.tim],
	},
	{
		slug: "effect-playground",
		title: "Effect Playground (Release)",
		excerpt:
			"Release post highlighting features and functionality of the Effect Website Playground.",
		date: "Jul 29, 2024",
		readingTime: "5 min read",
		tags: ["Release", "Effect Playground"],
		authors: [AUTHORS.maxwell],
	},
	{
		slug: "schema-0.69",
		title: "Schema 0.69 (Release)",
		excerpt: "Release post highlighting new additions and breaking changes.",
		date: "Jul 23, 2024",
		readingTime: "5 min read",
		tags: ["Release", "Effect Schema"],
		authors: [AUTHORS.giulio],
	},
	{
		slug: "effect-3.5",
		title: "Effect 3.5 (Release)",
		excerpt: "Release post highlighting new additions and changes.",
		date: "Jul 10, 2024",
		readingTime: "5 min read",
		tags: ["Release", "Effect"],
		authors: [AUTHORS.tim],
	},
	{
		slug: "effect-3.4",
		title: "Effect 3.4 (Release)",
		excerpt: "Release post highlighting new additions and changes.",
		date: "Jun 20, 2024",
		readingTime: "5 min read",
		tags: ["Release", "Effect"],
		authors: [AUTHORS.tim],
	},
	{
		slug: "schema-0.68",
		title: "Schema 0.68 (Release)",
		excerpt: "Release post highlighting new additions and breaking changes.",
		date: "Jun 17, 2024",
		readingTime: "5 min read",
		tags: ["Release", "Effect Schema"],
		authors: [AUTHORS.giulio],
	},
	{
		slug: "effect-3.3",
		title: "Effect 3.3 (Release)",
		excerpt: "Release post highlighting new additions and changes.",
		date: "Jun 6, 2024",
		readingTime: "5 min read",
		tags: ["Release", "Effect"],
		authors: [AUTHORS.tim],
	},
	{
		slug: "effect-3.2",
		title: "Effect 3.2 (Release)",
		excerpt: "Release post highlighting new additions and changes.",
		date: "May 20, 2024",
		readingTime: "5 min read",
		tags: ["Release", "Effect"],
		authors: [AUTHORS.tim],
	},
	{
		slug: "schema-0.67",
		title: "Schema 0.67 (Release)",
		excerpt: "Release post highlighting new additions and breaking changes.",
		date: "May 10, 2024",
		readingTime: "5 min read",
		tags: ["Release", "Effect Schema"],
		authors: [AUTHORS.giulio],
	},
	{
		slug: "effect-3.1",
		title: "Effect 3.1 (Release)",
		excerpt: "Release post highlighting new additions and changes.",
		date: "Apr 30, 2024",
		readingTime: "5 min read",
		tags: ["Release", "Effect"],
		authors: [AUTHORS.tim],
	},
	{
		slug: "effect-3.0",
		title: "Effect 3.0 (Release)",
		excerpt: "Release post highlighting new additions and breaking changes.",
		date: "Apr 16, 2024",
		readingTime: "5 min read",
		tags: ["Release", "Effect"],
		authors: [AUTHORS.michael],
	},
	{
		slug: "schema-0.64",
		title: "Schema 0.64 (Release)",
		excerpt: "Release post highlighting new additions and breaking changes.",
		date: "Mar 16, 2024",
		readingTime: "5 min read",
		tags: ["Release", "Effect Schema"],
		authors: [AUTHORS.giulio, AUTHORS.michael],
	},
	{
		slug: "effect-2.4",
		title: "Effect 2.4 (Release)",
		excerpt: "Release post highlighting new additions and breaking changes.",
		date: "Feb 21, 2024",
		readingTime: "5 min read",
		tags: ["Release", "Effect"],
		authors: [AUTHORS.michael],
	},
	{
		slug: "effect-2.3",
		title: "Effect 2.3 (Release)",
		excerpt: "Release post highlighting new additions and breaking changes.",
		date: "Feb 10, 2024",
		readingTime: "5 min read",
		tags: ["Release", "Effect"],
		authors: [AUTHORS.tim, AUTHORS.michael],
	},
	{
		slug: "effect-2025-year-in-review",
		title: "Effect 2025 - Year in Review",
		excerpt:
			"Global community events, major tooling like the Effect AI SDK, and rapidly growing adoption.",
		date: "Jan 1, 2026",
		readingTime: "5 min read",
		tags: ["Miscellaneous"],
		authors: [AUTHORS.mirela],
	},
	{
		slug: "how-mixedbread-transformed-our-search",
		title: "How Mixedbread Transformed Our Search",
		excerpt:
			"A post highlighting how Mixedbread transformed the search experience on the Effect documentation website.",
		date: "Oct 1, 2025",
		readingTime: "5 min read",
		tags: ["Miscellaneous"],
		authors: [AUTHORS.maxwell],
	},
	{
		slug: "ts-plus-postmortem",
		title: "TS+ Post-Mortem",
		excerpt:
			"A retrospective look at our attempt to create a TypeScript fork optimized for Effect developer experience, examining what we learned and why we ultimately moved in a different direction.",
		date: "Jul 3, 2025",
		readingTime: "5 min read",
		tags: ["Miscellaneous", "TypeScript"],
		authors: [AUTHORS.michael],
	},
	{
		slug: "reflections-on-effect-days-2025",
		title: "Reflections on Effect Days 2025",
		excerpt:
			"The evolution of the Effect ecosystem and its real-world adoption by companies.",
		date: "Apr 12, 2025",
		readingTime: "5 min read",
		tags: ["Miscellaneous"],
		authors: [AUTHORS.mirela],
	},
	{
		slug: "effect-ai",
		title: "Developing AI Applications with Effect",
		excerpt: "A post highlighting the new Effect AI integration packages.",
		date: "Apr 1, 2025",
		readingTime: "5 min read",
		tags: ["Miscellaneous"],
		authors: [AUTHORS.maxwell],
	},
	{
		slug: "wrapping-up-2024",
		title: "Wrapping up 2024",
		excerpt:
			"Launching Effect 3.0, winning JSNation's Most Exciting Technology open-source award, hosting our first Effect Days conference, and more community growth!",
		date: "Jan 2, 2025",
		readingTime: "5 min read",
		tags: ["Miscellaneous"],
		authors: [AUTHORS.mirela],
	},
	{
		slug: "from-react-to-effect",
		title: "From React to Effect",
		excerpt:
			"If you know React you already know Effect to a great extent. Let's explore how the mental model of Effect maps to the concept you already know from React.",
		date: "Aug 17, 2024",
		readingTime: "5 min read",
		tags: ["Miscellaneous"],
		authors: [AUTHORS.michael],
	},
	{
		slug: "effect-community-update-march-2024",
		title: "Effect Community Update - March 2024",
		excerpt:
			"Key moments from the recent Effect Days conference, community spotlight, and upcoming event.",
		date: "Mar 31, 2024",
		readingTime: "5 min read",
		tags: ["Miscellaneous"],
		authors: [AUTHORS.mirela],
	},
	{
		slug: "trip-to-the-us-2023",
		title: "Summary of the trip to the US",
		excerpt:
			"Between October and November 2023 Mike, Johannes and Mirela went to the US to held an Effect Meetup and meet with interesting folks. This is the summary of their journey.",
		date: "Feb 15, 2024",
		readingTime: "5 min read",
		tags: ["Miscellaneous"],
		authors: [AUTHORS.michael],
	},
	{
		slug: "cause-and-effect-announcement",
		title: "Cause & Effect Podcast",
		excerpt:
			"Exploring how engineers use Effect to build production-ready software in TypeScript.",
		date: "Nov 26, 2024",
		readingTime: "5 min read",
		tags: ["Cause & Effect"],
		authors: [AUTHORS.mirela],
	},
];
