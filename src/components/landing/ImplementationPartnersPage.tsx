import { getAssetPath } from "../../utils/assetPath";
import { PARTNERS, type Partner } from "../../data/partners";
import { GridOverlay } from "../GridOverlay";
import { ContactForm } from "./ContactForm";
import { Footer } from "./Footer";
import { Navigation } from "./Navigation";

function FeaturedPartnerCard({ partner }: { partner: Partner }) {
	return (
		<a
			href={getAssetPath(`/partners/${partner.id}`)}
			className="group block overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/40 transition-all duration-300 ease-out hover:border-zinc-700"
		>
			<div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr]">
				{/* Logo area */}
				<div className="flex items-center justify-center border-b border-zinc-800 p-8 md:border-r md:border-b-0 md:p-12">
					<img
						src={getAssetPath(partner.logoPath)}
						alt={`${partner.name} logo`}
						className="h-12 w-auto max-w-[240px] md:h-16"
					/>
				</div>

				{/* Content area */}
				<div className="p-8 md:p-12">
					<h2 className="mb-4 text-2xl font-bold text-white">
						{partner.name}
					</h2>
					<p className="mb-6 text-base leading-relaxed text-zinc-400">
						{partner.longDescription}
					</p>

					{/* Language & Region tags */}
					<div className="mb-8 flex flex-wrap items-center gap-3">
						<div className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-sm font-medium text-zinc-200">
							<i className="ri-map-pin-2-fill text-xs text-zinc-400" aria-hidden="true" />
							{partner.region}
						</div>
						<div className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-sm font-medium text-zinc-200">
							<span className="text-sm leading-none">{partner.languageFlag}</span>
							{partner.language}
						</div>
					</div>

					<span className="inline-flex items-center text-sm font-medium text-white">
						View details
						<i
							className="ri-arrow-right-line ml-1 text-sm text-zinc-400 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-zinc-300"
							aria-hidden="true"
						/>
					</span>
				</div>
			</div>
		</a>
	);
}

function PartnerCard({ partner }: { partner: Partner }) {
	return (
		<a
			href={getAssetPath(`/partners/${partner.id}`)}
			className="group relative flex flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/40 p-8 transition-all duration-300 ease-out hover:border-zinc-700"
		>
			{/* Logo */}
			<div className="mb-6 flex items-center">
				<img
					src={getAssetPath(partner.logoPath)}
					alt={`${partner.name} logo`}
					className="h-8 w-auto max-w-[160px]"
				/>
			</div>

			{/* Description */}
			<p className="mb-4 flex-1 text-sm leading-relaxed text-zinc-400">
				{partner.longDescription}
			</p>

			{/* Language & Region tags */}
			<div className="mb-6 flex flex-wrap items-center gap-3">
				<div className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800/60 px-2.5 py-1 text-xs font-medium text-zinc-300">
					<i className="ri-map-pin-2-fill text-xs text-zinc-400" aria-hidden="true" />
					{partner.region}
				</div>
				<div className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800/60 px-2.5 py-1 text-xs font-medium text-zinc-300">
					<span className="text-xs leading-none">{partner.languageFlag}</span>
					{partner.language}
				</div>
			</div>

			{/* Link indicator */}
			<span className="inline-flex items-center text-sm font-medium text-white">
				View details
				<i
					className="ri-arrow-right-line ml-1 text-sm text-zinc-400 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-zinc-300"
					aria-hidden="true"
				/>
			</span>
		</a>
	);
}

export function ImplementationPartnersPage() {
	const featuredPartners = PARTNERS.filter((p) => p.featured);
	const otherPartners = PARTNERS.filter((p) => !p.featured);

	return (
		<div className="relative min-h-screen bg-zinc-950 text-white">
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
				className="text-whiteno-underline absolute -left-[9999px] z-[999] rounded-br-lg bg-zinc-800 px-6 py-4 font-semibold focus:top-0 focus:left-0"
			>
				Skip to main content
			</a>

			<Navigation activePath="/implementation-partners" />
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
							maskImage:
								"linear-gradient(to bottom, black 0%, black 200px, transparent 300px, transparent 350px, black 450px, black 100%)",
							WebkitMaskImage:
								"linear-gradient(to bottom, black 0%, black 200px, transparent 300px, transparent 350px, black 450px, black 100%)",
						}}
					/>
				</div>
			</div>

			<main id="main-content" className="relative z-10 pt-16">
				{/* Hero Section */}
				<section className="relative w-full pt-16 pb-8 md:pt-20 md:pb-10">
					{/* Grid background */}
					<div
						className="pointer-events-none absolute inset-0"
						style={{
							backgroundImage: `
                linear-gradient(to right, rgba(24, 24, 27, 0.8) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(24, 24, 27, 0.8) 1px, transparent 1px)
              `,
							backgroundSize: "196.6px 171px",
							backgroundPosition: "calc(50% + 97px) 0",
						}}
					/>

					{/* Fade out grid at top and bottom */}
					<div
						className="pointer-events-none absolute inset-0"
						style={{
							background:
								"linear-gradient(to bottom, #09090b 0%, transparent 20%, transparent 60%, #09090b 100%)",
						}}
					/>

					{/* Subtle glow */}
					<div
						className="pointer-events-none absolute inset-x-0 top-0 h-[400px]"
						style={{
							background: `
                radial-gradient(ellipse 50% 80% at 70% -20%, rgba(255, 255, 255, 0.08) 0%, transparent 50%),
                radial-gradient(ellipse 30% 50% at 80% 0%, rgba(255, 255, 255, 0.05) 0%, transparent 40%)
              `,
						}}
					/>

					<div className="relative mx-auto w-full max-w-[73.75rem] px-4">
						<p className="mb-3 font-mono text-sm font-medium tracking-wide text-zinc-400 uppercase">
							{"// Implementation partners"}
						</p>
						<h1 className="text-3xl font-bold text-white md:text-4xl">
							Get help adopting Effect
						</h1>
						<p className="mt-4 max-w-xl text-lg text-zinc-400">
							Work with vetted companies that bring deep expertise in
							Effect to help your team build production-grade software.
						</p>
					</div>
				</section>

				{/* Featured Partners */}
				<section className="pt-0 pb-12">
					<div className="mx-auto w-full max-w-[73.75rem] px-4">
						<div className="border-t border-zinc-800 pt-12">
							{featuredPartners.map((partner) => (
								<FeaturedPartnerCard
									key={partner.id}
									partner={partner}
								/>
							))}
						</div>
					</div>
				</section>

				{/* Other Partners */}
				{otherPartners.length > 0 && (
					<section className="pb-24">
						<div className="mx-auto w-full max-w-[73.75rem] px-4">
							<div className="border-t border-zinc-800 pt-12">
								<p className="mb-8 font-mono text-sm font-medium tracking-wide text-zinc-400 uppercase">
									{"// Partners"}
								</p>
								<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
									{otherPartners.map((partner) => (
										<PartnerCard
											key={partner.id}
											partner={partner}
										/>
									))}
								</div>
							</div>
						</div>
					</section>
				)}

				{/* Contact Form */}
				<section className="pb-24">
					<div className="mx-auto w-full max-w-[73.75rem] px-4">
						<div className="border-t border-zinc-800 pt-12">
							<p className="mb-4 font-mono text-sm font-medium tracking-wide text-zinc-400 uppercase">
								{"// Get in touch"}
							</p>
							<h2 className="mb-3 text-2xl font-semibold text-white md:text-3xl">
								Need help adopting Effect?
							</h2>
							<p className="mb-10 max-w-xl text-base text-zinc-400">
								Tell us about your project and we'll connect you with the right implementation partner.
							</p>
							<ContactForm />
						</div>
					</div>
				</section>

			</main>

			<Footer activePath="/implementation-partners" />
		</div>
	);
}
