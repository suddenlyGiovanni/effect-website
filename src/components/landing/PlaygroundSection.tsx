import { useRef, useState } from "react";
export function PlaygroundSection() {
	const [hasStarted, setHasStarted] = useState(false);
	const [showPlayButton, setShowPlayButton] = useState(true);
	const videoRef = useRef<HTMLVideoElement>(null);

	const handlePlayClick = () => {
		if (videoRef.current) {
			videoRef.current.play();
			setHasStarted(true);
			setShowPlayButton(false);
		}
	};

	const handleVideoClick = () => {
		if (videoRef.current) {
			if (videoRef.current.paused) {
				videoRef.current.play();
			} else {
				videoRef.current.pause();
			}
		}
	};

	const handleVideoPlay = () => {
		setHasStarted(true);
		setShowPlayButton(false);
	};

	const handleVideoEnded = () => {
		setShowPlayButton(true);
		if (videoRef.current) {
			videoRef.current.load(); // Reload video to show poster again
		}
	};

	return (
		<div className="relative mx-auto w-full px-4 pt-20 pb-16 md:px-8 md:pt-24 md:pb-24">
			{/* Solid bottom border */}
			<div
				className="absolute right-0 bottom-0 left-0 h-[1px]"
				style={{
					background: "#27272a",
				}}
			/>
			{/* Two Column Layout Container */}
			<div className="mx-auto w-full max-w-[66.5rem]">
				{/* Heading with Link */}
				<div
					className="mb-6 flex w-full items-center justify-between pb-6"
					style={{ borderBottom: "1px solid #27272a" }}
				>
					<h2 className="font-inter leading-tighter text-2xl font-semibold text-white">
						Effect Playground
					</h2>
					<a
						href="https://effect.website/play/"
						target="_blank"
						rel="noopener noreferrer"
						className="font-inter flex items-center gap-2 rounded-lg border border-zinc-600 px-4 py-2 text-base font-medium text-white transition-colors hover:border-zinc-300 hover:bg-zinc-900/50"
					>
						<span>Play</span>
						<i className="ri-arrow-right-line text-base"></i>
					</a>
				</div>
				<div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
					{/* Left Column: Video */}
					<div className="flex w-full items-center lg:w-1/2">
						<div
							className="relative w-full overflow-hidden rounded-lg border border-zinc-700"
							style={{ paddingBottom: "56.25%" }}
						>
							<video
								ref={videoRef}
								className="absolute inset-0 h-full w-full cursor-pointer"
								src={"/videos/effect-playground.mp4"}
								poster={"/assets/images/effect-playground-banner.png"}
								controls={hasStarted}
								preload="metadata"
								aria-label="Effect Playground demonstration video showing TypeScript development environment with real-time trace viewer"
								onClick={handleVideoClick}
								onPlay={handleVideoPlay}
								onEnded={handleVideoEnded}
							>
								<track kind="captions" />
								Your browser does not support the video tag.
							</video>

							{/* Custom centered play button overlay */}
							<button
								type="button"
								onClick={handlePlayClick}
								className={`absolute top-1/2 left-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm transition-all duration-500 hover:scale-110 hover:bg-black/80 ${
									showPlayButton
										? "scale-100 opacity-100"
										: "pointer-events-none scale-0 opacity-0"
								}`}
								aria-label="Play video"
							>
								<i className="ri-play-fill text-5xl text-white" />
							</button>
						</div>
					</div>

					{/* Right Column: Text Content */}
					<div className="flex w-full flex-col items-center justify-center gap-8 lg:w-1/2">
						<div className="grid grid-cols-2 gap-6">
							<p className="text-base leading-[1.35] text-zinc-300">
								TypeScript LSP & Node.js support
							</p>

							<p className="text-base leading-[1.35] text-zinc-300">
								Real-time trace viewer built-in
							</p>

							<p className="text-base leading-[1.35] text-zinc-300">
								Share & collaborate on Effect programs
							</p>

							<p className="text-base leading-[1.35] text-zinc-300">
								Built-in examples & templates
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
