import { useEffect, useState } from "react";

export function GridOverlay() {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const handleKeyPress = (e: KeyboardEvent) => {
			if (e.key === "g" || e.key === "G") {
				setIsVisible((prev) => !prev);
			}
		};

		window.addEventListener("keydown", handleKeyPress);
		return () => window.removeEventListener("keydown", handleKeyPress);
	}, []);

	if (!isVisible) return null;

	return (
		<div className="pointer-events-none fixed inset-0 z-[9999] grid-overlay px-4 md:px-8">
			<div className="mx-auto h-full w-full max-w-[73.75rem]">
				<div className="grid h-full grid-cols-12 gap-[1.25rem]">
					{Array.from({ length: 12 }).map((_, i) => (
						<div
							key={i}
							className="h-full bg-cyan-500/10 border-l border-r border-cyan-400/30"
						/>
					))}
				</div>
			</div>
		</div>
	);
}
