export interface Partner {
	id: string;
	name: string;
	description: string;
	longDescription: string;
	websiteUrl: string;
	logoPath: string;
	featured: boolean;
	language: string;
	languageFlag: string;
	region: string;
}

export const PARTNERS: Partner[] = [
	{
		id: "ziverge",
		name: "Ziverge",
		description:
			"Technology services firm specializing in distributed systems, AI/ML, and cloud-native solutions.",
		longDescription:
			"Ziverge provides engineering expertise across distributed systems, AI/ML pipelines, and cloud-native architecture. They work with enterprise clients to build scalable, production-grade software using functional programming and Effect.",
		websiteUrl: "https://www.ziverge.com/",
		logoPath: "/assets/partner-logos/ziverge.svg",
		featured: true,
		language: "English",
		languageFlag: "\u{1F1EC}\u{1F1E7}",
		region: "Global",
	},
	{
		id: "evryg",
		name: "evryg",
		description:
			"Consulting firm specializing in digital transformation, bridging business and technology.",
		longDescription:
			"evryg bridges the gap between business and technology, from organizational strategy to implementation. With 60% of their consultants having over 10 years of experience, they specialize in digital transformation projects powered by Effect.",
		websiteUrl: "https://www.evryg.com/en",
		logoPath: "/assets/partner-logos/evryg.svg",
		featured: false,
		language: "French",
		languageFlag: "\u{1F1EB}\u{1F1F7}",
		region: "France",
	},
	{
		id: "doubleloop",
		name: "Double Loop",
		description:
			"Software consultancy specializing in functional programming and Effect for building reliable systems.",
		longDescription:
			"Double Loop helps teams adopt Effect and functional programming to build robust, maintainable software. Based in Italy, they bring deep expertise in TypeScript and Effect to deliver production-grade solutions.",
		websiteUrl: "https://doubleloop.io/",
		logoPath: "/assets/partner-logos/doubleloop.svg",
		featured: false,
		language: "Italian",
		languageFlag: "\u{1F1EE}\u{1F1F9}",
		region: "Italy",
	},
];
