import { useRef, useState } from "react";
import { Button, Link } from "@/components/ui";
import { GridOverlay } from "../GridOverlay";
import { Footer } from "./Footer";
import { Navigation } from "./Navigation";

interface Product {
	id: string;
	name: string;
	price: string;
	images: string[];
	buyUrl: string;
	infoUrl: string;
}

const PRODUCTS: Product[] = [
	{
		id: "hoodie",
		name: "Unisex Eco Raglan Hoodie",
		price: "$45.95",
		images: [
			"/assets/merch/hoodie-1.avif",
			"/assets/merch/hoodie-2.avif",
			"/assets/merch/hoodie-3.avif",
			"/assets/merch/hoodie-4.avif",
			"/assets/merch/hoodie-5.avif",
		],
		buyUrl:
			"https://www.printful.com/product-template/80907263/17fd3245439f4d243d967bd07bb607e0",
		infoUrl:
			"https://www.printful.com/product-template/80907263/17fd3245439f4d243d967bd07bb607e0",
	},
	{
		id: "cap",
		name: "Effect.orDie Vintage corduroy cap",
		price: "$18.61",
		images: [
			"/assets/merch/cap-1.avif",
			"/assets/merch/cap-2.avif",
			"/assets/merch/cap-3.avif",
			"/assets/merch/cap-4.avif",
			"/assets/merch/cap-5.avif",
		],
		buyUrl:
			"https://www.printful.com/product-template/82771668/dd1d8e523b9981512c7bbf8ec174d751",
		infoUrl:
			"https://www.printful.com/product-template/82771668/dd1d8e523b9981512c7bbf8ec174d751",
	},
	{
		id: "tumbler",
		name: "Stainless Steel Tumbler",
		price: "$22.95",
		images: [
			"/assets/merch/tumbler-1.avif",
			"/assets/merch/tumbler-2.avif",
			"/assets/merch/tumbler-3.avif",
			"/assets/merch/tumbler-4.avif",
			"/assets/merch/tumbler-5.avif",
		],
		buyUrl:
			"https://www.printful.com/product-template/80908453/7b4f5fa98157d8c31d5304016fd8fca1",
		infoUrl:
			"https://www.printful.com/product-template/80908453/7b4f5fa98157d8c31d5304016fd8fca1",
	},
	{
		id: "classic-dad-hat",
		name: "Effect.Succeed Classic Dad hat",
		price: "$15.50",
		images: [
			"/assets/merch/classic-dad-hat-1.avif",
			"/assets/merch/classic-dad-hat-2.avif",
			"/assets/merch/classic-dad-hat-3.avif",
			"/assets/merch/classic-dad-hat-4.avif",
			"/assets/merch/classic-dad-hat-5.avif",
		],
		buyUrl:
			"https://www.printful.com/product-template/90394988/5f219821997ab8d9bc7bbfb1c391baa8",
		infoUrl:
			"https://www.printful.com/product-template/90394988/5f219821997ab8d9bc7bbfb1c391baa8",
	},
	{
		id: "tote",
		name: "All-Over Print Tote Bag",
		price: "$24.95",
		images: [
			"/assets/merch/tote-1.avif",
			"/assets/merch/tote-2.avif",
			"/assets/merch/tote-3.avif",
			"/assets/merch/tote-4.avif",
			"/assets/merch/tote-5.avif",
		],
		buyUrl:
			"https://www.printful.com/product-template/80890506/f1d620aa18f4508a28faf8ebd398a477",
		infoUrl:
			"https://www.printful.com/product-template/80890506/f1d620aa18f4508a28faf8ebd398a477",
	},
	{
		id: "sweatshirt",
		name: "Unisex Premium Sweatshirt",
		price: "$29.59",
		images: [
			"/assets/merch/sweatshirt-1.avif",
			"/assets/merch/sweatshirt-2.avif",
			"/assets/merch/sweatshirt-3.avif",
			"/assets/merch/sweatshirt-4.avif",
			"/assets/merch/sweatshirt-5.avif",
		],
		buyUrl:
			"https://www.printful.com/product-template/80908629/6db2bc050c0f7f89b49f0564bf0b7a9d",
		infoUrl:
			"https://www.printful.com/product-template/80908629/6db2bc050c0f7f89b49f0564bf0b7a9d",
	},
	{
		id: "tshirt",
		name: "Unisex organic cotton t-shirt",
		price: "$16.16",
		images: [
			"/assets/merch/tshirt-1.avif",
			"/assets/merch/tshirt-2.avif",
			"/assets/merch/tshirt-3.avif",
			"/assets/merch/tshirt-4.avif",
			"/assets/merch/tshirt-5.avif",
		],
		buyUrl:
			"https://www.printful.com/product-template/80928031/cf501382edfa7e44d626506d426b7f15",
		infoUrl:
			"https://www.printful.com/product-template/80928031/cf501382edfa7e44d626506d426b7f15",
	},
	{
		id: "water-bottle",
		name: "Stainless steel water bottle with a straw lid",
		price: "$24.09",
		images: [
			"/assets/merch/water-bottle-1.avif",
			"/assets/merch/water-bottle-2.avif",
			"/assets/merch/water-bottle-3.avif",
			"/assets/merch/water-bottle-4.avif",
			"/assets/merch/water-bottle-5.avif",
		],
		buyUrl:
			"https://www.printful.com/product-template/80908407/885ede8c502c8536e0d2dcba9faba5c6",
		infoUrl:
			"https://www.printful.com/product-template/80908407/885ede8c502c8536e0d2dcba9faba5c6",
	},
	{
		id: "dad-hat",
		name: "Organic dad hat",
		price: "$21.35",
		images: [
			"/assets/merch/dad-hat-1.avif",
			"/assets/merch/dad-hat-2.avif",
			"/assets/merch/dad-hat-3.avif",
			"/assets/merch/dad-hat-4.avif",
			"/assets/merch/dad-hat-5.avif",
		],
		buyUrl:
			"https://www.printful.com/product-template/80909110/817914c9e8dc370dce81e7a478de95c1",
		infoUrl:
			"https://www.printful.com/product-template/80909110/817914c9e8dc370dce81e7a478de95c1",
	},
];

function ProductCard({ product }: { product: Product }) {
	const [currentImageIndex, setCurrentImageIndex] = useState(0);
	const dragStartX = useRef<number | null>(null);
	const isDragging = useRef(false);

	const nextImage = () => {
		setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
	};

	const prevImage = () => {
		setCurrentImageIndex(
			(prev) => (prev - 1 + product.images.length) % product.images.length,
		);
	};

	const handleDragStart = (clientX: number) => {
		dragStartX.current = clientX;
		isDragging.current = true;
	};

	const handleDragEnd = (clientX: number) => {
		if (dragStartX.current === null || !isDragging.current) return;
		const diff = dragStartX.current - clientX;
		const threshold = 50;
		if (diff > threshold) {
			nextImage();
		} else if (diff < -threshold) {
			prevImage();
		}
		dragStartX.current = null;
		isDragging.current = false;
	};

	const handleTouchStart = (e: React.TouchEvent) => {
		handleDragStart(e.touches[0].clientX);
	};

	const handleTouchEnd = (e: React.TouchEvent) => {
		handleDragEnd(e.changedTouches[0].clientX);
	};

	return (
		<div className="flex h-full flex-col">
			{/* Image carousel */}
			<div
				className="group relative flex aspect-square items-center justify-center bg-zinc-100 select-none"
				onTouchStart={handleTouchStart}
				onTouchEnd={handleTouchEnd}
			>
				<img
					src={product.images[currentImageIndex]}
					alt={product.name}
					className="pointer-events-none max-h-[70%] max-w-[70%] object-contain"
				/>

				{/* Navigation arrows - hidden by default, visible on hover (desktop only) */}
				<button
					onClick={prevImage}
					className="absolute top-1/2 left-0 hidden h-16 w-10 -translate-y-1/2 cursor-pointer items-center justify-center text-zinc-400 opacity-0 transition-all group-hover:opacity-100 hover:text-zinc-600 md:flex"
					aria-label="Previous image"
				>
					<i className="ri-arrow-left-wide-line text-4xl" />
				</button>
				<button
					onClick={nextImage}
					className="absolute top-1/2 right-0 hidden h-16 w-10 -translate-y-1/2 cursor-pointer items-center justify-center text-zinc-400 opacity-0 transition-all group-hover:opacity-100 hover:text-zinc-600 md:flex"
					aria-label="Next image"
				>
					<i className="ri-arrow-right-wide-line text-4xl" />
				</button>

				{/* Printful logo */}
				<div className="absolute top-3 right-3">
					<svg width="64" height="8" viewBox="86 86 755 87" fill="none">
						<polygon
							fill="#F2C994"
							points="86.1,172.6 136.5,86.2 186.8,172.6"
						/>
						<polygon fill="#ED4642" points="131.6,172.6 182,86.2 232.3,172.6" />
						<polygon fill="#17BCB5" points="177.3,172.6 227.7,86.2 278,172.6" />
						<polygon
							fill="#DF392F"
							points="131.6,172.6 187,172.6 159.2,125.3"
						/>
						<polygon
							fill="#16342F"
							points="176.9,172.6 232.2,172.6 204.8,125.4"
						/>
						<polygon
							fill="#15291A"
							points="176.9,172.6 187.1,172.6 182,164.1"
						/>
						<path
							fill="#222222"
							d="M354.1,95.6c-2.3-3-5.2-5.3-8.6-6.8c-3.5-1.8-7.4-2.8-11.3-2.6h-36.5v86.1h19.6v-27.8h17.3c3.9,0.1,7.7-0.7,11.3-2.2c3.3-1.5,6.3-3.7,8.6-6.4c2.4-2.8,4.3-6,5.6-9.4c1.2-3.5,1.8-7.2,1.9-10.9c0-3.6-0.8-7.2-2.3-10.5C358.7,101.7,356.4,98.7,354.1,95.6z M339.8,124.2c-1.5,1.8-3.7,2.9-6,3h-16.2v-23.7H333c1.2-0.1,2.4,0.1,3.4,0.8c1.1,0.8,2.3,1.1,3,2.2c1.1,1,1.9,2.3,2.3,3.8c0.5,1.7,0.7,3.5,0.8,5.3C342.5,119.3,341.7,122.3,339.8,124.2z"
						/>
						<path
							fill="#222222"
							d="M426.7,135.9c1.8-1.7,3.3-3.8,4.5-6c1.2-2.1,2.1-4.4,2.6-6.8c0.8-2.4,1.2-5,1.1-7.5c0-3.6-0.8-7.2-2.3-10.5c-1.4-3.5-3.4-6.7-6-9.4c-2.5-2.9-5.5-5.2-9-6.8c-3.5-1.8-7.4-2.7-11.3-2.6h-38.8v86.1H388v-27.8h12.8l17.3,27.8h22.2l-19.5-32C423,139.2,425,137.7,426.7,135.9z M411.7,123.9c-1.3,2.1-3.6,3.3-6,3.4h-18.1l-0.4-23.3h17.7c2.5-0.1,4.8,1.1,6.4,3c2,2.3,3.1,5.2,3,8.3C414.3,119,413.6,121.6,411.7,123.9L411.7,123.9z"
						/>
						<rect
							x="445.2"
							y="86.2"
							fill="#222222"
							width="19.9"
							height="85.8"
						/>
						<polygon
							fill="#222222"
							points="529.4,136.6 489.5,86.2 474.1,86.2 474.1,172 494.1,172 494.1,123.1 533.6,172 549.3,172 549.3,86.2 529.4,86.2"
						/>
						<polygon
							fill="#222222"
							points="554.2,103.5 580.6,103.5 580.6,172 600.5,172 600.5,103.5 626.5,103.5 626.5,86.2 554.2,86.2"
						/>
						<polygon
							fill="#222222"
							points="631.3,172 651.3,172 651.3,138.1 682.9,138.1 682.9,122 651.3,122 651.3,103.5 689.6,103.5 689.6,86.2 631.3,86.2"
						/>
						<path
							fill="#222222"
							d="M749.4,129.9c0.1,3.2-0.1,6.3-0.8,9.4c-0.4,2.8-1.4,5.5-3,7.9c-1.5,2.2-3.4,4.2-5.6,5.6c-2.6,1.6-5.6,2.4-8.7,2.2c-2.9,0-5.7-0.6-8.3-1.9c-2.2-1.5-4.2-3.4-5.6-5.7c-2.8-5.3-4.2-11.3-4.1-17.3v-44h-19.9v44c0,5.5,0.7,10.9,2.2,16.2c1.3,4.9,3.6,9.5,6.8,13.5c3.1,4,7.1,7.2,11.7,9.4c5.6,2.4,11.6,3.5,17.7,3.4c6.4,0,12.4-1.1,16.9-3.4c4.5-2.1,8.5-5.2,11.7-9c3.1-4,5.4-8.6,6.8-13.5c1.6-5.4,2.3-11,2.3-16.6v-44h-19.9v43.8H749.4z"
						/>
						<polygon
							fill="#222222"
							points="799.8,154.7 799.8,86.2 779.9,86.2 779.9,172 779.9,172 841.2,172 841.2,154.7"
						/>
					</svg>
				</div>

				{/* Image indicators (dots) */}
				<div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
					{product.images.map((_, index) => (
						<button
							key={index}
							onClick={() => setCurrentImageIndex(index)}
							className={`h-1.5 w-1.5 cursor-pointer rounded-full transition-colors ${
								index === currentImageIndex
									? "bg-zinc-900"
									: "bg-zinc-400 hover:bg-zinc-600"
							}`}
							aria-label={`Go to image ${index + 1}`}
						/>
					))}
				</div>
			</div>

			{/* Buy button */}
			<Button
				href={product.buyUrl}
				variant="secondary"
				className="mt-2 block w-full bg-zinc-900 py-4 text-center text-base font-medium text-white transition-colors hover:bg-zinc-800"
			>
				Buy from {product.price}
			</Button>
		</div>
	);
}

export function MerchPage() {
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
				className="text-whiteno-underline absolute -left-[9999px] z-[999] rounded-br-lg bg-zinc-800 px-6 py-4 font-semibold focus:top-0 focus:left-0"
			>
				Skip to main content
			</a>

			<Navigation activePath="/merch" />
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
						}}
					/>
				</div>
			</div>

			{/* Main Content */}
			<main id="main-content" className="relative w-full pt-16">
				{/* Hero Section */}
				<section className="relative w-full bg-zinc-950 pt-16 pb-16">
					<div className="mx-auto max-w-[73.75rem] px-4">
						<div className="grid grid-cols-1 items-center lg:grid-cols-2">
							{/* Left: Text content */}
							<div className="flex flex-col gap-6 lg:pr-8">
								<h1 className="text-4xl font-semibold text-white md:text-5xl lg:text-5xl">
									Show off your{" "}
									<span
										className="relative inline-block px-4 py-1.5 font-mono"
										style={{
											background:
												"linear-gradient(to top right, rgba(40, 25, 0, 0.2) 0%, rgba(251, 191, 36, 0.1) 100%)",
											boxShadow:
												"0 0 20px rgba(251, 191, 36, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.03)",
										}}
									>
										{/* Corner brackets */}
										<span className="absolute top-0 left-0 h-3 w-3 border-t border-l border-amber-400/50" />
										<span className="absolute top-0 right-0 h-3 w-3 border-t border-r border-amber-400/50" />
										<span className="absolute bottom-0 left-0 h-3 w-3 border-b border-l border-amber-400/50" />
										<span className="absolute right-0 bottom-0 h-3 w-3 border-r border-b border-amber-400/50" />
										Effect
									</span>{" "}
									style
								</h1>
								<p className="max-w-md text-lg text-zinc-400">
									Explore a selection of Effect-branded items – designed for the
									community.
								</p>
								<div>
									<Button
										href="#products"
										variant="primary"
										size="lg"
										className="group"
									>
										View all items
										<i className="ri-corner-right-down-line" />
									</Button>
								</div>
							</div>

							{/* Right: Product preview grid - bento layout */}
							<div className="mt-8 grid grid-cols-2 grid-rows-2 gap-3 lg:mt-0">
								{/* Featured: Hoodie - spans full height on left */}
								<div className="relative row-span-2 flex items-center justify-center overflow-hidden border border-zinc-800 bg-zinc-900/40 p-6">
									<img
										src={"/assets/merch/hoodie-1.avif"}
										alt="Effect hoodie"
										className="max-h-full max-w-full object-contain"
									/>
								</div>
								{/* Cap - top right */}
								<div className="relative flex aspect-square items-center justify-center overflow-hidden p-4 transition-all duration-200 hover:shadow-lg hover:shadow-black/20">
									{/* Corner brackets */}
									<span className="absolute top-0 left-0 h-3 w-3 border-t border-l border-zinc-700/80" />
									<span className="absolute top-0 right-0 h-3 w-3 border-t border-r border-zinc-700/80" />
									<span className="absolute bottom-0 left-0 h-3 w-3 border-b border-l border-zinc-700/80" />
									<span className="absolute right-0 bottom-0 h-3 w-3 border-r border-b border-zinc-700/80" />
									<img
										src={"/assets/merch/cap-1.avif"}
										alt="Effect.orDie cap"
										className="max-h-full max-w-full object-contain"
									/>
								</div>
								{/* Tote - bottom right */}
								<div className="relative flex aspect-square items-center justify-center overflow-hidden p-4 transition-all duration-200 hover:shadow-lg hover:shadow-black/20">
									{/* Corner brackets */}
									<span className="absolute top-0 left-0 h-3 w-3 border-t border-l border-zinc-700/80" />
									<span className="absolute top-0 right-0 h-3 w-3 border-t border-r border-zinc-700/80" />
									<span className="absolute bottom-0 left-0 h-3 w-3 border-b border-l border-zinc-700/80" />
									<span className="absolute right-0 bottom-0 h-3 w-3 border-r border-b border-zinc-700/80" />
									<img
										src={"/assets/merch/tote-1.avif"}
										alt="Effect tote bag"
										className="max-h-full max-w-full object-contain"
									/>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* Products Section */}
				<section id="products" className="relative z-[70] w-full bg-zinc-100 pt-28 pb-32">
					<div className="pointer-events-none absolute inset-0 hidden lg:block">
						<div className="relative mx-auto h-full w-full max-w-[73.75rem]">
							<div className="absolute top-0 bottom-0 left-0 w-px bg-zinc-200" />
							<div className="absolute top-0 right-0 bottom-0 w-px bg-zinc-200" />
						</div>
					</div>

					<div className="mx-auto max-w-[73.75rem] px-4">
						<div className="grid grid-cols-1 gap-x-4 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
							{PRODUCTS.map((product) => (
								<ProductCard key={product.id} product={product} />
							))}
						</div>

						{/* Printful Notice */}
						<div className="mt-16 border-t border-zinc-200 pt-4 text-center">
							<p className="text-sm text-zinc-700">
								All orders are processed and fulfilled by{" "}
								<Link
									href="https://www.printful.com"
									variant="inline"
									className="text-zinc-700 hover:text-zinc-900"
								>
									Printful
								</Link>
								. Payments and profits go directly to Printful.
							</p>
						</div>
					</div>
				</section>

				{/* Effect in the Wild Section */}
				<section className="relative w-full bg-zinc-950 py-4">
					<div className="mx-auto max-w-[73.75rem] px-4">
						<div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-8">
							{/* Content */}
							<div className="flex flex-col items-start pt-16 md:pt-0">
								<p className="mb-3 font-mono text-sm font-medium tracking-wider text-zinc-400 uppercase">
									// Effect in the wild
								</p>
								<h2 className="leading-tighter text-[2.75rem] font-semibold text-zinc-200">
									Got your Effect merch?
								</h2>
								<p className="mt-4 mb-6 max-w-lg text-lg text-zinc-400">
									Share it with the community!
								</p>
								<div className="flex items-center gap-4">
									<Link
										href="https://discord.gg/effect-ts"
										variant="icon"
										aria-label="Discord"
									>
										<i className="ri-discord-fill text-2xl" />
									</Link>
									<Link
										href="https://x.com/EffectTS_"
										variant="icon"
										aria-label="X (Twitter)"
									>
										<i className="ri-twitter-x-fill text-2xl" />
									</Link>
									<Link
										href="https://www.linkedin.com/company/effectful-technologies"
										variant="icon"
										aria-label="LinkedIn"
									>
										<i className="ri-linkedin-box-fill text-2xl" />
									</Link>
									<Link
										href="https://bsky.app/profile/effect-ts.bsky.social"
										variant="icon"
										aria-label="Bluesky"
									>
										<i className="ri-bluesky-fill text-2xl" />
									</Link>
								</div>
							</div>

							{/* Image */}
							<div className="relative">
								<div className="relative h-[300px] overflow-hidden md:h-[480px] lg:h-[640px]">
									<img
										src={"/assets/merch/wild-desert.avif"}
										alt="Effect cap in the Sahara desert"
										className="h-full w-full object-cover object-bottom brightness-110"
									/>
								</div>
							</div>
						</div>
					</div>
				</section>
			</main>

			<Footer activePath="/merch" hideCommunityBorder />
		</div>
	);
}
