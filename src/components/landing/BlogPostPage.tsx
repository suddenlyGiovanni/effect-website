import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { BLOG_POSTS, getPostUrl } from "../../data/blog";
import { getAssetPath } from "../../utils/assetPath";
import { Link } from "@/components/ui";
import { GridOverlay } from "../GridOverlay";
import { Footer } from "./Footer";
import { Navigation } from "./Navigation";

function ShareButtons({ title }: { title: string }) {
	const [copied, setCopied] = useState(false);
	const shareUrl =
		typeof window !== "undefined" ? window.location.href : "";
	const encodedUrl = encodeURIComponent(shareUrl);
	const encodedTitle = encodeURIComponent(title);
	const xUrl = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
	const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;

	const handleCopy = async () => {
		if (typeof window === "undefined") return;
		try {
			await navigator.clipboard.writeText(window.location.href);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// noop
		}
	};

	const buttonClass =
		"inline-flex h-10 w-10 items-center justify-center rounded-md border border-zinc-300 text-zinc-700 transition-colors hover:border-zinc-900 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-white dark:hover:text-white";

	return (
		<div className="flex items-center gap-3">
			<span className="font-mono text-xs font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-500">
				Share
			</span>
			<div className="flex items-center gap-2">
				<a
					href={xUrl}
					target="_blank"
					rel="noopener noreferrer"
					aria-label="Share on X"
					className={buttonClass}
				>
					<i className="ri-twitter-x-line text-lg" aria-hidden="true" />
				</a>
				<a
					href={linkedInUrl}
					target="_blank"
					rel="noopener noreferrer"
					aria-label="Share on LinkedIn"
					className={buttonClass}
				>
					<i className="ri-linkedin-fill text-lg" aria-hidden="true" />
				</a>
				<button
					type="button"
					onClick={handleCopy}
					aria-label={copied ? "Link copied" : "Copy link"}
					className={buttonClass}
				>
					<i
						className={`${copied ? "ri-check-line" : "ri-link"} text-lg`}
						aria-hidden="true"
					/>
				</button>
			</div>
		</div>
	);
}

function TableOfContents({
	className,
	showBackLink = true,
	postTitle,
	postDate,
}: { className?: string; showBackLink?: boolean; postTitle?: string; postDate?: string }) {
	const tocItems = [
		{
			id: "faster-runtime",
			label: "Faster runtime. Leaner bundles.",
			depth: 0,
		},
		{ id: "bundle-size", label: "Bundle size", depth: 1 },
		{ id: "one-version", label: "One version. One ecosystem.", depth: 0 },
		{ id: "consolidated-core", label: "A consolidated core", depth: 1 },
		{ id: "unstable-modules", label: "Unstable modules", depth: 0 },
		{ id: "beta-phase", label: "The beta phase", depth: 0 },
		{ id: "migrating", label: "Migrating from Effect v3", depth: 0 },
		{ id: "try-it-now", label: "Try it now", depth: 0 },
	];

	const [activeId, setActiveId] = useState<string | null>(null);

	useEffect(() => {
		if (typeof window === "undefined") return;
		const headings = tocItems
			.map((item) => document.getElementById(item.id))
			.filter((el): el is HTMLElement => el !== null);
		if (headings.length === 0) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const visible = entries
					.filter((e) => e.isIntersecting)
					.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
				if (visible.length > 0) {
					setActiveId(visible[0].target.id);
				}
			},
			{ rootMargin: "-80px 0px -70% 0px", threshold: 0 },
		);

		headings.forEach((el) => observer.observe(el));
		return () => observer.disconnect();
	}, []);

	return (
		<nav className={cn("sticky top-[5.5rem]", className)}>
			<div className="rounded-md border border-zinc-200 bg-zinc-50/40 p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
				<p className="mb-3 font-mono text-xs font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-500">
					On this page
				</p>
				<div className="mb-3 h-px bg-zinc-200 dark:bg-zinc-800" />
				<ul className="space-y-2">
					{tocItems.map((item) => {
						const isActive = activeId === item.id;
						return (
							<li key={item.id}>
								<a
									href={`#${item.id}`}
									className={`block text-sm leading-snug transition-colors duration-150 ${
										item.depth === 0 ? "" : "pl-4"
									} ${
										isActive
											? "text-zinc-900 underline underline-offset-4 dark:text-white"
											: "text-zinc-600 hover:text-zinc-900 hover:underline hover:underline-offset-4 dark:text-zinc-400 dark:hover:text-white"
									}`}
								>
									{item.label}
								</a>
							</li>
						);
					})}
				</ul>
			</div>

			{/* Share + Last updated + Back to blog */}
			{showBackLink && (
				<div className="mt-6">
					{postTitle && (
						<>
							<ShareButtons title={postTitle} />
							<div className="mt-5 border-t border-zinc-200 pt-5 dark:border-zinc-800" />
						</>
					)}
					{postDate && (
						<p className="flex flex-col gap-0.5">
							<span className="font-mono text-[10px] tracking-[0.12em] text-zinc-500 uppercase dark:text-zinc-500">
								Last updated
							</span>
							<time className="font-mono text-xs text-zinc-700 tabular-nums dark:text-zinc-300">
								{postDate}
							</time>
						</p>
					)}
				</div>
			)}
		</nav>
	);
}

function PostNavigation({ currentSlug }: { currentSlug: string }) {
	const currentIndex = BLOG_POSTS.findIndex((p) => p.slug === currentSlug);
	const prevPost = currentIndex > 0 ? BLOG_POSTS[currentIndex - 1] : null;
	const nextPost =
		currentIndex < BLOG_POSTS.length - 1 ? BLOG_POSTS[currentIndex + 1] : null;

	if (!prevPost && !nextPost) return null;

	const prevUrl = prevPost ? getPostUrl(prevPost) : null;
	const nextUrl = nextPost ? getPostUrl(nextPost) : null;
	const prevIsExternal = prevUrl?.startsWith("http") ?? false;
	const nextIsExternal = nextUrl?.startsWith("http") ?? false;

	return (
		<div className="mt-16 grid grid-cols-1 gap-4 border-t border-zinc-200 pt-10 sm:grid-cols-2 dark:border-zinc-800">
			{prevPost && prevUrl ? (
				<a
					href={prevIsExternal ? prevUrl : getAssetPath(prevUrl)}
					{...(prevIsExternal
						? { target: "_blank", rel: "noopener noreferrer" }
						: {})}
					className="group flex flex-col rounded-md border border-zinc-300 px-6 py-5 transition-colors duration-200 hover:border-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-500"
				>
					<span className="flex items-center gap-1.5 font-mono text-xs tracking-wider text-zinc-500 uppercase dark:text-zinc-500">
						<i className="ri-arrow-left-s-line text-base transition-transform duration-200 group-hover:-translate-x-0.5" />
						Previous
					</span>
					<span className="mt-2 line-clamp-1 text-base font-medium text-zinc-800 transition-colors group-hover:text-zinc-900 dark:text-zinc-200 dark:group-hover:text-white">
						{prevPost.title}
					</span>
				</a>
			) : (
				<div />
			)}
			{nextPost && nextUrl ? (
				<a
					href={nextIsExternal ? nextUrl : getAssetPath(nextUrl)}
					{...(nextIsExternal
						? { target: "_blank", rel: "noopener noreferrer" }
						: {})}
					className="group flex flex-col items-end rounded-md border border-zinc-300 px-6 py-5 text-right transition-colors duration-200 hover:border-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-500"
				>
					<span className="flex items-center gap-1.5 font-mono text-xs tracking-wider text-zinc-500 uppercase dark:text-zinc-500">
						Next
						<i className="ri-arrow-right-s-line text-base transition-transform duration-200 group-hover:translate-x-0.5" />
					</span>
					<span className="mt-2 line-clamp-1 text-base font-medium text-zinc-800 transition-colors group-hover:text-zinc-900 dark:text-zinc-200 dark:group-hover:text-white">
						{nextPost.title}
					</span>
				</a>
			) : (
				<div />
			)}
		</div>
	);
}

export function BlogPostPage({ slug }: { slug: string }) {
	const post = BLOG_POSTS.find((p) => p.slug === slug);

	if (!post) {
		return (
			<div className="relative min-h-screen bg-white text-zinc-900 antialiased dark:bg-zinc-950 dark:text-white">
				<Navigation activePath="/blog" />
				<main className="flex min-h-[60vh] items-center justify-center pt-16">
					<div className="flex flex-col items-center text-center">
						<div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900">
							<i className="ri-article-line text-3xl text-zinc-400" />
						</div>
						<p className="mt-5 text-lg text-zinc-700 dark:text-zinc-300">
							Post not found.
						</p>
						<a
							href={getAssetPath("/blog")}
							className="mt-5 inline-flex items-center gap-2 rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200 hover:text-zinc-900 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 dark:hover:text-white"
						>
							<i className="ri-arrow-left-s-line" />
							Back to blog
						</a>
					</div>
				</main>
				<Footer activePath="/blog" />
			</div>
		);
	}

	return (
		<div className="relative min-h-screen bg-white text-zinc-900 antialiased dark:bg-zinc-950 dark:text-white">
			{/* Dithered background overlay */}
			<div
				className="pointer-events-none fixed inset-0 z-0 hidden opacity-[0.03] dark:block"
				style={{
					backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect x='0' y='0' width='1' height='1' fill='white'/%3E%3Crect x='2' y='2' width='1' height='1' fill='white'/%3E%3C/svg%3E")`,
					backgroundSize: "4px 4px",
				}}
			/>

			<a
				href="#main-content"
				className="absolute -left-[9999px] z-[999] rounded-br-lg bg-zinc-100 px-6 py-4 font-semibold text-zinc-900 no-underline focus:top-0 focus:left-0 dark:bg-zinc-800 dark:text-white"
			>
				Skip to main content
			</a>

			<Navigation activePath="/blog" />
			<GridOverlay />

			{/* Vertical border lines container */}
			<div className="pointer-events-none absolute top-0 right-0 bottom-0 left-0 z-[60] hidden lg:block">
				<div className="relative mx-auto h-full w-full max-w-[73.75rem]">
					{/* Left vertical line */}
					<div className="absolute top-0 bottom-0 left-0 w-px bg-zinc-200 dark:bg-zinc-800" />
					{/* Right vertical line */}
					<div className="absolute top-0 right-0 bottom-0 w-px bg-zinc-200 dark:bg-zinc-800" />
				</div>
			</div>

			<main id="main-content" className="relative w-full pt-16">
				{/* Hero background — absolute overlay, limited height */}
				<div className="pointer-events-none absolute inset-x-0 top-16 z-0 h-[520px] overflow-hidden">
					<div
						className="absolute inset-0"
						style={{
							backgroundImage: `
								linear-gradient(to right, rgba(24, 24, 27, 0.8) 1px, transparent 1px),
								linear-gradient(to bottom, rgba(24, 24, 27, 0.8) 1px, transparent 1px)
							`,
							backgroundSize: "196.6px 194px",
							backgroundPosition: "calc(50% + 97px) 0",
						}}
					/>
					<div
						className="absolute inset-0"
						style={{
							background:
								"linear-gradient(to bottom, #09090b 0%, transparent 20%, transparent 60%, #09090b 100%)",
						}}
					/>
					<div
						className="absolute inset-x-0 top-0 h-[400px]"
						style={{
							background:
								"radial-gradient(ellipse 50% 80% at 70% -20%, rgba(255, 255, 255, 0.10) 0%, transparent 50%)",
						}}
					/>
				</div>

				<div className="relative z-10 mx-auto w-full max-w-[73.75rem] px-4">
					<nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-16 pb-1 font-mono text-sm tracking-wider uppercase md:pt-20">
						<a
							href={getAssetPath("/blog")}
							className="text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
						>
							Blog
						</a>
						<span className="text-zinc-600 dark:text-zinc-400" aria-hidden="true">//</span>
						<div className="flex flex-wrap items-center gap-x-3 gap-y-2">
							{[...post.tags].sort((a, b) => a.localeCompare(b)).map((tag) => (
								<a
									key={tag}
									href={`${getAssetPath("/blog")}?category=${encodeURIComponent(tag)}`}
									className="text-zinc-800 transition-colors hover:text-zinc-950 dark:text-zinc-200 dark:hover:text-white"
								>
									{tag}
								</a>
							))}
						</div>
					</nav>

					{/* Unified 12-col grid: title (col 1-8) + TOC (col 10-12 spanning all rows) + full-width divider + article body */}
					<div className="grid grid-cols-1 md:grid-cols-12 md:gap-x-6">
						{/* Title block — col 1-8, row 1 */}
						<div className="md:col-span-8 md:row-start-1 md:pt-2 md:pb-10">
							<h1 className="text-3xl leading-tight font-bold tracking-tight text-zinc-900 md:text-4xl lg:text-[2.75rem] dark:text-white">
								{post.title}
							</h1>
							<p className="mt-4 text-base leading-relaxed text-zinc-700 md:text-lg dark:text-zinc-300">
								{post.excerpt}
							</p>
							{/* Mobile-only byline (sidebar version shows on md+) */}
							<div className="mt-8 flex flex-wrap items-center gap-4 md:hidden">
								{post.authors.map((author) => (
									<Link
										key={author.name}
										href={author.url}
										variant="inline"
										className="group/byline flex items-center gap-3 no-underline"
									>
										<img
											src={getAssetPath(author.avatar)}
											alt={author.name}
											className="h-10 w-10 rounded-md object-cover"
										/>
										<span className="flex min-w-0 flex-col">
											<span className="truncate text-base font-medium text-zinc-800 group-hover/byline:underline dark:text-zinc-200">
												{author.name}
											</span>
											<span className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
												{author.title}
											</span>
										</span>
									</Link>
								))}
							</div>
						</div>

						{/* Sidebar — Author meta + TOC, aligned with article body (row 3) */}
						<aside className="hidden md:col-start-10 md:col-span-3 md:row-start-3 md:block md:pt-16 lg:pt-20">
							{/* Byline */}
							<div className="mb-8">
								{post.authors.map((author) => (
									<Link
										key={author.name}
										href={author.url}
										variant="inline"
										className="group/byline flex items-center gap-3 no-underline"
									>
										<img
											src={getAssetPath(author.avatar)}
											alt={author.name}
											className="h-12 w-12 rounded-md object-cover"
										/>
										<span className="flex min-w-0 flex-col">
											<span className="truncate text-base font-medium text-zinc-800 group-hover/byline:underline dark:text-zinc-200">
												{author.name}
											</span>
											<span className="mt-0.5 truncate text-sm text-zinc-500 dark:text-zinc-400">
												{author.title}
											</span>
										</span>
									</Link>
								))}
							</div>
							<TableOfContents postTitle={post.title} postDate={post.date} />
						</aside>

						{/* Full-width divider */}
						<div className="hidden md:col-span-12 md:row-start-2 md:block md:h-px md:bg-zinc-200 dark:md:bg-zinc-800" />

						{/* Article body — col 1-8, row 3 */}
						<article className="min-w-0 pb-20 md:col-span-8 md:row-start-3">
							{/* Mobile Table of Contents */}
							<div className="mt-10 mb-10 block md:hidden">
								<TableOfContents showBackLink={false} className="static" />
							</div>

							{/* Article content */}
							<div className="prose prose-zinc prose-headings:font-semibold prose-headings:tracking-tight prose-h2:mt-14 prose-h2:mb-5 prose-h2:text-2xl prose-h3:mt-10 prose-h3:mb-4 prose-h3:text-xl prose-p:text-zinc-700 prose-p:text-lg prose-p:leading-relaxed prose-a:text-zinc-900 prose-a:underline prose-a:decoration-zinc-300 prose-a:underline-offset-4 hover:prose-a:decoration-zinc-600 prose-strong:text-zinc-900 prose-code:rounded-md prose-code:bg-zinc-100 prose-code:px-2 prose-code:py-1 prose-code:font-mono prose-code:text-sm prose-code:text-zinc-800 prose-code:before:content-none prose-code:after:content-none prose-pre:rounded-xl prose-pre:border prose-pre:border-zinc-200 prose-pre:bg-zinc-50 prose-pre:text-sm prose-li:text-zinc-700 prose-li:text-lg prose-hr:border-zinc-200 dark:prose-invert dark:prose-p:text-zinc-300 dark:prose-a:text-white dark:prose-a:decoration-zinc-400 dark:hover:prose-a:decoration-zinc-300 dark:prose-strong:text-white dark:prose-code:bg-zinc-800 dark:prose-code:text-zinc-200 dark:prose-pre:border-zinc-800 dark:prose-pre:bg-zinc-900/80 dark:prose-li:text-zinc-300 dark:prose-hr:border-zinc-800 mt-16 max-w-none md:mt-20">
								<h2 id="faster-runtime">Faster runtime. Leaner bundles.</h2>
								<p>
									The core fiber runtime has been rewritten from scratch to have
									lower memory overhead, faster execution, and simpler
									internals. Every Effect application benefits from these
									optimizations immediately.
								</p>

								<h3 id="bundle-size">Bundle size</h3>
								<p>
									A minimal program using Effect, Stream, and Schema drops from
									roughly <strong>70 kB</strong> in v3 to about{" "}
									<strong>20 kB</strong> in v4.
								</p>

								<pre>
									<code>{`import { Effect } from "effect"

const program = Effect.gen(function* () {
  const result = yield* Effect.succeed(42)
  yield* Effect.log(\`The answer is \${result}\`)
})

Effect.runPromise(program)`}</code>
								</pre>

								<div className="not-prose my-8">
									<div className="relative w-full overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
										<video
											autoPlay
											controls
											loop
											muted
											playsInline
											width="100%"
										>
											<source
												src="https://effect.website/video/bundle-size-viz.mp4"
												type="video/mp4"
											/>
											Your browser does not support the video tag.
										</video>
									</div>
								</div>

								<h2 id="one-version">One version. One ecosystem.</h2>

								<p>
									All Effect ecosystem packages now share a single version
									number and are released together. No more debugging version
									mismatches.
								</p>

								<h3 id="consolidated-core">A consolidated core</h3>
								<p>
									Functionality from <code>@effect/platform</code>,{" "}
									<code>@effect/rpc</code>, and <code>@effect/cluster</code> now
									lives directly inside <code>effect</code>.
								</p>

								<div className="not-prose my-8">
									<div className="relative w-full overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
										<video
											autoPlay
											controls
											loop
											muted
											playsInline
											width="100%"
										>
											<source
												src="https://effect.website/video/core-package.mp4"
												type="video/mp4"
											/>
											Your browser does not support the video tag.
										</video>
									</div>
								</div>

								<h2 id="unstable-modules">Unstable modules</h2>
								<p>
									New capabilities ship via <code>effect/unstable/*</code>{" "}
									import paths without committing to semver stability for
									evolving APIs.
								</p>

								<h2 id="beta-phase">The beta phase</h2>
								<p>
									This is a beta. APIs will evolve as we incorporate real-world
									feedback. If you're running Effect in production, v3 remains
									recommended for now.
								</p>

								<h2 id="migrating">Migrating from Effect v3</h2>
								<p>
									The core programming model is the same. Changes are in package
									organization, module versioning, and specific API details. See
									the{" "}
									<a
										href="https://github.com/Effect-TS/effect-smol/blob/main/MIGRATION.md"
										target="_blank"
										rel="noopener noreferrer"
									>
										migration guide
									</a>
									.
								</p>

								<h2 id="try-it-now">Try it now</h2>
								<p>
									Port a project or module and{" "}
									<a
										href="https://github.com/Effect-TS/effect-smol/issues"
										target="_blank"
										rel="noopener noreferrer"
									>
										file an issue
									</a>{" "}
									with what you find. Join the{" "}
									<a
										href="https://discord.gg/effect-ts"
										target="_blank"
										rel="noopener noreferrer"
									>
										Discord
									</a>{" "}
									to share your experience.
								</p>
							</div>

							{/* Mobile-only Share + Last updated */}
							<div className="mt-12 flex flex-col gap-6 border-t border-zinc-200 pt-8 md:hidden dark:border-zinc-800">
								<ShareButtons title={post.title} />
								<p className="flex flex-col gap-0.5">
									<span className="font-mono text-[10px] tracking-wider text-zinc-500 uppercase dark:text-zinc-500">
										Last updated
									</span>
									<time className="font-mono text-xs text-zinc-700 tabular-nums dark:text-zinc-300">
										{post.date}
									</time>
								</p>
							</div>

							{/* Post navigation */}
							<PostNavigation currentSlug={slug} />
						</article>
					</div>

					{/* Community CTA — aligned with body/sidebar columns */}
					<div className="mt-16 h-px w-full bg-zinc-200 dark:bg-zinc-800" />
					<div className="grid grid-cols-1 items-center gap-6 py-12 md:grid-cols-12 md:gap-x-6 md:gap-y-8 md:py-20">
						{/* Content — cols 1-8 to match body */}
						<div className="md:col-span-8">
							<p className="mb-3 font-mono text-sm font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
								// Effect Community
							</p>
							<h2 className="text-xl font-semibold tracking-tight text-zinc-900 md:text-2xl dark:text-white">
								Join the conversation on Discord
							</h2>
							<p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
								Meet engineers running Effect in production.
							</p>
						</div>

						{/* CTA — col-start-9 col-span-4 */}
						<div className="md:col-start-9 md:col-span-4">
							<div className="relative mx-auto flex max-w-xs flex-col items-center gap-3 px-6 py-6 md:max-w-none">
								{/* Corner brackets */}
								<span className="absolute top-0 left-0 h-3 w-3 border-t border-l border-zinc-300 dark:border-zinc-700" />
								<span className="absolute top-0 right-0 h-3 w-3 border-t border-r border-zinc-300 dark:border-zinc-700" />
								<span className="absolute bottom-0 left-0 h-3 w-3 border-b border-l border-zinc-300 dark:border-zinc-700" />
								<span className="absolute right-0 bottom-0 h-3 w-3 border-r border-b border-zinc-300 dark:border-zinc-700" />

								<a
									href="https://discord.gg/effect-ts"
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
								>
									Join the Discord
									<i className="ri-arrow-right-line text-base" aria-hidden="true" />
								</a>
								<a
									href="https://discord.gg/effect-ts"
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-1 font-mono text-xs text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
								>
									discord.gg/effect-ts
									<i className="ri-arrow-right-up-line" aria-hidden="true" />
								</a>
							</div>
						</div>
					</div>
				</div>
			</main>

			<Footer activePath="/blog" />
		</div>
	);
}
