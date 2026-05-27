import { Link } from "@/components/ui";
import { Footer } from "./Footer";
import { Navigation } from "./Navigation";

export function CodeOfConductPage() {
	return (
		<div className="min-h-screen bg-zinc-950 text-white">
			<Navigation activePath="/events" />

			{/* Hero Section */}
			<section className="relative pt-32 pb-16 md:pt-40 md:pb-20">
				<div className="mx-auto w-full max-w-[73.75rem] px-4">
					<Link
						href="/events/effect-days"
						variant="subtle"
						className="mb-6 inline-flex items-center gap-2"
					>
						<i className="ri-arrow-left-line" />
						Back to Effect Days
					</Link>
					<h1 className="text-4xl font-bold text-white md:text-5xl">
						Code of Conduct
					</h1>
					<p className="mt-4 max-w-2xl text-lg text-zinc-400">
						Effect Days is dedicated to providing a safe, inclusive, and
						welcoming environment for all participants.
					</p>
				</div>
			</section>

			{/* Content Section */}
			<section className="pb-24 md:pb-32">
				<div className="mx-auto w-full max-w-[73.75rem] px-4">
					<div className="max-w-3xl space-y-12">
						{/* Introduction */}
						<div className="space-y-4">
							<p className="text-base leading-relaxed text-zinc-300">
								We are committed to creating a conference experience that
								promotes learning, collaboration, and the open exchange of
								ideas. By attending Effect Days, you agree to abide by the
								following guidelines to help us achieve this goal:
							</p>
						</div>

						{/* Section 1 */}
						<div className="space-y-3">
							<h2 className="leading-tighter text-xl font-semibold text-white">
								1. Respect for all attendees
							</h2>
							<p className="text-base leading-relaxed text-zinc-400">
								Treat all participants with respect and kindness, regardless of
								their background, identity, or experience level. This includes,
								but is not limited to: age, disability, ethnicity, gender
								identity and expression, nationality, personal appearance, race,
								religion, or sexual orientation.
							</p>
						</div>

						{/* Section 2 */}
						<div className="space-y-3">
							<h2 className="leading-tighter text-xl font-semibold text-white">
								2. Inclusive and welcoming environment
							</h2>
							<p className="text-base leading-relaxed text-zinc-400">
								Strive to create an inclusive atmosphere where everyone feels
								welcome and valued. Be mindful of language and actions that
								could be exclusionary or offensive, and be open to feedback and
								learning.
							</p>
						</div>

						{/* Section 3 */}
						<div className="space-y-3">
							<h2 className="leading-tighter text-xl font-semibold text-white">
								3. Collaboration and learning
							</h2>
							<p className="text-base leading-relaxed text-zinc-400">
								Embrace the spirit of collaboration and learning. Share your
								knowledge, ask questions, and engage in constructive
								discussions. Remember that everyone is here to grow and learn
								from each other.
							</p>
						</div>

						{/* Section 4 */}
						<div className="space-y-3">
							<h2 className="leading-tighter text-xl font-semibold text-white">
								4. Privacy and consent
							</h2>
							<p className="text-base leading-relaxed text-zinc-400">
								Respect the privacy of others. Do not photograph, record, or
								share personal information about other attendees without their
								explicit consent.
							</p>
						</div>

						{/* Section 5 */}
						<div className="space-y-3">
							<h2 className="leading-tighter text-xl font-semibold text-white">
								5. Compliance with venue rules
							</h2>
							<p className="text-base leading-relaxed text-zinc-400">
								Follow all rules and guidelines of the conference venue. This
								includes adhering to safety regulations and respecting the
								property of the venue and other attendees.
							</p>
						</div>

						{/* Section 6 */}
						<div className="space-y-3">
							<h2 className="leading-tighter text-xl font-semibold text-white">
								6. Professionalism
							</h2>
							<p className="text-base leading-relaxed text-zinc-400">
								Maintain a professional demeanor at all times. Refrain from
								engaging in any form of harassment, discrimination, or
								inappropriate behavior. This includes verbal comments, physical
								actions, and electronic communications.
							</p>
						</div>

						{/* Section 7 */}
						<div className="space-y-3">
							<h2 className="leading-tighter text-xl font-semibold text-white">
								7. Reporting violations
							</h2>
							<p className="text-base leading-relaxed text-zinc-400">
								If you witness or experience any behavior that violates this
								Code of Conduct, please report it immediately to the conference
								organizers. We take all reports seriously and will take
								appropriate action to address the situation.
							</p>
							<p className="text-base leading-relaxed text-zinc-400">
								You can report issues by contacting any staff member
								(identifiable by their staff badges) or by emailing{" "}
								<Link
									href="mailto:contact@effectful.co"
									variant="inline"
								>
									contact@effectful.co
								</Link>
								.
							</p>
						</div>

						{/* Section 8 */}
						<div className="space-y-3">
							<h2 className="leading-tighter text-xl font-semibold text-white">
								8. Consequences
							</h2>
							<p className="text-base leading-relaxed text-zinc-400">
								Violations of this Code of Conduct may result in consequences
								including, but not limited to, a warning, expulsion from the
								conference without refund, or being banned from future events.
							</p>
						</div>

						{/* Section 9 */}
						<div className="space-y-3">
							<h2 className="leading-tighter text-xl font-semibold text-white">
								9. Supportive community
							</h2>
							<p className="text-base leading-relaxed text-zinc-400">
								Be an ally to those who may need support. If you see someone who
								is uncomfortable or in need of assistance, offer your help or
								alert the conference staff.
							</p>
						</div>

						{/* Section 10 */}
						<div className="space-y-3">
							<h2 className="leading-tighter text-xl font-semibold text-white">
								10. Code of conduct changes
							</h2>
							<p className="text-base leading-relaxed text-zinc-400">
								The conference organizers reserve the right to update or modify
								this Code of Conduct at any time. Any changes will be
								communicated to all attendees.
							</p>
						</div>

						{/* Closing */}
						<div className="space-y-4 border-t border-zinc-800 pt-12">
							<p className="text-base leading-relaxed text-zinc-300">
								By participating in Effect Days, you agree to abide by this Code
								of Conduct and help us create a positive and memorable
								experience for all attendees. Thank you for your cooperation and
								commitment to making this event a success.
							</p>
						</div>

						{/* Attribution */}
						<div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
							<p className="text-sm text-zinc-400">
								<span className="font-medium text-zinc-400">Attribution:</span>{" "}
								This Code of Conduct is inspired by{" "}
								<Link
									href="https://config.figma.com/coc"
									variant="inline"
									className="text-zinc-300 hover:text-white"
								>
									Config by Figma
								</Link>{" "}
								and{" "}
								<Link
									href="https://www.reason-conf.com/code-of-conduct"
									variant="inline"
									className="text-zinc-300 hover:text-white"
								>
									ReasonConf by Nikolaus Graf
								</Link>
								.
							</p>
						</div>
					</div>
				</div>
			</section>

			<Footer activePath="/events" />
		</div>
	);
}
