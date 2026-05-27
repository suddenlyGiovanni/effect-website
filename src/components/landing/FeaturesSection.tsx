import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { EffectAcquireReleaseExample } from "@/examples/effect-acquire-release";
import { EffectFinalizerExample } from "@/examples/effect-add-finalizer";
import { EffectAllExample } from "@/examples/effect-all";
import { EffectAllShortCircuitExample } from "@/examples/effect-all-short-circuit";
import { EffectDieExample } from "@/examples/effect-die";
import { EffectRetryExample as EffectEventuallyExample } from "@/examples/effect-eventually";
import { EffectFailExample } from "@/examples/effect-fail";
import { EffectForEachExample } from "@/examples/effect-foreach";
import { EffectOrElseExample } from "@/examples/effect-orelse";
import { EffectPartitionLickTestExample } from "@/examples/effect-partition";
import { EffectPromiseExample } from "@/examples/effect-promise";
import { EffectRaceExample } from "@/examples/effect-race";
import { EffectRaceAllExample } from "@/examples/effect-raceall";
import { EffectRepeatSpacedExample } from "@/examples/effect-repeat-spaced";
import { EffectRepeatWhileOutputExample } from "@/examples/effect-repeat-while-output";
import { EffectRetryExponentialExample } from "@/examples/effect-retry-exponential";
import { EffectRetryRecursExample } from "@/examples/effect-retry-recurs";
import { EffectSleepExample } from "@/examples/effect-sleep";
import { EffectSucceedExample } from "@/examples/effect-succeed";
import { EffectSyncExample } from "@/examples/effect-sync";
import { EffectTimeoutExample } from "@/examples/effect-timeout";
import { EffectValidateExample } from "@/examples/effect-validate";
import { EffectRefExample } from "@/examples/ref-make";
import { EffectRefConcurrentExample } from "@/examples/ref-update-and-get";
import type { ExampleComponentProps } from "@/lib/example-types";
import { getExampleMeta } from "@/lib/examples-manifest";

type TabId =
	| "concurrency"
	| "constructors"
	| "error-handling"
	| "schedule"
	| "ref-scope";

const EXAMPLE_COMPONENTS: Record<
	string,
	React.ComponentType<ExampleComponentProps>
> = {
	"effect-all": EffectAllExample,
	"effect-all-short-circuit": EffectAllShortCircuitExample,
	"effect-race": EffectRaceExample,
	"effect-raceall": EffectRaceAllExample,
	"effect-foreach": EffectForEachExample,
	"effect-succeed": EffectSucceedExample,
	"effect-die": EffectDieExample,
	"effect-fail": EffectFailExample,
	"effect-sync": EffectSyncExample,
	"effect-promise": EffectPromiseExample,
	"effect-sleep": EffectSleepExample,
	"effect-orelse": EffectOrElseExample,
	"effect-timeout": EffectTimeoutExample,
	"effect-eventually": EffectEventuallyExample,
	"effect-partition": EffectPartitionLickTestExample,
	"effect-validate": EffectValidateExample,
	"effect-retry-recurs": EffectRetryRecursExample,
	"effect-retry-exponential": EffectRetryExponentialExample,
	"effect-repeat-spaced": EffectRepeatSpacedExample,
	"effect-repeat-while-output": EffectRepeatWhileOutputExample,
	"ref-make": EffectRefExample,
	"ref-update-and-get": EffectRefConcurrentExample,
	"effect-add-finalizer": EffectFinalizerExample,
	"effect-acquire-release": EffectAcquireReleaseExample,
};

interface SubTab {
	id: string;
	label: [string, string];
}

interface TabConfig {
	label: string;
	examples?: string[];
	subTabs?: SubTab[];
}

const TAB_CONFIG: Record<TabId, TabConfig> = {
	schedule: {
		label: "Schedule",
		subTabs: [
			{ id: "effect-retry-recurs", label: ["Effect.retry", "times"] },
			{
				id: "effect-retry-exponential",
				label: ["Effect.retry", "exponential"],
			},
			{ id: "effect-repeat-spaced", label: ["Effect.repeat", "spaced"] },
			{
				id: "effect-repeat-while-output",
				label: ["Effect.repeat", "whileOutput"],
			},
		],
	},
	concurrency: {
		label: "Concurrency",
		subTabs: [
			{ id: "effect-all", label: ["Effect.all", ""] },
			{ id: "effect-race", label: ["Effect.race", ""] },
			{ id: "effect-raceall", label: ["Effect.raceAll", ""] },
			{ id: "effect-foreach", label: ["Effect.forEach", ""] },
		],
	},
	"error-handling": {
		label: "Error Handling",
		subTabs: [
			{
				id: "effect-all-short-circuit",
				label: ["Effect.all", "short-circuit"],
			},
			{ id: "effect-orelse", label: ["Effect.orElse", ""] },
			{ id: "effect-timeout", label: ["Effect.timeout", ""] },
			{ id: "effect-eventually", label: ["Effect.eventually", ""] },
			{ id: "effect-partition", label: ["Effect.partition", ""] },
			{ id: "effect-validate", label: ["Effect.validate", ""] },
		],
	},
	constructors: {
		label: "Constructors",
		subTabs: [
			{ id: "effect-succeed", label: ["Effect.succeed", ""] },
			{ id: "effect-die", label: ["Effect.die", ""] },
			{ id: "effect-fail", label: ["Effect.fail", ""] },
			{ id: "effect-sync", label: ["Effect.sync", ""] },
			{ id: "effect-promise", label: ["Effect.promise", ""] },
			{ id: "effect-sleep", label: ["Effect.sleep", ""] },
		],
	},
	"ref-scope": {
		label: "Ref & Scope",
		subTabs: [
			{ id: "ref-make", label: ["Ref.make", ""] },
			{ id: "ref-update-and-get", label: ["Ref.updateAndGet", ""] },
			{ id: "effect-add-finalizer", label: ["Effect.addFinalizer", ""] },
			{ id: "effect-acquire-release", label: ["Effect.acquireRelease", ""] },
		],
	},
};

const TAB_IDS = Object.keys(TAB_CONFIG) as TabId[];

export function FeaturesSection() {
	const [activeTab, setActiveTab] = useState<TabId>("schedule");
	const [activeSubTabPerTab, setActiveSubTabPerTab] = useState<
		Record<TabId, string>
	>({
		schedule: "effect-retry-recurs",
		concurrency: "effect-all",
		"error-handling": "effect-all-short-circuit",
		constructors: "effect-succeed",
		"ref-scope": "ref-make",
	});

	const handleSubTabChange = (subTabId: string) => {
		setActiveSubTabPerTab((prev) => ({
			...prev,
			[activeTab]: subTabId,
		}));
	};

	const activeTabIndex = useMemo(() => TAB_IDS.indexOf(activeTab), [activeTab]);

	const currentTabConfig = TAB_CONFIG[activeTab];

	// Get the current active sub-tab for this tab
	const currentActiveSubTab = useMemo(() => {
		return activeSubTabPerTab[activeTab];
	}, [activeSubTabPerTab, activeTab]);

	return (
		<section id="features" className="relative w-full py-24 md:pt-40 md:pb-24">
			{/* Header */}
			<div className="mx-auto mb-12 w-full max-w-[73.75rem] px-4">
				<p className="mb-3 font-mono text-sm font-medium tracking-wider text-zinc-400 uppercase">
					// Interactive Examples
				</p>
				<h2 className="leading-tighter text-2xl font-semibold text-white md:text-3xl">
					See Effect in action
				</h2>
			</div>

			{/* Content Container */}
			<div className="relative mx-auto max-w-295">
				{/* Tab Navigation and Content */}
				<div className="relative border-t border-r border-zinc-800 shadow-2xl shadow-black/20">
					{/* Tab Headers */}
					<div
						className="scrollbar-hide relative flex overflow-x-auto bg-zinc-950/90"
						style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
					>
						{TAB_IDS.map((tabId) => (
							<button
								key={tabId}
								onClick={() => setActiveTab(tabId)}
								className={`flex-1 shrink-0 cursor-pointer px-4 py-5 font-mono text-sm tracking-wide whitespace-nowrap uppercase transition-colors md:px-6 md:text-base ${
									activeTab === tabId
										? "font-medium text-white"
										: "leading-relaxed text-zinc-400 hover:text-white"
								}`}
							>
								{TAB_CONFIG[tabId].label}
							</button>
						))}
						{/* Sliding indicator */}
						<motion.div
							className="absolute bottom-0 h-px bg-zinc-300"
							initial={false}
							animate={{
								left: `${(activeTabIndex / TAB_IDS.length) * 100}%`,
								width: `${100 / TAB_IDS.length}%`,
							}}
							transition={{
								type: "spring",
								stiffness: 300,
								damping: 25,
								mass: 0.8,
							}}
						/>
					</div>

					{/* Tab Content */}
					<div className="w-full">
						{currentTabConfig.subTabs ? (
							<div className="flex flex-col">
								{/* Horizontal sub-tab navigation */}
								<div
									className="scrollbar-hide flex items-center gap-1 overflow-x-auto border-y border-zinc-800 bg-zinc-950 px-4 py-3"
									style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
								>
									{currentTabConfig.subTabs.map((subTab) => (
										<button
											key={subTab.id}
											onClick={() => handleSubTabChange(subTab.id)}
											className={`shrink-0 cursor-pointer rounded-md px-3 py-1.5 font-mono text-sm whitespace-nowrap transition-colors ${
												currentActiveSubTab === subTab.id
													? "bg-zinc-900 text-white"
													: "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
											}`}
										>
											{subTab.label[0]}
											{subTab.label[1] && (
												<span className="ml-1 text-zinc-400">
													({subTab.label[1]})
												</span>
											)}
										</button>
									))}
								</div>
								{/* Example component - full width */}
								<div className="p-4">
									{(() => {
										const metadata = getExampleMeta(currentActiveSubTab);
										const Component = EXAMPLE_COMPONENTS[currentActiveSubTab];
										return metadata && Component ? (
											<div className="w-full text-sm">
												<Component
													metadata={metadata}
													exampleId={currentActiveSubTab}
													index={0}
												/>
											</div>
										) : null;
									})()}
								</div>
							</div>
						) : (
							/* Grid layout for other tabs */
							<div className="grid auto-rows-fr grid-cols-1 gap-0 p-4 md:grid-cols-2">
								{currentTabConfig.examples?.map((exampleId, index) => {
									const metadata = getExampleMeta(exampleId);
									const Component = EXAMPLE_COMPONENTS[exampleId];
									return (
										<div key={exampleId} className="h-full w-full text-sm">
											{metadata && Component && (
												<Component
													metadata={metadata}
													exampleId={exampleId}
													index={index}
												/>
											)}
										</div>
									);
								})}
							</div>
						)}
					</div>
				</div>
			</div>
		</section>
	);
}
