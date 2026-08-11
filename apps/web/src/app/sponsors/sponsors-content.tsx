"use client";

import Image from "next/image";
import Link from "next/link";
import { BasePage } from "@/app/base-page";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/i18n/use-i18n";
import { SPONSORS, type Sponsor } from "@/site/sponsors";
import { HugeiconsIcon } from "@hugeicons/react";
import { LinkSquare02Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/utils/ui";

export function SponsorsContent() {
	const { siteT } = useI18n();
	const sponsorsT = siteT.sponsors;

	return (
		<BasePage>
			<div className="flex flex-col gap-8 text-center">
				<h1 className="text-5xl font-bold tracking-tight md:text-6xl">
					{sponsorsT.title}
				</h1>
				<p className="text-muted-foreground mx-auto max-w-2xl text-xl leading-relaxed text-pretty">
					{sponsorsT.description}
				</p>
			</div>
			<div className="grid gap-6 sm:grid-cols-2">
				{SPONSORS.map((sponsor) => (
					<SponsorCard key={sponsor.name} sponsor={sponsor} />
				))}
			</div>
		</BasePage>
	);
}

function SponsorCard({ sponsor }: { sponsor: Sponsor }) {
	const { siteT } = useI18n();
	const sponsorsT = siteT.sponsors;
	const descriptions: Record<string, string> = {
		"Fal.ai": sponsorsT.falDescription,
		Vercel: sponsorsT.vercelDescription,
	};

	return (
		<Link
			href={sponsor.url}
			target="_blank"
			rel="noopener noreferrer"
			className="size-full"
		>
			<Card className="h-full">
				<CardContent className="flex h-full flex-col justify-center gap-8 p-8">
					<Image
						src={sponsor.logo}
						alt={`${sponsor.name} ${sponsorsT.logo}`}
						width={50}
						height={50}
						className={cn(
							"object-contain",
							sponsor.invertOnDark && "invert-0 dark:invert",
						)}
					/>
					<div className="flex flex-col gap-2">
						<div className="flex items-center gap-2">
							<h3 className="text-xl font-semibold group-hover:underline">
								{sponsor.name}
							</h3>
							<HugeiconsIcon
								icon={LinkSquare02Icon}
								className="text-muted-foreground size-4"
							/>
						</div>
						<p className="text-muted-foreground">
							{descriptions[sponsor.name] ?? sponsor.description}
						</p>
					</div>
				</CardContent>
			</Card>
		</Link>
	);
}
