import { AgentCommand } from "./AgentCommand";
import { InstallCommand } from "./InstallCommand";

export function HeroSection() {
	return (
		<section className="relative w-full">
			{/* Stripe-like grid background - full width, centered */}
			<div
				className="pointer-events-none absolute inset-0"
				style={{
					backgroundImage: `
						linear-gradient(to right, rgba(24, 24, 27, 0.8) 1px, transparent 1px),
						linear-gradient(to bottom, rgba(24, 24, 27, 0.8) 1px, transparent 1px)
					`,
					backgroundSize: "196.6px 194px",
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

			{/* Subtle glow - Stripe-style ambient light with pulse animation */}
			<div
				className="pointer-events-none absolute inset-x-0 top-0 h-[600px] animate-[glow-pulse_4s_ease-in-out_infinite]"
				style={{
					background: `
						radial-gradient(ellipse 50% 80% at 70% -20%, rgba(255, 255, 255, 0.12) 0%, transparent 50%),
						radial-gradient(ellipse 30% 50% at 80% 0%, rgba(255, 255, 255, 0.08) 0%, transparent 40%)
					`,
				}}
			/>
			{/* Noise texture overlay for organic glow effect */}
			<div
				className="pointer-events-none absolute inset-x-0 top-0 h-[600px] opacity-[0.15] mix-blend-overlay"
				style={{
					backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
					backgroundRepeat: "repeat",
				}}
			/>
			<style>{`
				@keyframes glow-pulse {
					0%, 100% { opacity: 1; }
					50% { opacity: 0.6; }
				}
			`}</style>

			<div className="relative mx-auto w-full max-w-[73.75rem] px-4 pt-20 md:pt-[96px]">
				{/* Content */}
				<div className="max-w-4xl text-left md:mx-auto md:text-center">
					{/* Eyebrow */}
					<a
						href="/blog/effect-v4-beta"
						className="group mb-4 inline-flex items-center gap-2 font-mono text-xs tracking-wider text-zinc-300 uppercase transition-colors hover:text-white md:text-sm"
					>
						<span className="text-zinc-500 group-hover:text-zinc-400">//</span>
						<span>Effect 4.0 — Now in Beta</span>
						<i className="ri-arrow-right-line text-base text-zinc-500 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-300" aria-hidden="true" />
					</a>
					{/* Headline */}
					<h1 className="text-4xl font-bold text-white md:text-[3.4rem] leading-tighter">
						Reliable TypeScript for the AI era
					</h1>

					{/* Subheadline */}
					<p className="mt-6 md:mx-auto text-lg text-zinc-400 max-w-3xl leading-snug">
						Build production-ready systems with the structure, safety, and observability developers need — and AI agents can work with.
					</p>

					{/* Dual CTA — humans + agents */}
					<div className="mt-8 grid gap-4 md:mx-auto md:max-w-4xl md:grid-cols-2">
						<InstallCommand />
						<AgentCommand />
					</div>
				</div>
			</div>

			{/* Video - sits on top of the grid, overlapping the hero bottom edge */}
			<div className="relative z-10 mx-auto w-full max-w-[73.75rem] px-4 mt-12 pb-20 md:pb-[96px]">
				<div className="mx-auto max-w-5xl aspect-video rounded-lg border border-zinc-800 bg-zinc-900/80 backdrop-blur-sm flex items-center justify-center">
					<div className="flex flex-col items-center gap-3 text-zinc-400">
						<i className="ri-play-circle-line text-5xl" />
						<span className="text-sm font-medium">Video coming soon</span>
					</div>
				</div>
			</div>
		</section>
	);
}
