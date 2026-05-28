export function SystemArchitectureRibbon() {
	const nodes = [
		{ id: "input", label: "Agent Input", x: 50 },
		{ id: "runtime", label: "Effect Runtime", x: 200 },
		{ id: "parallel", label: "Parallel Tasks", x: 400, hasFork: true },
		{ id: "supervisor", label: "Error Supervisor", x: 600 },
		{ id: "result", label: "Result", x: 750 },
	];

	const lineY = 40;
	const nodeRadius = 4;

	return (
		<div
			className="pointer-events-none absolute left-0 right-0 top-12 hidden lg:block"
			style={{ opacity: 0.4 }}
		>
			<div className="mx-auto max-w-[800px]">
				<svg
					className="h-auto w-full"
					viewBox="0 0 800 80"
					xmlns="http://www.w3.org/2000/svg"
				>
					{/* Main pipeline line */}
					<line
						x1={nodes[0].x}
						y1={lineY}
						x2={nodes[nodes.length - 1].x}
						y2={lineY}
						stroke="#3f3f46"
						strokeWidth="1.5"
					/>

					{/* Fork connections for Parallel Tasks */}
					{nodes.find((n) => n.hasFork) && (
						<g>
							{/* Fork upward */}
							<line
								x1={400}
								y1={lineY}
								x2={400}
								y2={lineY - 15}
								stroke="#52525b"
								strokeWidth="1"
								opacity="0.7"
							/>
							<line
								x1={400}
								y1={lineY - 15}
								x2={450}
								y2={lineY - 15}
								stroke="#52525b"
								strokeWidth="1"
								opacity="0.7"
							/>
							{/* Small dot at fork end */}
							<circle
								cx={450}
								cy={lineY - 15}
								r={2.5}
								fill="#52525b"
								opacity="0.7"
							/>

							{/* Fork downward */}
							<line
								x1={400}
								y1={lineY}
								x2={400}
								y2={lineY + 15}
								stroke="#52525b"
								strokeWidth="1"
								opacity="0.7"
							/>
							<line
								x1={400}
								y1={lineY + 15}
								x2={450}
								y2={lineY + 15}
								stroke="#52525b"
								strokeWidth="1"
								opacity="0.7"
							/>
							{/* Small dot at fork end */}
							<circle
								cx={450}
								cy={lineY + 15}
								r={2.5}
								fill="#52525b"
								opacity="0.7"
							/>
						</g>
					)}

					{/* Nodes */}
					{nodes.map((node) => (
						<g key={node.id}>
							{/* Node circle */}
							<circle
								cx={node.x}
								cy={lineY}
								r={nodeRadius}
								fill="#52525b"
								stroke="#71717a"
								strokeWidth="1.5"
							/>

							{/* Subtle glow effect */}
							<circle
								cx={node.x}
								cy={lineY}
								r={nodeRadius + 2}
								fill="none"
								stroke="#71717a"
								strokeWidth="0.5"
								opacity="0.3"
							/>

							{/* Label */}
							<text
								x={node.x}
								y={lineY + 20}
								fontSize="10"
								fill="#a1a1aa"
								textAnchor="middle"
								fontFamily="system-ui, -apple-system, sans-serif"
								fontWeight="500"
							>
								{node.label}
							</text>
						</g>
					))}

					{/* Arrow at end */}
					<polygon
						points={`${nodes[nodes.length - 1].x + 10},${lineY} ${nodes[nodes.length - 1].x + 5},${lineY - 3} ${nodes[nodes.length - 1].x + 5},${lineY + 3}`}
						fill="#3f3f46"
					/>
				</svg>
			</div>
		</div>
	);
}
