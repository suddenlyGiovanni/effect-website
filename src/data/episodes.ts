export interface Chapter {
	time: string;
	title: string;
}

export interface Episode {
	number: number;
	title: string;
	slug: string;
	guest: string;
	company: string;
	companyUrl: string;
	companyLogo?: string;
	description: string;
	fullDescription: string;
	chapters: Chapter[];
	date: string;
	duration: string;
	youtubeId: string;
	thumbnailUrl: string;
	topics: string[];
	transcript?: string;
}

export const EPISODES: Episode[] = [
	{
		number: 7,
		title: "Reliable Payroll Systems in TypeScript with Effect",
		slug: "reliable-payroll-systems-warp",
		guest: "Adam Rankin",
		company: "Warp",
		companyUrl: "https://www.joinwarp.com/",
		companyLogo: "/assets/images/warp-logo-white.svg",
		description:
			"In this episode, Johannes Schickling talks with Adam Rankin, CTO at Warp, about using Effect to bring structure and composability to a growing TypeScript codebase, enabling a small, fast-moving team to stay productive while shipping reliable payment & payroll systems.",
		fullDescription: `In this episode, Johannes Schickling talks with Adam Rankin, CTO at Warp (https://www.joinwarp.com/), about using Effect to bring structure and composability to a growing TypeScript codebase, enabling a small, fast-moving team to stay productive while shipping reliable payment & payroll systems.

Jobs at Warp: https://www.joinwarp.com/careers/roles

Learn more about and follow Adam:
https://x.com/rankintweets
https://github.com/rankincodes`,
		chapters: [
			{ time: "00:00", title: "Introduction" },
			{
				time: "01:45",
				title: "Adam's professional background and early startup experience",
			},
			{ time: "08:18", title: "Warp's founding story and mission" },
			{ time: "17:36", title: "What drew Warp to Effect as a solution" },
			{
				time: "29:24",
				title: "Initial Steps with Effect (AI browser automation project)",
			},
			{ time: "34:52", title: "Onboarding team members to Effect" },
			{ time: "42:17", title: "How composability benefits payment systems" },
			{ time: "43:53", title: "Overview of Warp's system architecture" },
			{ time: "56:48", title: "Closing reflections and future outlook" },
		],
		date: "Dec 16, 2025",
		duration: "59:54",
		youtubeId: "zxCR6rG4snY",
		thumbnailUrl: "https://img.youtube.com/vi/zxCR6rG4snY/maxresdefault.jpg",
		topics: [
			"Ruby on Rails to TypeScript transition",
			"Incremental Effect adoption",
			"Schemas and dependency injection",
			"Monolith architecture",
			"Background job processing with BullMQ",
			"AI-native automation",
			"Payment system composability",
		],
	},
	{
		number: 6,
		title: "Inside OpenRouter's Tech Stack and Use of Effect",
		slug: "scaling-ai-openrouter",
		guest: "Louis Vichy",
		company: "OpenRouter",
		companyUrl: "https://openrouter.ai/",
		companyLogo: "/assets/images/open-router.svg",
		description:
			"Louis Vichy, co-founder of OpenRouter, joins Johannes Schickling and Michael Arnaldi to talk about OpenRouter's TypeScript stack, internal tooling powered by Effect, and the engineering challenges of scaling an AI platform processing trillions of tokens weekly.",
		fullDescription: `Louis Vichy, co-founder of OpenRouter (https://openrouter.ai/), joins Johannes Schickling and Michael Arnaldi to talk about OpenRouter's TypeScript stack, their internal tooling powered by Effect, and the engineering challenges of scaling an AI platform processing trillions of tokens weekly.`,
		chapters: [
			{ time: "00:00", title: "Guest Intro & OpenRouter" },
			{ time: "07:45", title: "Why Everything Runs in TypeScript" },
			{ time: "15:43", title: "Scaling & Routing Infrastructure" },
			{ time: "18:03", title: "Michael's Story: Effect Origins" },
			{ time: "23:11", title: "Effect vs. Result Types" },
			{ time: "26:04", title: "Culture, Hiring & Engineering Consistency" },
			{ time: "30:48", title: "Gradual Effect Adoption" },
			{ time: "32:30", title: "Generators, Pipe & Functional Design" },
			{ time: "47:41", title: "Observability & Concurrency" },
			{ time: "58:35", title: "Agentic Systems & Orchestration" },
			{ time: "01:16:41", title: "Effect in OpenRouter's Internal Tooling" },
		],
		date: "Nov 11, 2025",
		duration: "86:11",
		youtubeId: "AVJIqQi11lM",
		thumbnailUrl: "https://img.youtube.com/vi/AVJIqQi11lM/maxresdefault.jpg",
		topics: [
			"AI model routing platform",
			"TypeScript-only codebase",
			"Cloudflare Workers",
			"Hono framework",
			"Effect for internal tooling",
			"Result monad paradigm",
			"Scaling to trillions of tokens",
		],
	},
	{
		number: 5,
		title: "Event-Driven Systems in FinTech. How Spiko Leverages Effect",
		slug: "event-driven-systems-spiko",
		guest: "Samuel Briole",
		company: "Spiko",
		companyUrl: "https://www.spiko.io/",
		companyLogo: "/assets/images/spiko-logo.svg",
		description:
			"This podcast episode features Samuel Briole, CTO of Spiko, a Paris-based FinTech startup building infrastructure for issuing regulated financial products on public blockchains, specifically risk-free products. Spiko utilizes the Effect extensively from backend to frontend.",
		fullDescription: `This Cause & Effect podcast episode features Samuel Briole, CTO of Spiko (https://www.spiko.io/), a Paris-based FinTech startup building infrastructure for issuing regulated financial products on public blockchains, specifically risk-free products.

Spiko utilizes Effect extensively, from day one, for both backend and frontend development, particularly for managing asynchronous operations, API integrations, and smart contracts.

Learn more about & follow Samuel:
LinkedIn: https://www.linkedin.com/in/samuel-briole/
GitHub: https://github.com/wewelll

effect-messaging: https://github.com/spiko-tech/effect-messaging`,
		chapters: [
			{
				time: "00:00",
				title: "Introduction and rationale behind Spiko's selection of Effect",
			},
			{
				time: "07:22",
				title: "Onboarding engineers without prior Effect knowledge",
			},
			{ time: "10:06", title: "Spiko's architectural design and applications" },
			{ time: "15:12", title: "Event-driven system architecture" },
			{
				time: "22:45",
				title:
					"Rationale for choosing RabbitMQ over alternative message brokers",
			},
			{
				time: "28:26",
				title: "Development and motivation behind the effect-messaging library",
			},
			{
				time: "39:53",
				title: "Effect Schema, versioning, and asynchronous messaging patterns",
			},
			{ time: "46:44", title: "AI agents and Effect AI capabilities" },
			{ time: "53:21", title: "Future outlook and closing remarks" },
		],
		date: "Sep 15, 2025",
		duration: "58:03",
		youtubeId: "lFOHVZnJLew",
		thumbnailUrl: "https://img.youtube.com/vi/lFOHVZnJLew/maxresdefault.jpg",
		topics: [
			"FinTech and blockchain",
			"Event-driven architecture",
			"RabbitMQ messaging",
			"effect-messaging library",
			"Effect Schema",
			"Macroservices architecture",
			"Team onboarding",
		],
	},
	{
		number: 4,
		title: "From Skeptic to Advocate, Scaling Effect at Vercel",
		slug: "scaling-effect-vercel",
		guest: "Dillon Mulroy",
		company: "Vercel",
		companyUrl: "https://vercel.com/",
		companyLogo: "/assets/images/vercel-logotype-dark.svg",
		description:
			"In this episode of Cause & Effect, Johannes Schickling is joined by Dillon Mulroy, Domains Lead at Vercel, who shares his personal journey with Effect and how Vercel gradually adopted it across their Domains platform. Dillon explains why Effect feels like a natural evolution of TypeScript.",
		fullDescription: `In this episode of Cause & Effect, Johannes Schickling is joined by Dillon Mulroy, Domains Lead at Vercel, who shares his personal journey with Effect and how Vercel gradually adopted it across their Domains platform. Dillon explains why Effect feels like having superpowers for error handling, observability, testing, and more.

Whether you're skeptical or already experimenting with Effect, this conversation offers clarity, nuance, and inspiration.`,
		chapters: [
			{ time: "00:00", title: "Intro" },
			{ time: "03:00", title: "How Vercel Adopted Effect" },
			{ time: "10:57", title: "Dillon's background" },
			{ time: "16:27", title: "Effect DX" },
			{ time: "22:13", title: "Lessons from other stacks" },
			{ time: "25:18", title: "From Skeptic to Advocate" },
			{ time: "31:13", title: "Effect's Incremental Adoption" },
			{ time: "42:31", title: "Effect ≠ RxJS, Effect vs Ramda" },
			{ time: "48:24", title: "Effect's superpowers at Vercel" },
			{ time: "52:31", title: "Wrap-Up & What's Next" },
		],
		date: "Aug 4, 2025",
		duration: "53:53",
		youtubeId: "rPKohHGPqCY",
		thumbnailUrl: "https://img.youtube.com/vi/rPKohHGPqCY/maxresdefault.jpg",
		topics: [
			"Effect adoption journey",
			"Vercel Domains platform",
			"Skeptic to advocate",
			"Team adoption strategies",
			"Error handling patterns",
			"Dependency injection",
			"Large organization scaling",
		],
	},
	{
		number: 3,
		title: "Scaling Voice AI at MasterClass with Effect & TypeScript",
		slug: "scaling-voice-ai-masterclass",
		guest: "David Golightly",
		company: "MasterClass",
		companyUrl: "https://www.masterclass.com/",
		companyLogo: "/assets/images/masterclass-noM.svg",
		description:
			"In this episode Johannes Schickling had a conversation with David Golightly, Staff Engineer at MasterClass, to explore how his team built Cortex – a real-time voice AI orchestration layer that powers personalized conversations with celebrity instructors.",
		fullDescription: `In this episode of Cause & Effect, Johannes Schickling had a conversation with David Golightly, Staff Engineer at MasterClass (https://www.masterclass.com/), to explore how his team built Cortex – a real-time voice AI orchestration layer that powers personalized conversations with celebrity instructors like Gordon Ramsay and Mark Cuban.

Learn more about and follow David Golightly:
LinkedIn: https://www.linkedin.com/in/davigoli
Github: https://github.com/davidgoli`,
		chapters: [
			{ time: "00:00", title: "Intro & David's background" },
			{ time: "04:56", title: "Discovering Effect & early impressions" },
			{ time: "08:32", title: "Why RxJS wasn't sufficient for Cortex" },
			{ time: "16:15", title: "MasterClass On Call" },
			{ time: "19:10", title: "Building the orchestration layer" },
			{ time: "25:30", title: "Incremental adoption of Effect at MasterClass" },
			{ time: "31:43", title: "Text-to-speech component" },
			{ time: "40:08", title: "Error handling, observability, open-telemetry" },
			{ time: "01:01:20", title: "Looking ahead: Effect 4.0 & the future" },
			{ time: "01:08:00", title: "Closing thoughts" },
		],
		date: "Jun 24, 2025",
		duration: "69:26",
		youtubeId: "x2bUuOZ-htU",
		thumbnailUrl: "https://img.youtube.com/vi/x2bUuOZ-htU/maxresdefault.jpg",
		topics: [
			"Voice AI systems",
			"Real-time orchestration",
			"Streaming architectures",
			"Celebrity AI interactions",
			"Latency optimization",
			"Concurrent operations",
			"Error recovery strategies",
		],
	},
	{
		number: 2,
		title: "Scaling AI for Customer Support at Markprompt with Effect",
		slug: "scaling-ai-customer-support-markprompt",
		guest: "Michael Fester",
		company: "Markprompt",
		companyUrl: "https://14.ai/",
		companyLogo: "/assets/images/14-ai.svg",
		description:
			"Join us as we talk with Michael Fester from Markprompt about scaling AI-powered customer support with Effect, building reliable and high-performance infrastructure, and enhancing developer productivity in a fast-evolving AI landscape.",
		fullDescription: `Join us as we talk with Michael Fester from Markprompt (now 14.ai – https://14.ai/) about scaling AI-powered customer support with Effect, building reliable and high-performance infrastructure, and enhancing developer productivity in a fast-evolving AI landscape. Hosted by Johannes Schickling.`,
		chapters: [
			{ time: "00:00", title: "Welcome & guest introduction" },
			{
				time: "01:54",
				title:
					"Michael's background: from mathematics research to AI entrepreneurship",
			},
			{
				time: "03:49",
				title:
					"Markprompt overview and use cases for customer support automation",
			},
			{ time: "07:45", title: "System architecture breakdown" },
			{
				time: "10:22",
				title: "Challenges unique to AI-powered support systems",
			},
			{
				time: "13:20",
				title:
					"How Effect improves reliability through dependency injection and testing",
			},
			{ time: "16:41", title: "Technical architecture deep dive" },
			{
				time: "19:51",
				title: "Application server and RPC implementation details",
			},
			{
				time: "23:50",
				title: "Data ingestion engine and long-running workflows",
			},
			{ time: "26:29", title: "Onboarding engineers new to Effect" },
			{
				time: "30:51",
				title: "Migration strategy from existing codebase to Effect",
			},
			{
				time: "35:19",
				title: "Effect's schema system in production environments",
			},
			{ time: "39:02", title: "Migration challenges and key learnings" },
			{ time: "41:45", title: "Effect's role in engineering productivity" },
			{ time: "45:34", title: "Future of AI infrastructure" },
			{ time: "50:18", title: "Closing remarks and hiring information" },
		],
		date: "Mar 7, 2025",
		duration: "52:51",
		youtubeId: "8lz9-0y58Jc",
		thumbnailUrl: "https://img.youtube.com/vi/8lz9-0y58Jc/maxresdefault.jpg",
		topics: [
			"AI customer support",
			"LLM infrastructure",
			"Rate limit handling",
			"Service reliability",
			"Effect composability",
			"AI-first architecture",
			"Testing and observability",
		],
	},
	{
		number: 1,
		title: "Adopting Effect at Zendesk with Attila Večerek",
		slug: "adopting-effect-zendesk",
		guest: "Attila Večerek",
		company: "Zendesk",
		companyUrl: "https://www.zendesk.com/",
		companyLogo: "/assets/images/zendesk-logo.svg",
		description:
			"In this inaugural episode, Johannes Schickling speaks with Attila Večerek, Tech Lead and Staff Engineer at Zendesk, about their journey adopting Effect incrementally within a large-scale, diverse codebase environment.",
		fullDescription: `In this episode, Attila Večerek, Tech Lead & Staff Engineer, joins our host Johannes Schickling to discuss how Zendesk incrementally adopted Effect in a polyglot environment with a large codebase.

Learn more and follow Attila Večerek:
https://twitter.com/attilavecerek
https://www.linkedin.com/in/attilavecerek/`,
		chapters: [
			{ time: "00:00", title: "Intro" },
			{ time: "03:13", title: "Being an engineer at Zendesk" },
			{ time: "06:05", title: "Challenging the status quo" },
			{ time: "13:10", title: "Introducing TypeScript at Zendesk" },
			{ time: "20:22", title: "Adopting fp-ts" },
			{ time: "25:19", title: "The transition from fp-ts to Effect" },
			{ time: "31:00", title: "DX adopting Effect" },
			{ time: "37:15", title: "Implementing a Kafka consumer with Effect" },
			{ time: "42:18", title: "Dependency injection" },
			{ time: "48:33", title: "The power of TypeScript & Effect" },
			{ time: "53:03", title: "Onboarding developers to Effect at Zendesk" },
			{ time: "01:15:37", title: "Excitement for Effect Cluster" },
			{ time: "01:19:30", title: "Outro" },
		],
		date: "Nov 26, 2024",
		duration: "80:31",
		youtubeId: "rNAqPHBQFEQ",
		thumbnailUrl: "https://img.youtube.com/vi/rNAqPHBQFEQ/maxresdefault.jpg",
		topics: [
			"Large-scale adoption",
			"fp-ts to Effect migration",
			"Incremental adoption strategy",
			"Effect Schema",
			"Dependency injection",
			"Kafka consumers",
			"Team onboarding",
		],
	},
];

export function getEpisodeByNumber(number: number): Episode | undefined {
	return EPISODES.find((ep) => ep.number === number);
}

export function getEpisodeSlug(episode: Episode): string {
	return episode.slug;
}
