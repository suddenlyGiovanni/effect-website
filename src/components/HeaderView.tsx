import {
	ArrowCounterClockwiseIcon,
	CheckIcon,
	LinkIcon,
	PlayIcon,
	StopIcon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { memo, useCallback, useEffect, useState } from "react";
import { GLOW_COLORS, TASK_COLORS } from "@/constants/colors";
import { useOptionKey } from "@/hooks/useOptionKey";
import { taskSounds } from "@/sounds/TaskSounds";
import { useVisualEffectSubscription, type VisualEffect } from "@/VisualEffect";
import type { VisualRef } from "@/VisualRef";

interface HeaderViewProps<A, E> {
	effect: VisualEffect<A, E>;
	name: string;
	variant?: string;
	description?: React.ReactNode;
	refs?: Array<VisualRef<unknown>>;
	exampleId: string;
}

function HeaderViewComponent({
	description,
	exampleId,
	name,
	refs = [],
	effect: task,
	variant,
}: HeaderViewProps<unknown, unknown>) {
	const [isHovered, setIsHovered] = useState(false);
	const [isPressed, setIsPressed] = useState(false);
	const [showCheckmark, setShowCheckmark] = useState(false);
	const [hasPlayedHoverSound, setHasPlayedHoverSound] = useState(false);
	const isOptionPressed = useOptionKey();
	useVisualEffectSubscription(task);
	const { state } = task;

	const isRunning = state.type === "running";
	const isCompleted = state.type === "completed";
	const isFailed = state.type === "failed";
	const isInterrupted = state.type === "interrupted";
	const isDeath = state.type === "death";
	const isIdle = state.type === "idle";
	const canReset = isCompleted || isFailed || isInterrupted || isDeath;

	const runWithDependencies = useCallback(async () => {
		await task.run();
	}, [task]);

	const resetWithDependencies = useCallback(() => {
		task.reset();
		// Also reset refs passed in
		refs.forEach((refItem) => {
			refItem.reset();
		});
		// Play reset sound
		taskSounds.playReset();
	}, [task, refs]);

	const handleAction = useCallback(() => {
		// If Option is pressed and we have an exampleId, copy link
		if (isOptionPressed && exampleId) {
			const url = `${window.location.origin}/visual-effect/${exampleId}`;
			navigator.clipboard.writeText(url).then(() => {
				setShowCheckmark(true);
				// Play copy success sound
				taskSounds.playLinkCopied();
				// Hide checkmark after 1.5 seconds
				setTimeout(() => {
					setShowCheckmark(false);
				}, 1500);
			});
			return;
		}

		const currentState = task.state;
		const running = currentState.type === "running";
		const resettable =
			currentState.type === "completed" ||
			currentState.type === "failed" ||
			currentState.type === "interrupted" ||
			currentState.type === "death";

		if (running) {
			task.interrupt();
		} else if (resettable) {
			resetWithDependencies();
		} else {
			runWithDependencies();
		}
	}, [
		task,
		resetWithDependencies,
		runWithDependencies,
		isOptionPressed,
		exampleId,
	]);

	const getIcon = () => {
		// Show checkmark after copying
		if (showCheckmark) {
			return (
				<motion.div
					key="check"
					initial={{ scale: 0, rotate: -180, filter: "blur(10px)" }}
					animate={{ scale: 1, rotate: 0, filter: "blur(0px)" }}
					exit={{ scale: 0, rotate: 180, filter: "blur(10px)" }}
					transition={{ type: "spring", stiffness: 300, damping: 20 }}
				>
					<CheckIcon size={24} weight="bold" />
				</motion.div>
			);
		}

		// Show link icon when Option is pressed AND hovering
		if (isOptionPressed && isHovered && exampleId) {
			return (
				<motion.div
					key="link"
					initial={{ scale: 0, rotate: -180, filter: "blur(10px)" }}
					animate={{ scale: 1, rotate: 0, filter: "blur(0px)" }}
					exit={{ scale: 0, rotate: 180, filter: "blur(10px)" }}
					transition={{ type: "spring", stiffness: 300, damping: 20 }}
				>
					<LinkIcon size={24} weight="bold" />
				</motion.div>
			);
		}

		if (isHovered) {
			if (isRunning) {
				return (
					<motion.div
						key="stop"
						initial={{ scale: 0, rotate: -180, filter: "blur(10px)" }}
						animate={{ scale: 1, rotate: 0, filter: "blur(0px)" }}
						exit={{ scale: 0, rotate: 180, filter: "blur(10px)" }}
						transition={{ type: "spring", stiffness: 300, damping: 20 }}
					>
						<StopIcon size={24} weight="fill" />
					</motion.div>
				);
			} else if (canReset) {
				return (
					<motion.div
						key="reset"
						initial={{ scale: 0, rotate: -180, filter: "blur(10px)" }}
						animate={{ scale: 1, rotate: 0, filter: "blur(0px)" }}
						exit={{ scale: 0, rotate: 180, filter: "blur(10px)" }}
						transition={{ type: "spring", stiffness: 300, damping: 20 }}
					>
						<ArrowCounterClockwiseIcon size={24} weight="bold" />
					</motion.div>
				);
			} else {
				return (
					<motion.div
						key="play"
						initial={{ scale: 0, rotate: -180, filter: "blur(10px)" }}
						animate={{ scale: 1, rotate: 0, filter: "blur(0px)" }}
						exit={{ scale: 0, rotate: 180, filter: "blur(10px)" }}
						transition={{ type: "spring", stiffness: 300, damping: 20 }}
					>
						<PlayIcon size={20} weight="fill" />
					</motion.div>
				);
			}
		}

		// Default: show play icon when idle
		return (
			<motion.div
				key="play-default"
				initial={{ scale: 0.8, opacity: 0, filter: "blur(4px)" }}
				animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
				exit={{ scale: 0.8, opacity: 0, filter: "blur(4px)" }}
				transition={{
					duration: 0.3,
					ease: "easeOut",
				}}
			>
				<PlayIcon size={20} weight="fill" />
			</motion.div>
		);
	};

	// Play hover sound effect when Option is pressed and hovering
	useEffect(() => {
		if (isOptionPressed && isHovered && exampleId && !hasPlayedHoverSound) {
			taskSounds.playLinkHover();
			setHasPlayedHoverSound(true);
		} else if (!isOptionPressed || !isHovered) {
			setHasPlayedHoverSound(false);
		}
	}, [isOptionPressed, isHovered, exampleId, hasPlayedHoverSound]);

	return (
		<motion.div
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			onMouseDown={() => setIsPressed(true)}
			onMouseUp={() => setIsPressed(false)}
			onClick={handleAction}
			initial={{
				backgroundColor: "rgba(255, 255, 255, 0)",
			}}
			animate={{
				backgroundColor: isHovered
					? "rgba(255, 255, 255, 0.05)"
					: "rgba(255, 255, 255, 0)",
			}}
			transition={{
				backgroundColor: { duration: 0.15, ease: "easeOut" },
			}}
			className="-m-2 flex cursor-pointer items-start gap-3 rounded-lg p-2"
		>
			<motion.div
				animate={{
					scale: isPressed ? 0.95 : isHovered ? 1.05 : 1,
					background: showCheckmark
						? "#4f46e5" // indigo-600 for success state
						: isOptionPressed && isHovered && exampleId
							? "#6366f1" // indigo-500 for link copy mode
							: isRunning
								? TASK_COLORS.running
								: isInterrupted
									? TASK_COLORS.interrupted
									: isCompleted
										? TASK_COLORS.success
										: isFailed
											? TASK_COLORS.error
											: isDeath
												? TASK_COLORS.death
												: "#16a34a", // green-600 for idle
				}}
				transition={{
					scale: { type: "spring", stiffness: 300, damping: 20 },
					background: { duration: 0.2, ease: "easeInOut" },
				}}
				className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border border-zinc-500 text-white"
			>
				<AnimatePresence mode="popLayout">{getIcon()}</AnimatePresence>

				{isRunning && (
					<motion.div
						className="absolute -inset-0.5 -z-10"
						style={{
							background: `radial-gradient(circle, ${GLOW_COLORS.running} 0%, transparent 70%)`,
						}}
						animate={{
							scale: [1, 1.3, 1],
							opacity: [0.5, 0, 0.5],
						}}
						transition={{
							duration: 2,
							repeat: Infinity,
							ease: "easeInOut",
						}}
					/>
				)}

				{/* Glow effect for link copy mode */}
				{isOptionPressed && isHovered && exampleId && !showCheckmark && (
					<motion.div
						className="absolute -inset-0.5 -z-10"
						style={{
							background: `radial-gradient(circle, #6366f1 0%, transparent 70%)`,
						}}
						animate={{
							scale: [1, 1.2, 1],
							opacity: [0.3, 0.1, 0.3],
						}}
						transition={{
							duration: 1.5,
							repeat: Infinity,
							ease: "easeInOut",
						}}
					/>
				)}

				{/* Glow effect for success checkmark */}
				{showCheckmark && (
					<motion.div
						className="absolute -inset-0.5 -z-10"
						style={{
							background: `radial-gradient(circle, #4f46e5 0%, transparent 70%)`,
						}}
						animate={{
							scale: [1, 1.4, 1],
							opacity: [0.6, 0, 0.6],
						}}
						transition={{
							duration: 1,
							repeat: Infinity,
							ease: "easeInOut",
						}}
					/>
				)}
			</motion.div>

			<div className="flex flex-1 flex-col gap-1">
				<div className="flex items-start justify-between">
					<h2 className="leading-tighter flex items-baseline gap-2 font-mono text-base font-semibold text-white">
						<span>{name}</span>
						{variant && (
							<span className="font-medium text-neutral-400">{variant}</span>
						)}
					</h2>
					{/* Static label on the right */}
					{isIdle && (
						<span className="-mt-1 font-mono text-xs text-zinc-400">
							Click to run an Effect
						</span>
					)}
					{canReset && (
						<span className="-mt-1 font-mono text-xs text-zinc-400">
							Click to reset
						</span>
					)}
					{isRunning && (
						<span className="-mt-1 font-mono text-xs text-zinc-400">
							Click to stop
						</span>
					)}
				</div>
				{description && (
					<p className="text-sm leading-4 text-neutral-400">{description}</p>
				)}
			</div>
		</motion.div>
	);
}

export const HeaderView = memo(
	HeaderViewComponent,
) as typeof HeaderViewComponent;
