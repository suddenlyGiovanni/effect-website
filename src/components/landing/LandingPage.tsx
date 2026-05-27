import { Navigation } from "./Navigation";
import { HeroSection } from "./HeroSection";
import { ProblemSection } from "./ProblemSection";
import { FeaturesSection } from "./FeaturesSection";
import { AIBuildingSection } from "./AIBuildingSection";
import { AISection } from "./AISection";
import { TestimonialsSection } from "./TestimonialsSection";
import { WhatIsEffectSection } from "./WhatIsEffectSection";
import { QuotesGridSection } from "./QuotesSection";
import { FAQSection } from "./FAQSection";
import { CTASection } from "./CTASection";
import { Footer } from "./Footer";
import { GridOverlay } from "../GridOverlay";

function SectionDivider() {
	return <div className="h-px w-full bg-zinc-800" />;
}

export function LandingPage() {
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
				className="text-white no-underline absolute -left-[9999px] z-[999] rounded-br-lg bg-zinc-800 px-6 py-4 font-semibold focus:left-0 focus:top-0"
			>
				Skip to main content
			</a>

			<Navigation />
			<GridOverlay />

			{/* Vertical border lines container */}
			<div className="pointer-events-none absolute left-0 right-0 top-0 bottom-0 z-[60] hidden lg:block">
				<div className="relative mx-auto h-full w-full max-w-[73.75rem]">
					{/* Left vertical line */}
					<div className="absolute left-0 top-0 bottom-0 w-px bg-zinc-800" />
					{/* Right vertical line */}
					<div className="absolute right-0 top-0 bottom-0 w-px bg-zinc-800" />
				</div>
			</div>

			{/* Center vertical line - dashed, behind content */}
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

			{/* Main Content */}
			<main id="main-content" className="relative w-full pt-16">
				<HeroSection />
				<SectionDivider />
				<ProblemSection />
				<SectionDivider />
				<TestimonialsSection />
				<SectionDivider />
				<WhatIsEffectSection />
				<SectionDivider />
				<FeaturesSection />
				<SectionDivider />
				<AIBuildingSection />
				<SectionDivider />
				<AISection />
				<SectionDivider />
				<QuotesGridSection />
				<SectionDivider />
				<FAQSection />
				<SectionDivider />
				<CTASection />
			</main>

			<Footer hideCommunityBorder />
		</div>
	);
}
