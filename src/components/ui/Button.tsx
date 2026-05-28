import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Unified button/link component for the Effect website.
 *
 * Variants consolidate all CTA patterns across the site into a single,
 * consistent API. Renders as `<a>` when `href` is provided, otherwise `<button>`.
 *
 * ## Variant guide
 *
 * | variant     | use case                                         |
 * |-------------|--------------------------------------------------|
 * | primary     | Main CTA — white bg, dark text                   |
 * | secondary   | Bordered ghost — dark bg, zinc border, white text |
 * | ghost       | No border/bg — text only with hover bg            |
 * | discord     | Discord-branded CTA                               |
 *
 * | size | padding          | text   |
 * |------|------------------|--------|
 * | sm   | px-4 py-2        | text-sm |
 * | md   | px-5 py-2.5      | text-sm |
 * | lg   | px-6 py-3        | text-base |
 * | xl   | px-6 py-4        | text-lg |
 */
const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:pointer-events-none disabled:opacity-50",
	{
		variants: {
			variant: {
				primary:
					"bg-white text-zinc-900 hover:bg-zinc-100 hover:shadow-[0_0_20px_rgba(255,255,255,0.15)]",
				secondary:
					"border border-zinc-700 bg-zinc-900/50 text-white hover:border-zinc-500 hover:bg-zinc-800",
				ghost:
					"text-zinc-400 hover:bg-zinc-800 hover:text-white",
				discord:
					"bg-[#5865F2] text-white hover:bg-[#4752C4]",
			},
			size: {
				sm: "px-4 py-2 text-sm",
				md: "px-5 py-2.5 text-sm",
				lg: "px-6 py-3 text-base",
				xl: "px-6 py-4 text-lg",
			},
		},
		defaultVariants: {
			variant: "secondary",
			size: "md",
		},
	},
);

type ButtonVariantProps = VariantProps<typeof buttonVariants>;

// Anchor props (when href is provided)
type ButtonAsAnchor = {
	href: string;
	children: ReactNode;
	className?: string;
} & ButtonVariantProps &
	Omit<ComponentPropsWithoutRef<"a">, "className">;

// Button props (when href is NOT provided)
type ButtonAsButton = {
	href?: never;
	children: ReactNode;
	className?: string;
} & ButtonVariantProps &
	Omit<ComponentPropsWithoutRef<"button">, "className">;

type ButtonProps = ButtonAsAnchor | ButtonAsButton;

function Button({ variant, size, className, children, ...props }: ButtonProps) {
	const classes = cn(buttonVariants({ variant, size }), className);

	if ("href" in props && props.href) {
		const { href, ...rest } = props as ButtonAsAnchor;
		const isExternal = href.startsWith("http");
		return (
			<a
				href={href}
				className={classes}
				{...(isExternal
					? { target: "_blank", rel: "noopener noreferrer" }
					: {})}
				{...rest}
			>
				{children}
			</a>
		);
	}

	return (
		<button className={classes} {...(props as ButtonAsButton)}>
			{children}
		</button>
	);
}

export { Button, buttonVariants };
export type { ButtonProps };
