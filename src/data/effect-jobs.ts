export type Job = {
	company: string
	role: string
	location?: string
	type?: string
	url: string
	note?: string
}

export type LogoCompany = {
	name: string
	logo: string
	url?: string
	/** Optional height in tailwind units (h-5 = 20px). Defaults to 6. */
	h?: number
}

export const SUBMIT_URLS = {
	postJob: "https://github.com/mirelaprifti/effect-jobs/issues/new?template=post-a-job.yaml",
	addDeveloper:
		"https://github.com/mirelaprifti/effect-jobs/issues/new?template=add-yourself.yaml",
	discord: "https://discord.gg/effect-ts",
	repo: "https://github.com/mirelaprifti/effect-jobs",
}

export const JOBS: Job[] = [
	{
		company: "acemate.ai",
		role: "Senior Backend Engineer / Developer",
		url: "https://join.com/companies/acemate/15714084-senior-backend-engineer-developer",
	},
	{
		company: "Cari",
		role: "Sr. Software Engineer, Backend & Infra",
		url: "https://cari.com/careers/sr.-software-engineer-backend-infra",
	},
	{
		company: "Expand.ai",
		role: "Founding Engineer",
		url: "https://expand.ai/careers/founding-engineer",
	},
	{
		company: "Freckle.io",
		role: "Full-stack Engineers",
		url: "https://discord.gg/effect-ts",
		note: "Posted on Discord #job-board",
	},
	{
		company: "Gale",
		role: "SWE Intern",
		location: "Remote · CAN/US",
		type: "Internship",
		url: "https://forms.galevisa.com/r/m6gr7e",
	},
	{
		company: "Goblins",
		role: "Product Founding Engineer",
		url: "https://discord.gg/effect-ts",
		note: "Posted on Discord #job-board",
	},
	{
		company: "Heartbeat",
		role: "Senior Software Engineer",
		url: "https://jobs.heartbeat.chat/35182",
	},
	{
		company: "HumanLayer",
		role: "Founding Product Engineer",
		url: "https://workatastartup.com/jobs/84491",
	},
	{
		company: "Joymore",
		role: "Backend and Full Stack Engineers",
		url: "https://discord.gg/effect-ts",
		note: "Posted on Discord #job-board",
	},
	{
		company: "Lingo.dev",
		role: "Senior Product Engineer — React, Node.js, UX",
		url: "https://dover.com/apply/Lingo.dev/411b24e0-1438-4d24-8f19-d2cb91ca2483/?rs=76643084",
	},
	{
		company: "MasterClass",
		role: "Staff Software Engineer",
		url: "https://job-boards.greenhouse.io/masterclass/jobs/7642238",
	},
	{
		company: "Medbill.ai",
		role: "Founding Software Engineers — full-stack and backend",
		url: "https://www.linkedin.com/posts/codingtom_medbill-ai-activity-7260092522708762624-N7TH",
	},
	{
		company: "PhosPhor",
		role: "Engineers with Effect experience",
		url: "https://phosphor.co/",
	},
	{
		company: "Reap",
		role: "Backend / Cloud Engineer",
		location: "Remote-friendly · HK",
		url: "https://discord.gg/effect-ts",
		note: "Posted on Discord #job-board",
	},
	{
		company: "Sellhub",
		role: "Backend Engineer",
		url: "https://discord.gg/effect-ts",
		note: "Posted on Discord #job-board",
	},
	{
		company: "SIWorks",
		role: "Senior Full-Stack Engineer",
		type: "Part-time",
		url: "https://discord.gg/effect-ts",
		note: "Posted on Discord #job-board",
	},
	{
		company: "Software Intelligence Works",
		role: "Senior Full-Stack Engineer",
		url: "https://remotive.com/remote-jobs/software-dev/senior-full-stack-engineer-2011648",
	},
	{
		company: "Solid",
		role: "Early engineering team",
		location: "Bay Area",
		url: "https://discord.gg/effect-ts",
		note: "Posted on Discord #job-board",
	},
	{
		company: "Supermemory",
		role: "Founding Backend / Infrastructure Engineer",
		url: "https://x.com/i/jobs/1928194391946186862",
	},
	{
		company: "Superwall",
		role: "Full-stack Mobile Developer",
		url: "https://x.com/jakemor/status/1972770955500876070",
	},
	{
		company: "Temper",
		role: "Founding Engineer",
		url: "https://news.ycombinator.com/item?id=47224903",
	},
	{
		company: "Tranched",
		role: "Full-stack Engineer — Web3",
		url: "https://tranched.fi/careers/fullstack-developer-web3",
	},
	{
		company: "Trellis AI",
		role: "Product Engineer",
		location: "San Francisco",
		url: "https://www.ycombinator.com/companies/trellis-ai",
	},
	{
		company: "Vitalize Care",
		role: "Full-Stack Engineer",
		url: "https://jobs.ashbyhq.com/vitalize/d907ba5f-0f2f-4bb4-931a-1680d6daf81a",
	},
	{
		company: "Wander",
		role: "Software Developers",
		url: "https://ship.wander.com/",
	},
	{
		company: "Consumer Music Startup",
		role: "Effect Backend Consultant + Full-time Engineer",
		location: "New York City",
		url: "https://discord.gg/effect-ts",
		note: "Posted on Discord #job-board",
	},
	{
		company: "French-Speaking Team",
		role: "Senior TypeScript Developer",
		type: "Freelance",
		url: "https://www.linkedin.com/posts/stephaneledorze_recherche-senior-typescript-developer-activity-7384894173604265984-btNb",
	},
]

/**
 * Companies that have posted Effect jobs — current openings and past hires.
 * Drop logos into `public/assets/quotes-logos/` and add an entry here.
 */
export const LOGO_COMPANIES: LogoCompany[] = [
	{
		name: "MasterClass",
		logo: "/assets/quotes-logos/masterclass-noM.svg",
		url: "https://www.masterclass.com",
		h: 6,
	},
	{
		name: "Vercel",
		logo: "/assets/quotes-logos/vercel-logotype-dark.svg",
		url: "https://vercel.com",
		h: 5,
	},
	{
		name: "Spiko",
		logo: "/assets/quotes-logos/spiko-logo.svg",
		url: "https://spiko.io",
		h: 5,
	},
]
