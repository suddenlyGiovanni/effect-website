import { useEffect } from "react";
import { getAssetPath } from "../../utils/assetPath";
import { Button, Link } from "@/components/ui";

interface NavigationProps {
	transparent?: boolean;
	activePath?: string;
}

export function Navigation({ transparent = false, activePath }: NavigationProps) {
	useEffect(() => {
		let isMenuAnimating = false;

		const menu = document.getElementById("mobile-menu");
		const backdrop = document.getElementById("mobile-menu-backdrop");
		const panel = document.getElementById("mobile-menu-panel");

		const toggleMobileMenu = () => {
			if (isMenuAnimating || !menu || !backdrop || !panel) return;

			const isHidden = menu?.classList.contains("hidden");

			if (isHidden) {
				menu.classList.remove("hidden");
				backdrop.classList.add("mobile-menu-backdrop-enter");
				panel.classList.add("mobile-menu-panel-enter");
				isMenuAnimating = true;
				setTimeout(() => {
					backdrop.classList.remove("mobile-menu-backdrop-enter");
					panel.classList.remove("mobile-menu-panel-enter");
					panel.style.transform = "translateX(0)";
					isMenuAnimating = false;
				}, 300);
			} else {
				panel.style.transform = "";
				backdrop.classList.add("mobile-menu-backdrop-exit");
				panel.classList.add("mobile-menu-panel-exit");
				isMenuAnimating = true;
				setTimeout(() => {
					menu.classList.add("hidden");
					backdrop.classList.remove("mobile-menu-backdrop-exit");
					panel.classList.remove("mobile-menu-panel-exit");
					panel.style.transform = "translateX(100%)";
					isMenuAnimating = false;
				}, 300);
			}
		};

		const mobileMenuButton =
			document.querySelector<HTMLButtonElement>("button.md\\:hidden");
		if (mobileMenuButton) {
			mobileMenuButton.addEventListener("click", toggleMobileMenu);
		}

		const handleEsc = (event: KeyboardEvent) => {
			if (
				event.key === "Escape" &&
				menu &&
				!menu.classList.contains("hidden")
			) {
				toggleMobileMenu();
			}
		};
		document.addEventListener("keydown", handleEsc);

		return () => {
			if (mobileMenuButton) {
				mobileMenuButton.removeEventListener("click", toggleMobileMenu);
			}
			document.removeEventListener("keydown", handleEsc);
		};
	}, []);

	return (
		<>
			<div
				className={`fixed top-0 right-0 left-0 z-100 w-full backdrop-blur-sm ${transparent ? "" : "border-b border-zinc-800 bg-zinc-950/85"}`}
			>
				<div className="w-full">
					<header className="relative mx-auto w-full max-w-[73.75rem] px-4">
						<nav className="flex h-16 items-center">
							<a href="/" className="flex items-center">
								<img
									src={getAssetPath(
										"/assets/effect-logo/Combination mark/SVG/effect-logo-white.svg",
									)}
									alt="Effect"
									className="h-[1.75rem] w-auto"
								/>
							</a>

							{/* Navigation links next to logo */}
							<div className="ml-8 hidden items-center gap-6 md:flex">
							<Link
								href="https://effect.website/docs/"
								variant="nav"
								className={transparent ? "text-white hover:text-white/80" : ""}
							>
								Docs
							</Link>
							<Link
								href={getAssetPath("/blog")}
								variant="nav"
								active={activePath?.startsWith("/blog")}
								className={transparent ? "text-white hover:text-white/80" : ""}
							>
								Blog
							</Link>
							<Link
								href={getAssetPath("/podcast")}
								variant="nav"
								active={activePath?.startsWith("/podcast")}
								className={transparent ? "text-white hover:text-white/80" : ""}
							>
								Podcast
							</Link>
							<Link
								href="https://effect.website/play/"
								variant="nav"
								className={transparent ? "text-white hover:text-white/80" : ""}
							>
								Play
							</Link>
							<Link
								href="https://www.effect.solutions/"
								variant="nav"
								className={transparent ? "text-white hover:text-white/80" : ""}
							>
								LLM Guide
							</Link>
							<Button
								href="https://www.effect.institute/"
								variant="primary"
								size="sm"
								className="rounded-md py-1.5"
							>
								Learn
							</Button>
							</div>

							{/* Mobile menu button */}
							<button
								type="button"
								className="ml-auto flex h-10 w-10 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white md:hidden"
								aria-label="Open navigation menu"
							>
								<i className="ri-menu-2-line text-xl" aria-hidden="true" />
							</button>

							{/* Right side items (desktop) */}
							<div className="ml-auto hidden items-center gap-4.5 md:flex">
								<div className="flex items-center gap-4">
								<Link
									href="https://github.com/Effect-TS/effect"
									variant="icon"
									aria-label="Visit Effect on GitHub"
									className={transparent ? "text-white hover:text-white/80" : ""}
								>
									<i className="ri-github-fill text-xl" aria-hidden="true" />
								</Link>
								<Link
									href="https://discord.gg/effect-ts"
									variant="icon"
									aria-label="Join Effect Discord server"
									className={transparent ? "text-white hover:text-white/80" : ""}
								>
									<i className="ri-discord-fill text-xl" aria-hidden="true" />
								</Link>
								</div>

								<div
									className={`h-4.5 w-px ${transparent ? "bg-white/50" : "bg-zinc-700"}`}
								/>

								<button
									type="button"
									aria-label="Open search (Command K)"
									className={`flex items-center gap-2 rounded-md border px-2 py-1 text-sm transition-colors ${transparent ? "border-white/50 text-white hover:border-white hover:bg-zinc-800" : "border-zinc-600 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900 hover:text-white"}`}
								>
									<i
										className="ri-search-line text-base font-medium"
										aria-hidden="true"
									/>
									<kbd
										className={`text-[12px] ${transparent ? "text-white/80" : "text-zinc-400/80"}`}
									>
										⌘K
									</kbd>
								</button>
							</div>
						</nav>
					</header>
				</div>
			</div>

			<div id="mobile-menu" className="fixed inset-0 z-[200] hidden">
				<button
					type="button"
					id="mobile-menu-backdrop"
					className="fixed inset-0 bg-zinc-800/10"
					onClick={() => {
						const menu = document.getElementById("mobile-menu");
						if (menu) menu.classList.add("hidden");
					}}
					aria-label="Close mobile menu"
				></button>
				<div
					id="mobile-menu-panel"
					className="fixed top-0 right-0 flex h-full w-full max-w-[64%] flex-col bg-zinc-900 shadow-xl"
					style={{ transform: "translateX(100%)" }}
				>
					<div className="flex flex-shrink-0 items-center justify-between border-b border-zinc-800 py-3.5 pr-4 pl-8">
						<span className="text-sm font-medium text-white">Menu</span>
						<button
							type="button"
							onClick={() => {
								const menu = document.getElementById("mobile-menu");
								if (menu) menu.classList.add("hidden");
							}}
							aria-label="Close navigation menu"
							className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
						>
							<i className="ri-close-line text-xl" aria-hidden="true"></i>
						</button>
					</div>
					<nav className="flex-1 overflow-y-auto px-6 py-6">
						{/* Primary navigation */}
						<div className="space-y-1">
							<a
								href="https://effect.website/docs/"
								target="_blank"
								rel="noopener noreferrer"
								className="block rounded-lg px-3 py-2.5 text-[15px] text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
							>
								Docs
							</a>
							<a
								href={getAssetPath("/blog")}
								className={`block rounded-md px-3 py-2.5 text-[15px] transition-colors hover:bg-zinc-800 hover:text-white ${activePath?.startsWith("/blog") ? "bg-zinc-800 text-white" : "text-zinc-300"}`}
							>
								Blog
							</a>
							<a
								href={getAssetPath("/podcast")}
								className={`block rounded-md px-3 py-2.5 text-[15px] transition-colors hover:bg-zinc-800 hover:text-white ${activePath?.startsWith("/podcast") ? "bg-zinc-800 text-white" : "text-zinc-300"}`}
							>
								Podcast
							</a>
							<a
								href="https://effect.website/play/"
								target="_blank"
								rel="noopener noreferrer"
								className="block rounded-md px-3 py-2.5 text-[15px] text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
							>
								Play
							</a>
							<a
								href="https://www.effect.solutions/"
								target="_blank"
								rel="noopener noreferrer"
								className="block rounded-md px-3 py-2.5 text-[15px] text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
							>
								LLM Guide
							</a>
							<a
								href="https://www.effect.institute/"
								target="_blank"
								rel="noopener noreferrer"
								className="block rounded-md px-3 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-zinc-800"
							>
								Learn Effect
							</a>
						</div>

						{/* Divider */}
						<div className="my-4 h-px bg-zinc-800" />

						{/* Secondary links */}
						<div className="space-y-1">
							<a
								href="https://github.com/Effect-TS/effect"
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
							>
								<i className="ri-github-fill text-lg" aria-hidden="true"></i>
								<span>GitHub</span>
							</a>
							<a
								href="https://discord.gg/effect-ts"
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-3 rounded-md px-3 py-2.5 text-[15px] text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
							>
								<i className="ri-discord-fill text-lg" aria-hidden="true"></i>
								<span>Discord</span>
							</a>
							<a
								href="https://twitter.com/EffectTS_"
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-3 rounded-md px-3 py-2.5 text-[15px] text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
							>
								<i className="ri-twitter-x-fill text-lg" aria-hidden="true"></i>
								<span>X / Twitter</span>
							</a>
						</div>

						{/* Search button */}
						<button
							type="button"
							aria-label="Open search (Command K)"
							className="mt-6 flex w-full items-center gap-3 rounded-md border border-zinc-500 px-3 py-2.5 text-zinc-400 transition-colors hover:border-zinc-600 hover:text-white"
						>
							<i className="ri-search-line text-lg" aria-hidden="true"></i>
							<span className="text-sm">Search</span>
							<kbd className="ml-auto text-xs text-zinc-300">⌘K</kbd>
						</button>
					</nav>
				</div>
			</div>
		</>
	);
}
