import { ThemeToggle } from "../ui/ThemeToggle";
import { Link } from "@/components/ui";

interface FooterProps {
	hideCommunityBorder?: boolean;
	activePath?: string;
}

export function Footer({ hideCommunityBorder = false, activePath }: FooterProps = {}) {
	return (
		<footer className="relative w-full px-4 pt-16 md:px-8 md:pt-20">
			{/* Subtle gradient background */}
			<div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-b from-zinc-950/0 via-zinc-950/0 to-zinc-900/50 dark:block" />

			{/* Top solid border */}
			<div className="absolute top-0 right-0 left-0 h-px bg-zinc-200 dark:bg-zinc-800" />

			<div className="relative mx-auto w-full max-w-[73.75rem]">
				{/* Footer Links Block */}
				<div className="flex flex-col">
					{/* Four Column Links Section */}
					<div className="mb-12 grid grid-cols-2 gap-x-6 gap-y-8 md:mb-20 md:gap-x-0 lg:grid-cols-4">
						{/* Column 1: Resources */}
						<div className="flex flex-1 flex-col gap-4 lg:pl-4">
							{/* Column Header */}
							<h3 className="font-mono font-semibold text-sm text-zinc-900 uppercase dark:text-zinc-100">
								Resources
							</h3>
							{/* Links */}
							<ul className="flex flex-col items-start gap-2">
								<li>
									<Link
										href="https://effect.website/docs/"
										variant="footer"
										className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
									>
										Documentation
									</Link>
								</li>
								<li>
									<Link
										href="https://effect.website/docs/additional-resources/api-reference/"
										variant="footer"
										className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
									>
										API reference
									</Link>
								</li>
								<li>
									<Link
										href="https://www.youtube.com/playlist?list=PLDf3uQLaK2B9vHzUNyvOSvoMv61LW7792"
										variant="footer"
										className="inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
									>
										Workshops
										<i className="ri-arrow-right-up-line text-sm" />
									</Link>
								</li>
							</ul>
						</div>

						{/* Column 2: DevTools */}
						<div className="flex flex-1 flex-col gap-4 lg:border-l lg:border-dashed lg:border-zinc-200 lg:pl-4 dark:lg:border-zinc-800">
							{/* Column Header */}
							<h3 className="font-mono font-semibold text-sm text-zinc-900 uppercase dark:text-zinc-100">
								DevTools
							</h3>
							{/* Links */}
							<ul className="flex flex-col items-start gap-2">
								<li>
									<Link
										href="https://effect.website/play/"
										variant="footer"
										className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
									>
										Effect Playground
									</Link>
								</li>
								<li>
									<Link
										href="https://github.com/Effect-TS/language-service"
										variant="footer"
										className="inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
									>
										Effect LSP
										<i className="ri-arrow-right-up-line text-sm" />
									</Link>
								</li>

								<li>
									<Link
										href="https://marketplace.visualstudio.com/items?itemName=effectful-tech.effect-vscode"
										variant="footer"
										className="inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
									>
										VS Code Extension
										<i className="ri-arrow-right-up-line text-sm" />
									</Link>
								</li>
								<li>
									<Link
										href="https://www.effect.solutions/"
										variant="footer"
										className="inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
									>
										Effect Solutions
										<i className="ri-arrow-right-up-line text-sm" />
									</Link>
								</li>
							</ul>
						</div>

						{/* Column 3: Community */}
						<div className={`flex flex-1 flex-col gap-4 lg:pl-4${hideCommunityBorder ? "" : " lg:border-l lg:border-dashed lg:border-zinc-200 dark:lg:border-zinc-800"}`}>
							{/* Column Header */}
							<h3 className="font-mono font-semibold text-sm text-zinc-900 uppercase dark:text-zinc-100">
								Community
							</h3>
							{/* Links */}
							<ul className="flex flex-col items-start gap-2">
								<li>
									<Link
										href={"/podcast"}
										variant="footer"
										active={activePath?.startsWith("/podcast")}
										className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
									>
										Podcast 🎙️
									</Link>
								</li>
								<li>
									<Link
										href="https://luma.com/effect-community"
										variant="footer"
										className="inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
									>
										Events & meetups
										<i className="ri-arrow-right-up-line text-sm" />
									</Link>
								</li>
								<li>
									<Link
										href="https://discord.gg/effect-ts"
										variant="footer"
										className="inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
									>
										Discord
										<i className="ri-arrow-right-up-line text-sm" />
									</Link>
								</li>
								<li>
									<Link
										href={"/implementation-partners"}
										variant="footer"
										active={activePath?.startsWith("/implementation-partners")}
										className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
									>
										Implementation Partners
									</Link>
								</li>
							</ul>
						</div>

						{/* Column 4: Other */}
						<div className="flex flex-1 flex-col gap-4 lg:border-l lg:border-dashed lg:border-zinc-200 lg:pl-4 dark:lg:border-zinc-800">
							{/* Column Header */}
							<h3 className="font-mono font-semibold text-sm text-zinc-900 uppercase dark:text-zinc-100">
								Other
							</h3>
							{/* Links */}
							<ul className="flex flex-col items-start gap-2">
								<li>
									<Link
										href={"/blog"}
										variant="footer"
										active={activePath?.startsWith("/blog")}
										className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
									>
										Blog
									</Link>
								</li>
								<li>
									<Link
										href="https://effect.website/docs/additional-resources/myths/"
										variant="footer"
										className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
									>
										Myths about Effect 💀
									</Link>
								</li>
								<li>
									<Link
										href={"/brand-assets"}
										variant="footer"
										active={activePath?.startsWith("/brand-assets")}
										className="inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
									>
										Logo guidelines
									</Link>
								</li>
								<li>
									<Link
										href={"/merch"}
										variant="footer"
										active={activePath?.startsWith("/merch")}
										className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
									>
										Effect merch 🧢
									</Link>
								</li>
							</ul>
						</div>
					</div>

					{/* Middle Section: Social & Branding */}
					<div className="flex flex-col gap-10 md:gap-8">
						{/* Top Border */}
						<div className="mx-4 h-px bg-zinc-200 dark:bg-zinc-800" />

						{/* Social Icons and Branding Row */}
						<div className="flex flex-col items-center gap-8 md:grid md:grid-cols-3 md:items-center">
							<div className="md:pl-4">
								<a href={"/"} aria-label="Go to Effect homepage">
									<img
										src={"/assets/effect-logo/Combination mark/SVG/effect-logo-black.svg"}
										alt="Effect"
										className="block h-7 dark:hidden"
									/>
									<img
										src={"/assets/effect-logo/Combination mark/SVG/effect-logo-white.svg"}
										alt="Effect"
										className="hidden h-7 dark:block"
									/>
								</a>
							</div>

							{/* Social Icons (centered on mobile, middle on desktop) */}
							<div className="flex items-center justify-center gap-6 md:gap-5">
								<Link
									href="https://github.com/Effect-TS"
									variant="icon"
									aria-label="Visit Effect on GitHub"
									className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
								>
									<div className="flex w-6 items-center justify-center">
										<i
											className="ri-github-fill text-2xl md:text-xl"
											aria-hidden="true"
										/>
									</div>
								</Link>
								<Link
									href="https://discord.gg/effect-ts"
									variant="icon"
									aria-label="Join Effect Discord server"
									className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
								>
									<div className="flex w-6 items-center justify-center">
										<i
											className="ri-discord-fill text-2xl md:text-xl"
											aria-hidden="true"
										/>
									</div>
								</Link>
								<Link
									href="https://x.com/EffectTS_"
									variant="icon"
									aria-label="Follow Effect on X (Twitter)"
									className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
								>
									<div className="flex w-6 items-center justify-center">
										<i
											className="ri-twitter-x-fill text-2xl md:text-xl"
											aria-hidden="true"
										/>
									</div>
								</Link>
								<Link
									href="https://www.youtube.com/@EffectTS"
									variant="icon"
									aria-label="Subscribe to Effect on YouTube"
									className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
								>
									<div className="flex w-6 items-center justify-center">
										<i
											className="ri-youtube-fill text-2xl md:text-xl"
											aria-hidden="true"
										/>
									</div>
								</Link>
								<Link
									href="https://www.linkedin.com/company/effect-ts"
									variant="icon"
									aria-label="Follow Effect on LinkedIn"
									className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
								>
									<div className="flex w-6 items-center justify-center">
										<i
											className="ri-linkedin-fill text-2xl md:text-xl"
											aria-hidden="true"
										/>
									</div>
								</Link>
								<Link
									href="https://bsky.app/profile/effect-ts.bsky.social"
									variant="icon"
									aria-label="Follow Effect on Bluesky"
									className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
								>
									<div className="flex w-6 items-center justify-center">
										<i
											className="ri-bluesky-fill text-2xl md:text-xl"
											aria-hidden="true"
										/>
									</div>
								</Link>
							</div>

							<div className="md:pr-4 md:text-right">
								<p className="text-sm text-zinc-600 dark:text-zinc-400">
									MIT Licensed
								</p>
							</div>
						</div>

						{/* Bottom Border */}
						<div className="mx-4 h-px bg-zinc-200 dark:bg-zinc-800" />
					</div>

					{/* Bottom Copyright Section */}
					<div className="flex flex-col items-center justify-between gap-4 px-4 pt-10 pb-16 md:flex-row md:gap-8 md:pt-8 md:pb-16">
						<p className="text-sm text-zinc-600 dark:text-zinc-400">
							© {new Date().getFullYear()}{" "}
							<a
								href="https://effectful.co/"
								className="text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
							>
								Effectful Technologies Inc.
							</a>{" "}
							All rights reserved.
						</p>
						<div className="flex items-center gap-5">
							<ThemeToggle />
							<div className="flex items-center gap-4">
								<Link
									href="mailto:contact@effectful.co"
									variant="footer"
									className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
								>
									Email us
								</Link>
								<a
									href="#"
								className="border-b border-transparent text-sm font-medium text-zinc-600 transition-colors hover:border-current hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
							>
								Terms
							</a>
							<a
								href="#"
								className="border-b border-transparent text-sm font-medium text-zinc-600 transition-colors hover:border-current hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
								>
									Privacy
								</a>
							</div>
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
}
