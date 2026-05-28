import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Link } from "@/components/ui";
import { GridOverlay } from "../GridOverlay";
import { Footer } from "./Footer";
import { Navigation } from "./Navigation";

const upcomingEvents: Array<{
	title: string;
	date: string;
	location: string;
	flag: string;
	thumbnail: string;
	centerThumbnail?: string;
	href: string;
	description: string;
}> = [
	{
		title: "Effect Office Hours 21 🔥",
		date: "// Mar 18 · Weekly on YouTube",
		location: "",
		flag: "🌐",
		thumbnail: "https://i.ytimg.com/vi/8djMEkHLbEk/maxresdefault.jpg",
		href: "https://www.youtube.com/live/8djMEkHLbEk",
		description:
			"Weekly live office hours where the Effect team answers questions, demos features, and discusses best practices with the community.",
	},
	{
		title: "Effect Berlin Meetup #3",
		date: "// Mar 26 · Berlin, Germany",
		location: "",
		flag: "🇩🇪",
		thumbnail:
			"https://images.lumacdn.com/cdn-cgi/image/format=auto,fit=cover,dpr=2,background=white,quality=75,width=1280,height=720/event-covers/wf/83140ba6-0f01-4b33-ad42-87b1c8f4c73e.png",
		centerThumbnail:
			"/assets/images/banner - berlin.png",
		href: "https://luma.com/z39v9xqn",
		description:
			"Join the Effect community in Berlin for the third local meetup.",
	},
];

const pastEvents = [
	{
		year: "2026",
		events: [
			{
				flag: "🌐",
				date: "Mar 11",
				title: "STM in Effect + Community Q&A (Effect Office Hours 20 🔥)",
				type: "online",
				href: "https://www.youtube.com/watch?v=4v8A-tVabdg&list=PLDf3uQLaK2B_0hEiHT82cv-DotrtD6Bhi&index=1",
			},
			{
				flag: "🌐",
				date: "Mar 4",
				title: "Effect Office Hours 19 🔥",
				type: "online",
				href: "https://www.youtube.com/watch?v=BKYFmcij_gk&list=PLDf3uQLaK2B_0hEiHT82cv-DotrtD6Bhi&index=2",
			},
			{
				flag: "🌐",
				date: "Feb 25",
				title: "Effect v4 Beta Q&A (Office Hours 18 🔥)",
				type: "online",
				href: "https://www.youtube.com/watch?v=5NtYKTLoDkQ&list=PLDf3uQLaK2B_0hEiHT82cv-DotrtD6Bhi&index=2",
			},
			{
				flag: "🌐",
				date: "Feb 18",
				title: "Introducing Effect v4 beta 🚀 (Office Hours 17)",
				type: "online",
				href: "https://www.youtube.com/watch?v=P04R7lUR4Cc&list=PLDf3uQLaK2B_0hEiHT82cv-DotrtD6Bhi&index=3",
			},
			{
				flag: "🌐",
				date: "Feb 11",
				title:
					"Typed Effects in TypeScript: Laziness, Error Handling, Generator Composition (Office Hours 16)",
				type: "online",
				href: "https://www.youtube.com/watch?v=2RxCvwCN_LM&list=PLDf3uQLaK2B_0hEiHT82cv-DotrtD6Bhi&index=4",
			},
			{
				flag: "🌐",
				date: "Feb 4",
				title:
					"Implementing Effect from scratch: Laziness, Composition, and Practical TypeScript (Office Hours 15)",
				type: "online",
				href: "https://youtu.be/OJQvsGwEIuA",
			},
			{
				flag: "🇫🇷",
				date: "Feb 3",
				title: "Effect Paris Meetup #6",
				type: "meetup",
				href: "https://www.meetup.com/effect-paris/events/312953757/?eventOrigin=group_past_events",
			},
			{
				flag: "🇩🇪",
				date: "Jan 29",
				title: "Effect Berlin Meetup #2",
				type: "meetup",
				href: "https://luma.com/xdpn0t7a",
			},
			{
				flag: "🌐",
				date: "Jan 28",
				title: "Effect Services & Layers (Office Hours 14)",
				type: "online",
				href: "https://youtu.be/06htYotj_Pc",
			},
			{
				flag: "🌐",
				date: "Jan 21",
				title:
					"andThen vs flatMap, HTTP Client vs HTTP API, AI workflow and Ralph, etc. (Office Hours 13)",
				type: "online",
				href: "https://youtu.be/uJvN-2OCU-E",
			},
			{
				flag: "🌐",
				date: "Jan 14",
				title:
					"Library Design, Error Modeling, Schema vs runtime errors, Effect 4.0 APIs (Office Hours 12)",
				type: "online",
				href: "https://youtu.be/cVExYNB-dxc",
			},
			{
				flag: "🌐",
				date: "Jan 7",
				title:
					"Effect 4.0, Cluster & Workflow, Schema, Effect Institute, LLMs in Effect coding (Office Hours 11)",
				type: "online",
				href: "https://youtu.be/12fKbAE3T2A",
			},
		],
	},
	{
		year: "2025",
		events: [
			{
				flag: "🇦🇹",
				date: "Dec 18",
				title: "Effect Vienna Meetup",
				type: "meetup",
				href: "https://luma.com/rc84shks",
			},
			{
				flag: "🌐",
				date: "Dec 17",
				title:
					"Library Design, Error Modeling and Propagation, Schema Usage, Service Design (Office Hours 10)",
				type: "online",
				href: "https://youtu.be/kJpotgntcUU",
			},
			{
				flag: "🌐",
				date: "Dec 4",
				title: "SvelteKit and Effect with Dillon Mulroy",
				type: "online",
				href: "https://www.youtube.com/watch?v=8ByXE6dPkD4&t=19s",
			},
			{
				flag: "🇩🇪",
				date: "Nov 28",
				title: "Effect Hamburg Meetup #2",
				type: "meetup",
				href: "https://luma.com/nsvz6eqe",
			},
			{
				flag: "🇩🇪",
				date: "Nov 26",
				title: "Effect Berlin Meetup #1",
				type: "meetup",
				href: "https://luma.com/z0pfxfvy",
			},
			{
				flag: "🇮🇹",
				date: "Nov 25",
				title: "Effect: crafting 🍕 made simple",
				type: "meetup",
				href: "https://www.meetup.com/pug-sondrio/events/311976213/?eventOrigin=group_featured_event",
			},
			{
				flag: "🇺🇸",
				date: "Nov 19",
				title: "Effect NYC Meetup",
				type: "meetup",
				href: "",
			},
			{
				flag: "🌐",
				date: "Nov 19",
				title: "Effect Solutions, Tooling, AI and LLM use (Office Hours 9)",
				type: "online",
				href: "https://youtu.be/LYrWA9_qas4",
			},
			{
				flag: "🇺🇸",
				date: "Nov 14",
				title: "Effect-TS: ZIO through the lens of TypeScript",
				type: "meetup",
				href: "https://www.meetup.com/dallas-scala-enthusiasts/events/311520686/?utm_medium=referral&utm_campaign=announce_event&utm_source=twitter&utm_version=v2",
			},
			{
				flag: "🌐",
				date: "Nov 12",
				title:
					"Building AI applications with Effect + Netlify w/ Maxwell Brown",
				type: "online",
				href: "https://www.youtube.com/watch?v=8KmFwsj9gbI&t=3s",
			},
			{
				flag: "🌐",
				date: "Nov 12",
				title:
					"Effect managed runtime, error handling, fiber management, API design patterns (Office Hours 8)",
				type: "online",
				href: "https://youtu.be/qU5z5VqIdxg",
			},
			{
				flag: "🌐",
				date: "Nov 5",
				title:
					"Scheduling, Context, Layers, Dependency Management, Tooling, Workflows, etc. (Office Hours 7)",
				type: "online",
				href: "https://youtu.be/rXqkuu4D7fQ",
			},
			{
				flag: "🇺🇸",
				date: "Oct 31",
				title: "Effect SF Meetup",
				type: "meetup",
				href: "",
			},
			{
				flag: "🌐",
				date: "Oct 29",
				title:
					"Effect Context & Layers + Confect Library (Effect + Convex integration) (Office Hours 6)",
				type: "online",
				href: "https://youtu.be/7SLVmatKRU0",
			},
			{
				flag: "🇫🇷",
				date: "Oct 23",
				title: "Introduction à Effect.TS par la pratique",
				type: "meetup",
				href: "https://www.eventbrite.fr/e/atondev-introduction-a-effectts-par-la-pratique-tickets-1685513629639",
			},
			{
				flag: "🌐",
				date: "Oct 23",
				title:
					"Effect: the Good Parts, `use workflow`, and Vercel Domains — Dillon Mulroy",
				type: "online",
				href: "https://www.youtube.com/watch?v=VR_MQH3opc8&t=182s",
			},
			{
				flag: "🌐",
				date: "Oct 22",
				title:
					"Layers, Dependency Injection, Accessors, and Scopes in Effect (Office Hours 5)",
				type: "online",
				href: "https://youtu.be/P_DdDIByzTM",
			},
			{
				flag: "🇩🇪",
				date: "Oct 20",
				title: "Effect talk at Munich TypeScript",
				type: "conference",
				href: "",
			},
			{
				flag: "🇮🇹",
				date: "Oct 16",
				title: "Effect Milan Meetup",
				type: "meetup",
				href: "https://www.youtube.com/playlist?list=PLDf3uQLaK2B-8m3AT2Cf_oGUL-wX77KUJ",
			},
			{
				flag: "🌐",
				date: "Oct 15",
				title:
					"Effect Atom, Effect API, Tracing & Telemetry, File System Abstractions, etc. (Office Hours 4)",
				type: "online",
				href: "https://youtu.be/ev5hNgGZz6o",
			},
			{
				flag: "🌐",
				date: "Oct 8",
				title: "Effect Atom, Ecosystem Tooling, Effect LSP (Office Hours 3)",
				type: "online",
				href: "https://youtu.be/7iEx6s3Pr6Q",
			},
			{
				flag: "🌐",
				date: "Oct 1",
				title:
					"Managed Runtimes, Layers, Effect Atom, Adopting Effect in Large Codebases (Office Hours 2)",
				type: "online",
				href: "https://youtu.be/2wZxgnBn3TY",
			},
			{
				flag: "🌐",
				date: "Sep 24",
				title: "Dependency Management, Effect Service Layers (Office Hours 1)",
				type: "online",
				href: "https://youtu.be/4picSqwsA-U",
			},
			{
				flag: "🇺🇸",
				date: "Sep 19",
				title: "Effect talk at SquiggleConf 2025",
				type: "conference",
				href: "https://luma.com/effect-community?k=c",
			},
			{
				flag: "🇩🇪",
				date: "Sep 5",
				title: "Effect Hamburg Meetup #1",
				type: "meetup",
				href: "https://luma.com/44razg6s",
			},
			{
				flag: "🇪🇬",
				date: "Jul 23",
				title: "Effect talk at EgyptJS",
				type: "conference",
				href: "",
			},
			{
				flag: "🇫🇷",
				date: "May 20",
				title: "Effect Paris Meetup #5",
				type: "meetup",
				href: "https://www.meetup.com/effect-paris/events/307558421/?eventOrigin=group_past_events",
			},
			{
				flag: "🇺🇸",
				date: "May",
				title: "Effect Meetup SF",
				type: "meetup",
				href: "",
			},
			{
				flag: "🇬🇧",
				date: "Apr",
				title: "Effect talk at CityJS London",
				type: "conference",
				href: "https://www.youtube.com/watch?v=apklpPEgZgw&list=PLYDCh9vbt8_KlKLaZLWlGaYuyGke1rBBT&index=4&t=27s",
			},
			{
				flag: "🇮🇹",
				date: "Mar 19-21",
				title: "Effect Days Livorno",
				type: "conference",
				href: "https://www.youtube.com/playlist?list=PLDf3uQLaK2B9bEBZbwMv04e_zSbRNPKH6",
			},
			{
				flag: "🇫🇷",
				date: "Jan",
				title: "Effect Paris Meetup #4",
				type: "meetup",
				href: "https://www.meetup.com/effect-paris/events/305180933/?eventOrigin=group_past_events",
			},
		],
	},
	{
		year: "2024",
		events: [
			{
				flag: "🌐",
				date: "Dec",
				title: "Intro to Effect at FrontEndQueens by Laure Retru-Chavastel",
				type: "online",
				href: "https://www.youtube.com/watch?v=bfQaG1fL-F0&t=18s",
			},
			{
				flag: "🇦🇹",
				date: "Nov 26",
				title: "React Meetup Vienna",
				type: "meetup",
				href: "",
			},
			{
				flag: "🇫🇷",
				date: "Nov 5",
				title: "Effect Paris Meetup #3",
				type: "meetup",
				href: "https://www.meetup.com/effect-paris/events/304021172/?eventOrigin=group_past_events",
			},
			{
				flag: "🇺🇸",
				date: "Oct 21",
				title: "Effect Meetup SF",
				type: "meetup",
				href: "https://www.youtube.com/playlist?list=PLDf3uQLaK2B-8m3AT2Cf_oGUL-wX77KUJ",
			},
			{
				flag: "🇫🇷",
				date: "Jun 25",
				title: "Effect Paris Meetup #2",
				type: "meetup",
				href: "https://www.meetup.com/effect-paris/events/301215225/?eventOrigin=group_events_list",
			},
			{
				flag: "🇬🇧",
				date: "Jun",
				title: "Effect Loves Node.js",
				type: "meetup",
				href: "https://www.youtube.com/watch?v=wql4Ci4WLLE&t=1s",
			},
			{
				flag: "🇯🇵",
				date: "Jun",
				title: "Effect talk at Hono Conference Tokyo",
				type: "conference",
				href: "",
			},
			{
				flag: "🇺🇸",
				date: "May 8",
				title: "Effect talk at LambdaConf By Michael Arnaldi",
				type: "conference",
				href: "https://www.youtube.com/watch?v=BHuY6w9ed5o&t=8s",
			},
			{
				flag: "🇫🇷",
				date: "Apr 23",
				title: "Effect Paris Meetup #1",
				type: "meetup",
				href: "https://www.meetup.com/effect-paris/events/300307442/?eventOrigin=group_events_list",
			},
			{
				flag: "🇦🇹",
				date: "Feb 21",
				title: "Effect Days Vienna",
				type: "conference",
				href: "https://www.youtube.com/playlist?list=PLDf3uQLaK2B9a4tbMgGd9wFeEnMA50z4w",
			},
			{
				flag: "🇵🇱",
				date: "Jan",
				title: "Effect talk at WarsawJS Meetup",
				type: "conference",
				href: "",
			},
		],
	},
	{
		year: "2023",
		events: [
			{
				flag: "🇫🇷",
				date: "Dec",
				title: "Effect talk at Paris TypeScript Meetup by Antoine Coulon",
				type: "meetup",
				href: "",
			},
			{
				flag: "🇺🇸",
				date: "Nov",
				title: "Effect SF Meetup",
				type: "meetup",
				href: "https://www.youtube.com/playlist?list=PLDf3uQLaK2B-8m3AT2Cf_oGUL-wX77KUJ",
			},
		],
	},
	{
		year: "2022",
		events: [
			{
				flag: "🇦🇹",
				date: "Jun",
				title: "Intro to Effect at WorkerConf 2022 by Michael Arnaldi",
				type: "conference",
				href: "https://www.youtube.com/watch?v=zrNr3JVUc8I",
			},
		],
	},
];

// Parse event date strings like "Feb 25", "Mar 19-21", "May", "Jan" into a
// numeric value for chronological sorting. Higher values = later in the year.
function parseDateToSortKey(date: string): number {
	const months: Record<string, number> = {
		jan: 1,
		feb: 2,
		mar: 3,
		apr: 4,
		may: 5,
		jun: 6,
		jul: 7,
		aug: 8,
		sep: 9,
		oct: 10,
		nov: 11,
		dec: 12,
	};

	const lower = date.toLowerCase().trim();
	for (const [name, month] of Object.entries(months)) {
		if (lower.startsWith(name)) {
			// Extract the first day number if present (e.g. "19" from "Mar 19-21")
			const dayMatch = lower.slice(3).match(/\d+/);
			const day = dayMatch ? Number.parseInt(dayMatch[0], 10) : 0;
			return month * 100 + day;
		}
	}
	return 0;
}

// Sort year groups newest-first and events within each group in reverse
// chronological order (newest first), so the list always renders correctly
// regardless of the order events are added to the arrays.
const sortedPastEvents = pastEvents
	.map((group) => ({
		...group,
		events: [...group.events].sort(
			(a, b) => parseDateToSortKey(b.date) - parseDateToSortKey(a.date),
		),
	}))
	.sort((a, b) => Number(b.year) - Number(a.year));

const hostPerks = [
	{
		icon: "ri-megaphone-line",
		title: "Promotional support",
		description:
			"We love spreading the word! Every Effect-dedicated event gets shared with our network and community on socials and Discord.",
	},
	{
		icon: "ri-team-line",
		title: "Direct line to the team",
		description:
			"Got questions about running your event? The Effect team is just a message away on Discord.",
	},
	{
		icon: "ri-palette-line",
		title: "Banners and assets",
		description:
			"Logos, event templates, and branding assets ready to drop into your meetup page or slides.",
		href: "https://www.figma.com/community/file/effect-event-assets",
		linkLabel: "Figma kit",
	},
	{
		icon: "ri-git-repository-line",
		title: "GitHub repo template",
		description:
			"A template for talk submissions as issues, a code of conduct, and organizer checklists.",
		href: "https://github.com/effect-ts-community/meetup-template",
		linkLabel: "View on GitHub",
	},
];

function getLocationFromSrc(src: string): string {
	const filename = src.split("/").pop() ?? "";
	const name = filename
		.replace(/\.(avif|webp|jpg|png)$/, "")
		.replace(/_compressed$/, "")
		.replace(/[-_]\d+$/, "");

	const locationMap: Record<string, string> = {
		paris: "Paris",
		"meetup-paris": "Paris",
		milan: "Milan",
		"milan-giulio": "Milan",
		nyc: "NYC",
		hamburg: "Hamburg",
		"meetup-sf": "San Francisco",
		"amsterdam-award-sandro": "Amsterdam",
	};

	return locationMap[name] ?? name;
}

function PhotoCard({ src, alt }: { src: string; alt: string }) {
	const location = getLocationFromSrc(src);
	return (
		<div className="relative h-full flex-shrink-0 overflow-hidden rounded-lg">
			<img
				src={src}
				alt={alt}
				className="pointer-events-none h-full w-full object-cover select-none"
				loading="lazy"
				draggable={false}
			/>
			<span className="pointer-events-none absolute bottom-1.5 left-1.5 rounded-full border border-white/20 bg-black/60 px-2 py-0.5 text-[10px] font-medium tracking-wide text-white/90 backdrop-blur-sm md:bottom-2 md:left-2 md:px-2.5 md:text-xs">
				{location}
			</span>
		</div>
	);
}

const heroPhotos = [
	{ src: "/assets/images/meetup-paris.avif", alt: "Effect Paris Meetup" },
	{
		src: "/assets/images/milan-1_compressed.webp",
		alt: "Effect Milan Meetup",
	},
	{ src: "/assets/images/nyc-1_compressed.webp", alt: "Effect NYC Meetup" },
	{
		src: "/assets/images/paris-1_compressed.webp",
		alt: "Effect Paris Meetup",
	},
	{ src: "/assets/images/meetup-sf.avif", alt: "Effect SF Meetup" },
	{
		src: "/assets/images/hamburg-1_compressed.webp",
		alt: "Effect Hamburg Meetup",
	},
	{
		src: "/assets/images/amsterdam-award-sandro.avif",
		alt: "Effect Amsterdam award ceremony",
	},
	{
		src: "/assets/images/milan-giulio_compressed.webp",
		alt: "Giulio at Effect Milan Meetup",
	},
	{ src: "/assets/images/nyc-2_compressed.webp", alt: "Effect NYC Meetup" },
	{
		src: "/assets/images/paris-2_compressed.webp",
		alt: "Effect Paris Meetup",
	},
	{ src: "/assets/images/meetup-sf-2.avif", alt: "Effect SF Meetup" },
];

function HeroPhotoStrip() {
	const scrollRef = useRef<HTMLDivElement>(null);
	const rafRef = useRef<number | null>(null);
	const isPausedRef = useRef(false);
	const isDraggingRef = useRef(false);
	const dragStartXRef = useRef(0);
	const dragScrollLeftRef = useRef(0);

	// 11 photos, each 256px + 16px gap on desktop
	const cardWidth = 256;
	const gap = 16;
	const singleSetWidth = heroPhotos.length * (cardWidth + gap);

	// Seamless reset: silently jump scroll position when crossing boundaries
	const normalizeScroll = useCallback(() => {
		const el = scrollRef.current;
		if (!el) return;
		// We have 3 copies. Keep scroll within the middle copy.
		if (el.scrollLeft >= singleSetWidth * 2) {
			el.scrollLeft -= singleSetWidth;
		} else if (el.scrollLeft <= 0) {
			el.scrollLeft += singleSetWidth;
		}
	}, [singleSetWidth]);

	// Auto-scroll via requestAnimationFrame for buttery smoothness
	const tick = useCallback(() => {
		if (!isPausedRef.current && scrollRef.current) {
			scrollRef.current.scrollLeft += 0.5;
			normalizeScroll();
		}
		rafRef.current = requestAnimationFrame(tick);
	}, [normalizeScroll]);

	// Start animation loop once on mount
	useEffect(() => {
		// Initialize scroll to the middle copy
		if (scrollRef.current) {
			scrollRef.current.scrollLeft = singleSetWidth;
		}
		rafRef.current = requestAnimationFrame(tick);
		return () => {
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
		};
	}, [tick, singleSetWidth]);

	// Normalize after any user scroll (drag or touch)
	const handleScroll = () => normalizeScroll();

	// Pause on hover
	const handleMouseEnter = () => {
		isPausedRef.current = true;
	};
	const handleMouseLeave = () => {
		isPausedRef.current = false;
		isDraggingRef.current = false;
	};

	// Mouse drag
	const handleMouseDown = (e: React.MouseEvent) => {
		if (!scrollRef.current) return;
		isDraggingRef.current = true;
		isPausedRef.current = true;
		dragStartXRef.current = e.pageX;
		dragScrollLeftRef.current = scrollRef.current.scrollLeft;
	};

	const handleMouseMove = (e: React.MouseEvent) => {
		if (!isDraggingRef.current || !scrollRef.current) return;
		e.preventDefault();
		const walk = (e.pageX - dragStartXRef.current) * 1.5;
		scrollRef.current.scrollLeft = dragScrollLeftRef.current - walk;
	};

	const handleMouseUp = () => {
		isDraggingRef.current = false;
	};

	// Touch: pause auto-scroll while touching
	const handleTouchStart = () => {
		isPausedRef.current = true;
	};
	const handleTouchEnd = () => {
		isPausedRef.current = false;
	};

	return (
		<div className="relative z-[70] overflow-hidden pb-16 md:pb-24">
			<div
				ref={scrollRef}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onScroll={handleScroll}
				onTouchStart={handleTouchStart}
				onTouchEnd={handleTouchEnd}
				className="scrollbar-hide flex cursor-grab gap-3 overflow-x-auto select-none active:cursor-grabbing md:gap-4"
				style={{
					scrollbarWidth: "none",
					msOverflowStyle: "none",
					WebkitOverflowScrolling: "touch",
				}}
			>
				{[...heroPhotos, ...heroPhotos, ...heroPhotos].map((photo, i) => (
					<div
						key={`photo-${i}`}
						className="h-36 w-52 shrink-0 md:h-48 md:w-64"
					>
						<PhotoCard src={photo.src} alt={photo.alt} />
					</div>
				))}
			</div>

			{/* Left fade */}
			<div
				className="pointer-events-none absolute top-0 bottom-0 left-0 w-24 md:w-40"
				style={{
					background: "linear-gradient(to right, rgb(9 9 11), transparent)",
				}}
			/>
			{/* Right fade */}
			<div
				className="pointer-events-none absolute top-0 right-0 bottom-0 w-24 md:w-40"
				style={{
					background: "linear-gradient(to left, rgb(9 9 11), transparent)",
				}}
			/>
		</div>
	);
}

function TypeBadge({ type }: { type: string }) {
	const styles: Record<string, string> = {
		conference: "bg-violet-500/10 text-violet-400 border-violet-500/20",
		meetup: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
		online: "bg-blue-500/10 text-blue-400 border-blue-500/20",
		podcast: "bg-amber-500/10 text-amber-400 border-amber-500/20",
		webinar: "bg-blue-500/10 text-blue-400 border-blue-500/20",
	};
	return (
		<span
			className={`rounded-full border px-2 py-0.5 text-xs ${styles[type] || styles.meetup}`}
		>
			{type.charAt(0).toUpperCase() + type.slice(1)}
		</span>
	);
}

function EventsTabSection() {
	const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

	return (
		<section id="events" className="pb-24 md:pb-24">
			<div className="mx-auto w-full max-w-[73.75rem] px-4">
				{/* Tabs */}
				<div className="mb-8 flex justify-center">
					<div className="inline-flex gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-1">
						<button
							type="button"
							onClick={() => setActiveTab("upcoming")}
							className={`relative w-28 cursor-pointer rounded-md py-2 text-center font-mono text-sm tracking-wider uppercase transition-all duration-200 ${
								activeTab === "upcoming"
									? "bg-zinc-800 font-bold text-white shadow-sm shadow-black/20"
									: "text-zinc-400 hover:text-zinc-300"
							}`}
						>
							Upcoming
						</button>
						<button
							type="button"
							onClick={() => setActiveTab("past")}
							className={`relative w-28 cursor-pointer rounded-md py-2 text-center font-mono text-sm tracking-wider uppercase transition-all duration-200 ${
								activeTab === "past"
									? "bg-zinc-800 font-bold text-white shadow-sm shadow-black/20"
									: "text-zinc-400 hover:text-zinc-300"
							}`}
						>
							Past
						</button>
					</div>
				</div>

				{/* Tab Content */}
				{activeTab === "upcoming" && (
					<div className="space-y-4">
						{upcomingEvents.length === 0 ? (
							<div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-16 text-center">
								<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800/60">
									<i className="ri-calendar-check-line text-xl text-zinc-500" />
								</div>
								<p className="mb-1 text-base font-medium text-zinc-300">
									No upcoming events right now
								</p>
								<p className="mb-6 max-w-sm text-sm text-zinc-500">
									Join the Discord to be the first to know when new events are
									announced.
								</p>
								<a
									href="https://discord.gg/effect-ts"
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-800/80 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-800 hover:text-white"
								>
									<i className="ri-discord-fill text-base" />
									Join Discord
								</a>
							</div>
						) : (
							upcomingEvents.map((event) => (
								<a
									key={event.title}
									href={event.href}
									target="_blank"
									rel="noopener noreferrer"
									className={`group flex flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50 transition-all hover:border-zinc-700 hover:bg-zinc-900 md:flex-row md:gap-8`}
								>
									{event.thumbnail && (
										<div className="relative aspect-video w-full overflow-hidden md:aspect-auto md:w-1/2">
											{event.centerThumbnail ? (
												<img
													src={event.centerThumbnail}
													alt={event.title}
													className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
												/>
											) : (
												<img
													src={
														event.thumbnail.startsWith("http")
															? event.thumbnail
															: event.thumbnail
													}
													alt={event.title}
													className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
												/>
											)}
										</div>
									)}
									{!event.thumbnail && (
										<div className="flex w-full items-center justify-center bg-zinc-800/50 py-10 md:w-1/2 md:py-0">
											<i className="ri-live-line text-4xl text-zinc-600" />
										</div>
									)}
									<div className="flex flex-1 flex-col justify-center p-5">
										<div className="mb-1.5 flex items-center gap-2">
											<span className="font-mono text-sm tracking-wider text-zinc-400 uppercase">
												{event.date}
											</span>
										</div>
										<h3 className="mt-0.5 mb-2 text-xl font-semibold text-white group-hover:text-zinc-100">
											{event.title}
										</h3>
										<p className="max-w-[28rem] text-base text-zinc-400">
											{event.description}
										</p>
									</div>
								</a>
							))
						)}
					</div>
				)}

				{activeTab === "past" && (
					<div className="space-y-6">
						{sortedPastEvents.map((yearGroup) => (
							<div
								key={yearGroup.year}
								className="rounded-lg border border-zinc-800 bg-zinc-900/50"
							>
								<div className="sticky top-0 z-10 rounded-t-lg border-b border-zinc-800 bg-zinc-900 px-5 py-3">
									<span className="font-mono text-sm font-medium tracking-wider text-zinc-200 uppercase">
										{yearGroup.year}
									</span>
								</div>
								<div className="divide-y divide-zinc-800/50">
									{yearGroup.events.map((event, i) => {
										const content = (
											<>
												<span className="text-lg">
													{event.flag === "🌐" &&
													event.href &&
													(event.href.includes("youtube.com") ||
														event.href.includes("youtu.be")) ? (
														<i className="ri-youtube-fill text-red-500" />
													) : (
														event.flag
													)}
												</span>
												<span className="w-24 shrink-0 font-mono text-sm tracking-wider text-zinc-400 uppercase">
													{event.date}
												</span>
												<span className="flex-1 text-base text-white transition-colors group-hover:text-white">
													{event.title}
												</span>
												<TypeBadge type={event.type} />
												<span className="ml-auto w-5 shrink-0 text-center">
													{event.href && (
														<i className="ri-arrow-right-up-line text-lg text-zinc-600 transition-colors group-hover:text-zinc-300" />
													)}
												</span>
											</>
										);

										return event.href ? (
											<a
												key={`${event.title}-${i}`}
												href={event.href}
												target="_blank"
												rel="noopener noreferrer"
												className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-zinc-800/30"
											>
												{content}
											</a>
										) : (
											<div
												key={`${event.title}-${i}`}
												className="group flex items-center gap-4 px-5 py-3.5"
											>
												{content}
											</div>
										);
									})}
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</section>
	);
}

export function EventsPage() {
	return (
		<div className="relative min-h-screen bg-zinc-950 text-white antialiased">
			{/* Dithered background overlay - subtle texture across entire page */}
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

      <Navigation activePath="/events" />
			<GridOverlay />

			{/* Vertical border lines container */}
			<div className="pointer-events-none absolute top-0 right-0 bottom-0 left-0 z-[60] hidden lg:block">
				<div className="relative mx-auto h-full w-full max-w-[73.75rem]">
					{/* Left vertical line */}
					<div className="absolute top-0 bottom-0 left-0 w-px bg-zinc-800" />
					{/* Right vertical line */}
					<div className="absolute top-0 right-0 bottom-0 w-px bg-zinc-800" />
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

			{/* Main Content */}
			<main id="main-content" className="relative w-full">
				{/* Hero Section */}
				<section className="relative pt-32 pb-8 md:pt-40 md:pb-12">
					<div className="mx-auto w-full max-w-[73.75rem] px-4 text-center">
						<p className="mb-3 font-mono text-sm font-medium tracking-wider text-zinc-400 uppercase">
							// Effect Events
						</p>
						<h1 className="mx-auto max-w-2xl text-4xl font-bold text-white md:text-5xl">
							Effect is everywhere
						</h1>
						<p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
							From local meetups to international conferences, the Effect
							community keeps growing — and we'd love to see you there.
						</p>
					</div>
				</section>

				{/* Hero photo strip */}
				<HeroPhotoStrip />

				{/* Events Tabbed Section */}
				<EventsTabSection />

				{/* Divider */}
				<div className="mx-auto w-full max-w-[73.75rem] px-4">
					<div className="h-px w-full bg-zinc-800" />
				</div>

				{/* Effect Days Section */}
				<section className="py-24 md:pt-40 md:pb-24">
					<div className="mx-auto w-full max-w-[73.75rem] px-4">
						<div className="mb-12">
							<p className="mb-2 font-mono text-sm font-medium tracking-wider text-zinc-400 uppercase">
								// Effect Days
							</p>
							<h2 className="leading-tighter mb-3 max-w-2xl text-2xl font-semibold text-white md:text-3xl">
								A conference for TypeScript and Effect engineers worldwide
							</h2>
							<p className="max-w-2xl text-lg text-zinc-400">
								Two editions, 34 talks, real production stories, and a community
								that shows up from around the world. Catch up on everything you
								missed.
							</p>
						</div>

						{/* Past Editions */}
						<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
							{/* Effect Days 2024 */}
							<a
								href="https://www.youtube.com/playlist?list=PLDf3uQLaK2B9a4tbMgGd9wFeEnMA50z4w"
								target="_blank"
								rel="noopener noreferrer"
								className="group flex flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50 transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900"
							>
								<div className="relative aspect-video overflow-hidden">
									<img
										src={"/assets/images/ed-24-2.png"}
										alt="Effect Days 2024 — Vienna"
										className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
									/>
									{/* Base gradient overlay */}
									<div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-zinc-950/5" />
									{/* Permanent violet tint */}
									<div className="absolute inset-0 bg-violet-500/10 transition-colors duration-300 group-hover:bg-violet-500/15" />
									<div className="absolute right-4 bottom-3 left-4 flex items-center justify-between">
										<span className="font-mono text-xs font-medium tracking-wider text-white/80 uppercase">
											Inaugural Edition
										</span>
										<span className="flex items-center gap-1.5 text-xs text-white/60 transition-colors duration-300 group-hover:text-white/90">
											<i className="ri-youtube-fill text-sm" />
											Watch playlist
										</span>
									</div>
								</div>
								<div className="flex flex-1 flex-col p-5">
									<h3 className="text-lg font-semibold text-white">
										Effect Days 2024
									</h3>
									<div className="mt-1.5 flex items-center gap-3 text-sm text-zinc-400">
										<span className="flex items-center gap-1">
											<i className="ri-map-pin-line" />
											Vienna, Austria 🇦🇹
										</span>
										<span>·</span>
										<span>Feb 22–24</span>
									</div>
									<p className="mt-3 text-sm text-zinc-400">
										Where the Effect community gathered for the first time. 15
										talks and 2 workshops, from early experiments to production
										systems.
									</p>
								</div>
							</a>

							{/* Effect Days 2025 */}
							<a
								href="https://www.youtube.com/playlist?list=PLDf3uQLaK2B9bEBZbwMv04e_zSbRNPKH6"
								target="_blank"
								rel="noopener noreferrer"
								className="group flex flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50 transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900"
							>
								<div className="relative aspect-video overflow-hidden">
									<img
										src={"/assets/images/ed-25-2.png"}
										alt="Effect Days 2025 — Livorno"
										className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
									/>
									{/* Base gradient overlay */}
									<div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-zinc-950/5" />
									{/* Permanent violet tint */}
									<div className="absolute inset-0 bg-violet-500/10 transition-colors duration-300 group-hover:bg-violet-500/15" />
									<div className="absolute right-4 bottom-3 left-4 flex items-center justify-between">
										<span className="font-mono text-xs font-medium tracking-wider text-white/80 uppercase">
											2nd Edition
										</span>
										<span className="flex items-center gap-1.5 text-xs text-white/60 transition-colors duration-300 group-hover:text-white/90">
											<i className="ri-youtube-fill text-sm" />
											Watch playlist
										</span>
									</div>
								</div>
								<div className="flex flex-1 flex-col p-5">
									<h3 className="text-lg font-semibold text-white">
										Effect Days 2025
									</h3>
									<div className="mt-1.5 flex items-center gap-3 text-sm text-zinc-400">
										<span className="flex items-center gap-1">
											<i className="ri-map-pin-line" />
											Livorno, Italy 🇮🇹
										</span>
										<span>·</span>
										<span>Mar 19–21</span>
									</div>
									<p className="mt-3 text-sm text-zinc-400">
										Advanced use cases and real production stories. 19 talks and
										2 workshops showing the evolution of Effect in the real
										world.
									</p>
								</div>
							</a>
						</div>
					</div>
				</section>

				{/* Divider */}
				<div className="mx-auto w-full max-w-[73.75rem] px-4">
					<div className="h-px w-full bg-zinc-800" />
				</div>
				<section id="host" className="py-24 md:pt-40 md:pb-24">
					<div className="mx-auto w-full max-w-[73.75rem] px-4">
						<div className="mb-20">
							<p className="mb-2 font-mono text-sm font-medium tracking-wider text-zinc-400 uppercase">
								// Host a Meetup
							</p>
							<h2 className="leading-tighter mb-3 text-2xl font-semibold text-white md:text-3xl">
								Bring Effect to your city
							</h2>
							<p className="max-w-2xl text-lg text-zinc-400">
								If you're willing to organize, we'll make sure you're not doing
								it alone. Reach out anytime on Discord or through our contact
								form.
							</p>
							<div className="mt-6 flex flex-wrap gap-3">
								<Button
									href="https://discord.gg/effect-ts"
									variant="primary"
									size="lg"
									className="inline-flex items-center gap-2"
								>
									<i className="ri-discord-fill" />
									Join #events-hub
								</Button>
								<Button
									href="#"
									variant="secondary"
									size="lg"
									className="inline-flex items-center gap-2"
								>
									<i className="ri-file-list-3-line" />
									Fill out the form
								</Button>
							</div>
						</div>

						<div className="grid grid-cols-1 gap-x-12 gap-y-8 sm:grid-cols-2">
							{hostPerks.map((perk) => (
								<div key={perk.title} className="flex gap-4">
									<div
										className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
										style={{
											background:
												"linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)",
										}}
									>
										<i
											className={`${perk.icon} text-lg`}
											style={{
												background: "linear-gradient(135deg, #34d399, #8b5cf6)",
												WebkitBackgroundClip: "text",
												WebkitTextFillColor: "transparent",
											}}
										/>
									</div>
									<div>
										<h3 className="text-base font-semibold text-white">
											{perk.title}
										</h3>
										<p className="mt-1 text-base text-zinc-400">
											{perk.description}
										</p>
										{perk.href && (
											<Link
												href={perk.href}
												variant="subtle"
												className="group/link mt-2 inline-flex items-center gap-1.5 text-sm font-medium"
											>
												<span className="underline decoration-zinc-600 underline-offset-4 transition-colors group-hover/link:decoration-white">
													{perk.linkLabel}
												</span>
												<i className="ri-arrow-right-up-line text-xs" />
											</Link>
										)}
									</div>
								</div>
							))}
						</div>
					</div>
				</section>
				<div className="mx-auto w-full max-w-[73.75rem] px-4">
					<div className="h-px w-full bg-zinc-800" />
				</div>
				<section className="py-24 md:pb-24">
					<div className="mx-auto w-full max-w-[73.75rem] px-4">
						<div className="relative overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50 px-8 py-12 md:px-14 md:py-16">
							{/* Background gradient */}
							<div
								className="pointer-events-none absolute inset-0 opacity-60"
								style={{
									background:
										"radial-gradient(ellipse 70% 60% at 50% 0%, rgba(16, 185, 129, 0.15) 0%, transparent 60%)",
								}}
							/>

							<div className="relative text-center">
								<p className="mb-4 font-mono text-sm font-medium tracking-wider text-zinc-400 uppercase">
									// Effect Community
								</p>
								<h2 className="leading-tighter mb-2.5 text-2xl font-semibold text-white md:text-3xl">
									Can't find an event near you?
								</h2>
								<p className="mx-auto mb-6 max-w-xl text-base text-zinc-400">
									Join 6,000+ developers on Discord building production systems with Effect.
								</p>

								<Button
									href="https://discord.gg/effect-ts"
									variant="primary"
									size="lg"
									className="inline-flex items-center gap-2"
								>
									<i className="ri-discord-fill" />
									Join Discord
								</Button>
							</div>
						</div>
					</div>
				</section>
			</main>

      <Footer activePath="/events" hideCommunityBorder />
		</div>
	);
}
