import { motion } from "motion/react";

interface ComplexityChartProps {
	activeFeatures: number;
}

// Chart dimensions
const CHART_WIDTH = 600;
const CHART_HEIGHT = 400;

// Starting Y positions (remember: lower Y = higher complexity in SVG)
const WITH_START_Y = 300;
const WITHOUT_START_Y = 330;

/**
 * Exponential function: y = y0 + (yEnd - y0) * (e^(k*t) - 1) / (e^k - 1)
 * where t ranges from 0 to 1 (normalized x position)
 */
function exponentialCurve(
	t: number,
	y0: number,
	yEnd: number,
	k: number,
): number {
	if (t <= 0) return y0;
	if (t >= 1) return yEnd;
	const expK = Math.exp(k);
	return y0 + ((yEnd - y0) * (Math.exp(k * t) - 1)) / (expK - 1);
}

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

/** Build a two-segment cubic bezier path using Hermite (slope-based) control points */
function buildTwoSegmentBezier(
	x0: number,
	y0: number,
	m0: number,
	x1: number,
	y1: number,
	m1: number,
	x2: number,
	y2: number,
	m2: number,
): string {
	const h0 = Math.max(1e-3, x1 - x0);
	const h1 = Math.max(1e-3, x2 - x1);

	const cp1x = x0 + h0 / 3;
	const cp1y = y0 + m0 * (h0 / 3);
	const cp2x = x1 - h0 / 3;
	const cp2y = y1 - m1 * (h0 / 3);

	const cp3x = x1 + h1 / 3;
	const cp3y = y1 + m1 * (h1 / 3);
	const cp4x = x2 - h1 / 3;
	const cp4y = y2 - m2 * (h1 / 3);

	return `M ${x0} ${y0} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x1} ${y1} C ${cp3x} ${cp3y}, ${cp4x} ${cp4y}, ${x2} ${y2}`;
}

/**
 * Generate cubic bezier control points for a smooth curve through points
 * Uses a better algorithm that ensures C1 continuity (smooth first derivative)
 */
function generateBezierPath(
	points: Array<{ x: number; y: number }>,
	segments: number = 2,
): string {
	if (points.length < 2) return "";
	if (points.length === 2) {
		// Simple linear segment
		return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
	}

	const path: string[] = [];
	const numSegments = Math.min(segments, points.length - 1);

	// Calculate tangents (slopes) at each point for smooth curves
	const tangents: number[] = [];
	for (let i = 0; i < points.length; i++) {
		if (i === 0) {
			// First point: use forward difference
			tangents[i] =
				(points[i + 1].y - points[i].y) / (points[i + 1].x - points[i].x);
		} else if (i === points.length - 1) {
			// Last point: use backward difference
			tangents[i] =
				(points[i].y - points[i - 1].y) / (points[i].x - points[i - 1].x);
		} else {
			// Middle points: use average of forward and backward differences
			const forward =
				(points[i + 1].y - points[i].y) / (points[i + 1].x - points[i].x);
			const backward =
				(points[i].y - points[i - 1].y) / (points[i].x - points[i - 1].x);
			tangents[i] = (forward + backward) / 2;
		}
	}

	// Generate bezier segments
	for (let i = 0; i < numSegments; i++) {
		const p0 = points[i];
		const p1 = points[i + 1];
		const m0 = tangents[i];
		const m1 = tangents[i + 1];

		const dx = p1.x - p0.x;
		const dy = p1.y - p0.y;

		// Calculate control points ensuring smooth transition
		// Control points are positioned at 1/3 and 2/3 along x-axis
		const cp1x = p0.x + dx / 3;
		const cp1y = p0.y + (m0 * dx) / 3;
		const cp2x = p1.x - dx / 3;
		const cp2y = p1.y - (m1 * dx) / 3;

		if (i === 0) {
			path.push(`M ${p0.x} ${p0.y}`);
		}
		path.push(`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`);
	}

	return path.join(" ");
}

/**
 * Generate exponential curve path for "without effect" line
 */
function generateExponentialPath(features: number): string {
	const maxFeatures = 5;
	const rawXEnd = CHART_WIDTH * (features / maxFeatures);
	const xEnd = Math.max(1, rawXEnd); // avoid degenerate segments

	// End Y values for exponential growth (lower Y = higher complexity)
	// Values closer to 0 = higher on the chart = more complexity
	const endYValues = [328, 310, 260, 160, 60, 10];
	const yEnd = endYValues[features] ?? endYValues[5];

	// Exponential factor - higher k = steeper acceleration at the end
	const kValues = [1.0, 1.5, 2.2, 3.0, 4.0, 5.0];
	const k = kValues[features] ?? kValues[5];

	// Choose mid at ~58% for a pleasant shape (matches original feel)
	const tMid = 0.58;
	const x0 = 0;
	const x1 = xEnd * tMid;
	const x2 = xEnd;

	const y0 = WITHOUT_START_Y;
	const y1 = exponentialCurve(tMid, y0, yEnd, k);
	const y2 = yEnd;

	const expK = Math.exp(k);
	const slopeAt = (t: number) =>
		((yEnd - y0) * k * Math.exp(k * t)) / ((expK - 1) * xEnd);

	const m0 = slopeAt(0);
	const m1 = slopeAt(tMid);
	// Amplify the end slope significantly to ensure the curve keeps accelerating upward visually
	const m2 = slopeAt(1) * 3;

	return buildTwoSegmentBezier(x0, y0, m0, x1, y1, m1, x2, y2, m2);
}

/**
 * Linear function: y = y0 + (yEnd - y0) * t
 */
function linearCurve(t: number, y0: number, yEnd: number): number {
	return y0 + (yEnd - y0) * t;
}

/**
 * Generate linear curve path for "with effect" line
 */
function generateLinearPath(features: number): string {
	const maxFeatures = 5;
	const rawXEnd = CHART_WIDTH * (features / maxFeatures);
	const xEnd = Math.max(1, rawXEnd);

	// End Y values for linear growth (slight increase in complexity)
	const endYValues = [298, 294, 288, 274, 260, 240];
	const yEnd = endYValues[features] ?? endYValues[5];

	const tMid = 0.58;
	const x0 = 0;
	const x1 = xEnd * tMid;
	const x2 = xEnd;

	const y0 = WITH_START_Y;
	const y1 = linearCurve(tMid, y0, yEnd);
	const y2 = yEnd;

	const m = (yEnd - y0) / xEnd; // constant slope
	const m0 = m;
	const m1 = m;
	const m2 = m;

	return buildTwoSegmentBezier(x0, y0, m0, x1, y1, m1, x2, y2, m2);
}

export function ComplexityChart({ activeFeatures }: ComplexityChartProps) {
	const targetWithPath = generateLinearPath(activeFeatures);
	const targetWithoutPath = generateExponentialPath(activeFeatures);

	// Reveal width advances a fixed step per active feature (static chart under wipe)
	const revealWidth = Math.max(0, Math.min(600, (activeFeatures / 5) * 600));

	return (
		<div className="relative aspect-[618/348] w-full" id="complexity-chart">
			<svg
				role="img"
				aria-labelledby="chart-title chart-desc"
				width="100%"
				height="100%"
				viewBox="-2 -2 604 404"
				preserveAspectRatio="none"
				style={{
					transform: "translateZ(0)",
					backfaceVisibility: "hidden",
				}}
			>
				<title id="chart-title">Complexity at Scale Comparison Chart</title>
				<desc id="chart-desc">
					A line chart comparing code complexity growth as the features increase
					over time. The red line labeled "Without Effect" shows exponential
					growth reaching high complexity. The green line labeled "With Effect"
					shows linear growth staying at low complexity, demonstrating Effect's
					ability to manage complexity at scale.
				</desc>
				<defs>
					<linearGradient
						id="chartBgGradient"
						x1="0%"
						y1="100%"
						x2="100%"
						y2="0%"
					>
						<stop
							offset="0%"
							style={{ stopColor: "#09090b", stopOpacity: 1 }}
						/>
						<stop
							offset="100%"
							style={{ stopColor: "#18181b", stopOpacity: 0.3 }}
						/>
					</linearGradient>
					{/* Reveal clipPath - grows with activeFeatures */}
					<clipPath id="revealClip" clipPathUnits="userSpaceOnUse">
						<motion.rect
							x="0"
							y="0"
							height="400"
							animate={{ width: revealWidth }}
							transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
						/>
					</clipPath>
				</defs>

				{/* Horizontal Grid Lines */}
				<g>
					{[0, 133.33, 266.67, 400].map((y, i) => (
						<line
							key={`h-${y}`}
							x1="0"
							y1={y}
							x2="600"
							y2={y}
							stroke={
								i === 3
									? "rgba(255, 255, 255, 0.3)"
									: "rgba(255, 255, 255, 0.1)"
							}
							strokeWidth="1"
						/>
					))}
				</g>

				{/* Vertical Grid Lines */}
				<g>
					{[0, 150, 300, 450, 600].map((x, i) => (
						<line
							key={`v-${x}`}
							x1={x}
							y1="0"
							x2={x}
							y2="400"
							stroke="rgba(255, 255, 255, 0.1)"
							strokeWidth="1"
						/>
					))}
				</g>

				{/* Background Gradient Rectangle */}
				<rect
					x="0"
					y="0"
					width="600"
					height="400"
					fill="url(#chartBgGradient)"
					stroke="rgba(255, 255, 255, 0.1)"
					strokeWidth="1"
				/>

				{/* Axis labels */}
				<text
					x="12"
					y="54"
					fill="white"
					fontSize="13"
					fontFamily="'Roboto Mono'"
					fontWeight="500"
					textAnchor="middle"
					transform="rotate(-90 10 50)"
					opacity="0.6"
					letterSpacing="0.6"
				>
					COMPLEXITY
				</text>
				<text
					x="564"
					y="392"
					fill="white"
					fontSize="13"
					fontFamily="'Roboto Mono'"
					fontWeight="500"
					textAnchor="middle"
					opacity="0.6"
					letterSpacing="0.3"
				>
					FEATURES
				</text>

				{/* Lines group - clipped by reveal width that advances per feature */}
				<g clipPath="url(#revealClip)">
					{/* Without Effect line (red, solid) */}
					<motion.path
						id="line-without"
						d={targetWithoutPath}
						stroke="#ef4444"
						strokeWidth="2"
						fill="none"
						strokeLinecap="round"
						strokeLinejoin="round"
						shapeRendering="geometricPrecision"
						animate={{ d: targetWithoutPath }}
						transition={{ d: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } }}
					/>

					{/* With Effect line (green, solid) */}
					<motion.path
						id="line-with"
						d={targetWithPath}
						stroke="#22c55e"
						strokeWidth="2"
						fill="none"
						strokeLinecap="round"
						strokeLinejoin="round"
						shapeRendering="geometricPrecision"
						animate={{ d: targetWithPath }}
						transition={{ d: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } }}
					/>
				</g>

				{/* Corner decorations */}
				<line
					x1="0"
					y1="0"
					x2="12.754"
					y2="0"
					stroke="rgba(255,255,255,0.3)"
					strokeWidth="1"
				/>
				<line
					x1="0"
					y1="0"
					x2="0"
					y2="12.754"
					stroke="rgba(255,255,255,0.3)"
					strokeWidth="1"
				/>
				<line
					x1="600"
					y1="0"
					x2="587.246"
					y2="0"
					stroke="rgba(255,255,255,0.3)"
					strokeWidth="1"
				/>
				<line
					x1="600"
					y1="0"
					x2="600"
					y2="12.754"
					stroke="rgba(255,255,255,0.3)"
					strokeWidth="1"
				/>
				<line
					x1="0"
					y1="400"
					x2="12.754"
					y2="400"
					stroke="rgba(255,255,255,0.4)"
					strokeWidth="1"
				/>
				<line
					x1="0"
					y1="400"
					x2="0"
					y2="387.246"
					stroke="rgba(255,255,255,0.3)"
					strokeWidth="1"
				/>
				<line
					x1="600"
					y1="400"
					x2="587.246"
					y2="400"
					stroke="rgba(255,255,255,0.4)"
					strokeWidth="1"
				/>
				<line
					x1="600"
					y1="400"
					x2="600"
					y2="387.246"
					stroke="rgba(255,255,255,0.3)"
					strokeWidth="1"
				/>
			</svg>
		</div>
	);
}
