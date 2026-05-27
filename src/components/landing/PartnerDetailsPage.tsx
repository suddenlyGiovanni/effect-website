import { getAssetPath } from "../../utils/assetPath";
import type { Partner } from "../../data/partners";
import { GridOverlay } from "../GridOverlay";
import { Button } from "../ui";
import { ContactForm } from "./ContactForm";
import { Footer } from "./Footer";
import { Navigation } from "./Navigation";

export function PartnerDetailsPage({ partner }: { partner: Partner }) {
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
					<div className="absolute top-0 bottom-0 left-0 w-px bg-zinc-800" />
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
				<section className="relative w-full pt-16 pb-12 md:pt-20 md:pb-16">
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

					<div className="relative mx-auto w-full max-w-[73.75rem] px-4">
						<div className="mb-8">
							<a
								href={getAssetPath("/implementation-partners")}
								className="group inline-flex items-center gap-1 font-mono text-sm text-zinc-400 transition-colors hover:text-white"
							>
								<i
									className="ri-arrow-left-line text-lg transition-transform group-hover:-translate-x-1"
									aria-hidden="true"
								/>
								Back to partners
							</a>
						</div>

						<div className="grid gap-12 lg:grid-cols-[1fr_300px]">
							<div>
								<div className="mb-8 flex items-center gap-6">
									<div className="flex h-20 w-20 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 p-4">
										<img
											src={getAssetPath(partner.logoPath)}
											alt={`${partner.name} logo`}
											className="h-full w-full object-contain"
										/>
									</div>
									<div>
										<h1 className="text-3xl font-bold text-white md:text-4xl">
											{partner.name}
										</h1>
										<div className="mt-4 flex flex-wrap items-center gap-4">
											{/* Region */}
											<div className="flex items-center gap-2 text-sm text-zinc-300">
												<div className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400">
													<i className="ri-map-pin-2-fill text-sm" aria-hidden="true" />
												</div>
												<span className="font-medium">{partner.region}</span>
											</div>

											{/* Separator */}
											<div className="h-4 w-px bg-zinc-800" />

											{/* Language */}
											<div className="flex items-center gap-2 text-sm text-zinc-400">
												<span className="text-base leading-none">
													{partner.languageFlag}
												</span>
												<span className="font-mono text-xs">{partner.language}</span>
											</div>
										</div>
									</div>
								</div>

								<div className="prose prose-invert max-w-none text-zinc-400">
									<p className="text-lg leading-relaxed text-zinc-300">
										{partner.longDescription}
									</p>
								</div>
							</div>

							<div className="space-y-6">
								<div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-6">
									<h3 className="mb-4 text-sm font-semibold text-white uppercase tracking-wide">
										Connect with {partner.name}
									</h3>
									<Button
										href={partner.websiteUrl}
										variant="primary"
										className="w-full justify-center"
									>
										Visit Website
										<i className="ri-external-link-line ml-2" />
									</Button>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* Contact Form */}
				<section className="py-8 pb-16">
					<div className="mx-auto w-full max-w-[73.75rem] px-4">
						<div className="border-t border-zinc-800 pt-16">
							<p className="mb-3 font-mono text-sm font-medium tracking-wide text-zinc-400 uppercase">
								{"// Get in touch"}
							</p>
							<h2 className="mb-4 text-2xl font-bold text-white md:text-3xl">
								Work with {partner.name}
							</h2>
							<p className="mb-8 max-w-xl text-base text-zinc-400">
								Tell us about your project and we'll connect you with{" "}
								{partner.name}.
							</p>
							<ContactForm defaultPartner={partner.name} />
						</div>
					</div>
				</section>
			</main>

			<Footer activePath="/implementation-partners" />
		</div>
	);
}
