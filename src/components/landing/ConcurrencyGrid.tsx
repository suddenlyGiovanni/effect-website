export function ConcurrencyGrid() {
	// Grid configuration
	const rows = 12;
	const cols = 16;
	const dotSize = 3;
	const spacing = 32;

	// Define execution pathways (row, col start -> row, col end)
	const pathways = [
		// Parallel execution - two paths running side by side
		{ start: [2, 2], end: [2, 14], color: "#3f3f46", type: "parallel-1" },
		{ start: [5, 2], end: [5, 14], color: "#3f3f46", type: "parallel-2" },

		// Retry path - showing a loop
		{ start: [8, 4], end: [8, 10], color: "#52525b", type: "retry" },
		{ start: [8, 10], end: [10, 10], color: "#52525b", type: "retry-curve" },
		{ start: [10, 10], end: [10, 6], color: "#52525b", type: "retry-back" },

		// Cancellation - a path that fades/terminates
		{ start: [11, 2], end: [11, 8], color: "#3f3f46", type: "cancel" },
	];

	// Helper to check if a dot is on a pathway
	const isOnPathway = (row: number, col: number) => {
		return pathways.some((path) => {
			const [startRow, startCol] = path.start;
			const [endRow, endCol] = path.end;

			// Check horizontal paths
			if (startRow === endRow && startRow === row) {
				const minCol = Math.min(startCol, endCol);
				const maxCol = Math.max(startCol, endCol);
				return col >= minCol && col <= maxCol;
			}

			// Check vertical paths
			if (startCol === endCol && startCol === col) {
				const minRow = Math.min(startRow, endRow);
				const maxRow = Math.max(startRow, endRow);
				return row >= minRow && row <= maxRow;
			}

			return false;
		});
	};

	return (
		<div
			className="pointer-events-none absolute inset-0 hidden lg:block"
			style={{ opacity: 0.35 }}
		>
			<svg
				className="h-full w-full"
				viewBox={`0 0 ${cols * spacing} ${rows * spacing}`}
				xmlns="http://www.w3.org/2000/svg"
			>
				{/* Grid dots */}
				{Array.from({ length: rows }).map((_, row) =>
					Array.from({ length: cols }).map((_, col) => {
						const isHighlighted = isOnPathway(row, col);
						return (
							<circle
								key={`${row}-${col}`}
								cx={col * spacing + spacing / 2}
								cy={row * spacing + spacing / 2}
								r={isHighlighted ? dotSize * 1.2 : dotSize}
								fill={isHighlighted ? "#52525b" : "#27272a"}
								opacity={isHighlighted ? 0.8 : 0.5}
							/>
						);
					}),
				)}

				{/* Pathway lines */}
				{pathways.map((path, index) => {
					const [startRow, startCol] = path.start;
					const [endRow, endCol] = path.end;

					const x1 = startCol * spacing + spacing / 2;
					const y1 = startRow * spacing + spacing / 2;
					const x2 = endCol * spacing + spacing / 2;
					const y2 = endRow * spacing + spacing / 2;

					// For retry curve, create a curved path
					if (path.type === "retry-curve") {
						const midX = (x1 + x2) / 2;
						const midY = (y1 + y2) / 2;
						const controlX = x2;
						const controlY = y1;

						return (
							<path
								key={`path-${index}`}
								d={`M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`}
								stroke={path.color}
								strokeWidth="1.5"
								fill="none"
								opacity="0.6"
							/>
						);
					}

					// Regular straight lines
					return (
						<line
							key={`path-${index}`}
							x1={x1}
							y1={y1}
							x2={x2}
							y2={y2}
							stroke={path.color}
							strokeWidth="1.5"
							opacity={path.type === "cancel" ? "0.4" : "0.6"}
							strokeDasharray={path.type === "cancel" ? "4 4" : undefined}
						/>
					);
				})}
			</svg>
		</div>
	);
}
