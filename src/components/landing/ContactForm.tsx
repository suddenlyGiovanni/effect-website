import { type FormEvent, useState } from "react";
import { PARTNERS } from "../../data/partners";

export function ContactForm({ defaultPartner }: { defaultPartner?: string }) {
	const [submitted, setSubmitted] = useState(false);

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const data = new FormData(e.currentTarget);

		// Send to Formspree or similar — replace with your endpoint
		fetch("https://formspree.io/f/xpwzgkby", {
			method: "POST",
			body: data,
			headers: { Accept: "application/json" },
		}).then((res) => {
			if (res.ok) setSubmitted(true);
		});
	};

	if (submitted) {
		return (
			<div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-8 text-center md:p-12">
				<i className="ri-check-line mb-4 text-4xl text-emerald-400" />
				<h3 className="mb-2 text-xl font-bold text-white">
					Request received
				</h3>
				<p className="text-sm text-zinc-400">
					We'll review your details and put you in touch with the right
					implementation partner.
				</p>
			</div>
		);
	}

	return (
		<form
			onSubmit={handleSubmit}
			className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-8 md:p-12"
		>
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				<div>
					<label
						htmlFor="name"
						className="mb-2 block text-sm font-medium text-zinc-300"
					>
						Your name
					</label>
					<input
						type="text"
						id="name"
						name="name"
						required
						className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-zinc-500"
						placeholder="Jane Doe"
					/>
				</div>
				<div>
					<label
						htmlFor="email"
						className="mb-2 block text-sm font-medium text-zinc-300"
					>
						Work email
					</label>
					<input
						type="email"
						id="email"
						name="email"
						required
						className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-zinc-500"
						placeholder="jane@company.com"
					/>
				</div>
				<div>
					<label
						htmlFor="company"
						className="mb-2 block text-sm font-medium text-zinc-300"
					>
						Company
					</label>
					<input
						type="text"
						id="company"
						name="company"
						required
						className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-zinc-500"
						placeholder="Acme Inc."
					/>
				</div>
				<div>
					<label
						htmlFor="partner-type"
						className="mb-2 block text-sm font-medium text-zinc-300"
					>
						Type of partner needed
					</label>
					<select
						id="partner-type"
						name="partner-type"
						required
						defaultValue={defaultPartner ?? ""}
						className="w-full appearance-none rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-zinc-500"
					>
						<option value="">Select an option</option>
						{PARTNERS.map((p) => (
							<option key={p.id} value={p.name}>
								{p.name} ({p.region} &middot; {p.language})
							</option>
						))}
						<option value="not-sure">Not sure yet</option>
					</select>
				</div>
				<div className="md:col-span-2">
					<label
						htmlFor="message"
						className="mb-2 block text-sm font-medium text-zinc-300"
					>
						Tell us about your project
					</label>
					<textarea
						id="message"
						name="message"
						rows={4}
						className="w-full resize-none rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-zinc-500"
						placeholder="Briefly describe your project, team size, and what kind of help you're looking for..."
					/>
				</div>
			</div>
			<div className="mt-6">
				<button
					type="submit"
					className="cursor-pointer rounded-md bg-white px-6 py-2.5 text-sm font-medium text-zinc-950 transition-shadow hover:shadow-[0_0_20px_rgba(255,255,255,0.15)]"
				>
					Get in touch
				</button>
			</div>
		</form>
	);
}
