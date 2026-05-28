interface Company {
	name: string;
	logo: string;
	logoClass?: string;
	isTwoLine?: boolean;
}

const row1Companies: Company[] = [
	{
		name: "14.ai",
		logo: "/assets/logos/logo-14ai.svg",
		logoClass: "h-3 w-6",
	},
	{
		name: "OpenRouter",
		logo: "/assets/logos/logo-openrouter.png",
		logoClass: "h-4 w-4 object-cover",
	},
	{
		name: "Edge&Node",
		logo: "/assets/logos/logo-edgenode.svg",
		logoClass: "h-4 w-[13px]",
	},
	{
		name: "0.mail",
		logo: "/assets/logos/logo-0mail.png",
		logoClass: "h-4 w-4 object-cover",
	},
	{
		name: "adidas",
		logo: "/assets/logos/logo-adidas.svg",
		logoClass: "h-[14px] w-[22px]",
	},
	{
		name: "Glide",
		logo: "/assets/logos/logo-glide.svg",
		logoClass: "h-5 w-5",
	},
	{
		name: "August Health",
		logo: "/assets/logos/logo-augusthealth.svg",
		logoClass: "h-5 w-5",
	},
	{
		name: "Aware",
		logo: "/assets/logos/logo-aware.svg",
		logoClass: "h-4 w-[17px]",
	},
	{
		name: "BTP Consultants",
		logo: "/assets/logos/logo-btpconsultants.svg",
		logoClass: "h-4 w-4",
	},
];

const row2Companies: Company[] = [
	{
		name: "Ender",
		logo: "/assets/logos/logo-ender.png",
		logoClass: "h-5 w-[14px] object-contain",
	},
	{
		name: "CalcTree",
		logo: "/assets/logos/logo-calctree.svg",
		logoClass: "h-5 w-5",
	},
	{
		name: "Candle.fi",
		logo: "/assets/logos/logo-candlefi.png",
		logoClass: "h-5 w-5 object-cover",
	},
	{
		name: "CI Financial",
		logo: "/assets/logos/logo-cifinancial.png",
		logoClass: "h-4 w-4 object-contain",
	},
	{
		name: "Coralogix",
		logo: "/assets/logos/logo-coralogix.svg",
		logoClass: "h-5 w-5",
	},
	{
		name: "dectus",
		logo: "/assets/logos/logo-dectus.svg",
		logoClass: "h-5 w-[17px]",
	},
	{
		name: "dreifach.ai",
		logo: "/assets/logos/logo-dreifach-part1.svg",
		logoClass: "h-4 w-5",
	},
	{
		name: "DXOS",
		logo: "/assets/logos/logo-dxos.svg",
		logoClass: "h-5 w-5",
	},
	{
		name: "EMBEDDED INSURANCE",
		logo: "/assets/logos/logo-embedded-insurance.svg",
		logoClass: "h-[14px] w-[15px]",
		isTwoLine: true,
	},
	{
		name: "GEODIS",
		logo: "/assets/logos/logo-geodis.svg",
		logoClass: "h-5 w-5",
	},
];

const row3Companies: Company[] = [
	{
		name: "LiveStore",
		logo: "/assets/logos/logo-livestore.svg",
		logoClass: "h-5 w-4",
	},
	{
		name: "kikin",
		logo: "/assets/logos/logo-kikin.svg",
		logoClass: "h-4 w-[13px]",
	},
	{
		name: "ens labs",
		logo: "/assets/logos/logo-enslabs.svg",
		logoClass: "h-4 w-[23px]",
	},
	{
		name: "freckle",
		logo: "/assets/logos/logo-freckle.svg",
		logoClass: "h-4 w-[13px]",
	},
	{
		name: "Fortanix",
		logo: "/assets/logos/logo-fortanix.svg",
		logoClass: "h-5 w-5",
	},
	{
		name: "Gale",
		logo: "/assets/logos/logo-gale.png",
		logoClass: "h-5 w-5 object-contain",
	},
	{
		name: "GlobeCommerce",
		logo: "/assets/logos/logo-globecommerce.png",
		logoClass: "h-5 w-5 object-cover",
	},
	{
		name: "Ping Identity",
		logo: "/assets/logos/logo-pingidentity.svg",
		logoClass: "h-5 w-5",
	},
	{
		name: "IYK",
		logo: "/assets/logos/logo-iyk.png",
		logoClass: "h-[11px] w-[28px] object-cover",
	},
	{
		name: "inRev",
		logo: "/assets/logos/logo-inrev.svg",
		logoClass: "h-4 w-[16px]",
	},
];

function CompanyItem({ company }: { company: Company }) {
	return (
		<div className="flex items-center gap-2">
			<div className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900">
				<img
					src={company.logo}
					alt=""
					className={company.logoClass}
				/>
			</div>
			{company.isTwoLine ? (
				<div className="text-xs leading-tight font-semibold text-[#b5b5be]">
					<div>EMBEDDED</div>
					<div>INSURANCE</div>
				</div>
			) : (
				<span className="text-base font-semibold text-[#b5b5be]">
					{company.name}
				</span>
			)}
		</div>
	);
}

function LogoRow({
	companies,
	direction,
	top,
}: {
	companies: Company[];
	direction: "left" | "right";
	top: number;
}) {
	const animationClass =
		direction === "left" ? "logo-row-left" : "logo-row-right";

	return (
		<div
			className={`logo-row ${animationClass} absolute left-0 flex items-center gap-12 whitespace-nowrap`}
			style={{ top: `${top}px` }}
		>
			{/* First set */}
			<div className="flex items-center gap-12">
				{companies.map((company, index) => (
					<CompanyItem key={`first-${index}`} company={company} />
				))}
			</div>
			{/* Duplicate set for seamless loop */}
			<div className="flex items-center gap-12">
				{companies.map((company, index) => (
					<CompanyItem key={`second-${index}`} company={company} />
				))}
			</div>
		</div>
	);
}

export function CompaniesSection() {
	return (
		<div className="relative w-full overflow-hidden">
			{/* Background Pattern */}
			<div
				className="pointer-events-none absolute inset-0"
				style={{
					opacity: 1,
					backgroundImage: `url('${"/assets/BG-Pattern.svg"}')`,
					backgroundSize: "cover",
					backgroundPosition: "center bottom",
					backgroundRepeat: "no-repeat",
					WebkitMaskImage:
						"linear-gradient(to bottom, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 1))",
					maskImage:
						"linear-gradient(to bottom, rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 1))",
				}}
			/>

			<div className="logo-slider-container relative h-[200px] w-full overflow-hidden">
				{/* Row 1: Scroll Left */}
				<LogoRow companies={row1Companies} direction="left" top={0} />

				{/* Row 2: Scroll Right */}
				<LogoRow companies={row2Companies} direction="right" top={80} />

				{/* Row 3: Scroll Left */}
				<LogoRow companies={row3Companies} direction="left" top={160} />
			</div>
		</div>
	);
}
