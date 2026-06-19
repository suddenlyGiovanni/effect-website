import { useCallback, useEffect, useState } from "react";
import { Sun, Monitor, Moon, type LucideIcon } from "lucide-react";

type Theme = "light" | "dark" | "system";

function applyTheme(theme: Theme) {
	if (theme === "dark") {
		document.documentElement.classList.add("dark");
	} else if (theme === "light") {
		document.documentElement.classList.remove("dark");
	} else {
		// system
		const prefersDark = window.matchMedia(
			"(prefers-color-scheme: dark)",
		).matches;
		if (prefersDark) {
			document.documentElement.classList.add("dark");
		} else {
			document.documentElement.classList.remove("dark");
		}
	}
}

export function ThemeToggle() {
	const [theme, setTheme] = useState<Theme>("system");

	// Read stored preference on mount
	useEffect(() => {
		const stored = localStorage.getItem("theme") as Theme | null;
		if (stored === "light" || stored === "dark") {
			setTheme(stored);
		} else {
			setTheme("system");
		}
	}, []);

	// Listen for system preference changes when in system mode
	useEffect(() => {
		const mq = window.matchMedia("(prefers-color-scheme: dark)");
		const handler = () => {
			if (theme === "system") {
				applyTheme("system");
			}
		};
		mq.addEventListener("change", handler);
		return () => mq.removeEventListener("change", handler);
	}, [theme]);

	const setAndApply = useCallback((next: Theme) => {
		setTheme(next);
		applyTheme(next);
		if (next === "system") {
			localStorage.removeItem("theme");
		} else {
			localStorage.setItem("theme", next);
		}
	}, []);

	const options: { value: Theme; Icon: LucideIcon; label: string }[] = [
		{ value: "light", Icon: Sun, label: "Light" },
		{ value: "system", Icon: Monitor, label: "System" },
		{ value: "dark", Icon: Moon, label: "Dark" },
	];

	return (
		<div className="inline-flex items-center rounded-lg border border-zinc-200 bg-zinc-100 p-0.5 dark:border-zinc-800 dark:bg-zinc-900">
			{options.map((opt) => (
				<button
					key={opt.value}
					type="button"
					onClick={() => setAndApply(opt.value)}
					aria-label={opt.label}
					className={`flex items-center justify-center rounded-md px-2 py-1.5 text-sm transition-all duration-150 ${
						theme === opt.value
							? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
							: "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
					}`}
				>
					<opt.Icon size={14} />
				</button>
			))}
		</div>
	);
}
