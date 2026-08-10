"use client";

import Link from "next/link";
import { GitHubContributeSection } from "@/components/gitHub-contribute-section";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/i18n/use-i18n";
import { EXTERNAL_TOOLS } from "@/site/external-tools";
import { BasePage } from "../base-page";

export interface Contributor {
	id: number;
	login: string;
	avatar_url: string;
	html_url: string;
	contributions: number;
	type: string;
}

export function ContributorsContent({
	contributors,
}: {
	contributors: Contributor[];
}) {
	const { siteT, formatNumber } = useI18n();
	const contributorsT = siteT.contributors;
	const topContributors = contributors.slice(0, 2);
	const otherContributors = contributors.slice(2);
	const totalContributions = contributors.reduce(
		(sum, contributor) => sum + contributor.contributions,
		0,
	);

	return (
		<BasePage
			title={contributorsT.title}
			description={contributorsT.description}
		>
			<div className="-mt-4 flex items-center justify-center gap-8 text-sm">
				<StatItem
					value={formatNumber(contributors.length)}
					label={contributorsT.contributorsLabel}
				/>
				<StatItem
					value={formatNumber(totalContributions)}
					label={contributorsT.contributionsLabel}
				/>
			</div>

			<div className="mx-auto flex max-w-6xl flex-col gap-20">
				{topContributors.length > 0 && (
					<TopContributorsSection contributors={topContributors} />
				)}
				{otherContributors.length > 0 && (
					<AllContributorsSection contributors={otherContributors} />
				)}
				<ExternalToolsSection />
				<GitHubContributeSection
					title={contributorsT.joinTitle}
					description={contributorsT.joinDescription}
				/>
			</div>
		</BasePage>
	);
}

function StatItem({ value, label }: { value: string; label: string }) {
	return (
		<div className="flex items-center gap-2">
			<div className="bg-foreground size-2 rounded-full" />
			<span className="font-medium">{value}</span>
			<span className="text-muted-foreground">{label}</span>
		</div>
	);
}

function TopContributorsSection({
	contributors,
}: {
	contributors: Contributor[];
}) {
	const { siteT } = useI18n();
	const contributorsT = siteT.contributors;

	return (
		<div className="flex flex-col gap-10">
			<div className="flex flex-col gap-2 text-center">
				<h2 className="text-2xl font-semibold">{contributorsT.topTitle}</h2>
				<p className="text-muted-foreground">{contributorsT.topDescription}</p>
			</div>

			<div className="mx-auto flex w-full max-w-xl flex-col justify-center gap-6 md:flex-row">
				{contributors.map((contributor) => (
					<TopContributorCard key={contributor.id} contributor={contributor} />
				))}
			</div>
		</div>
	);
}

function TopContributorCard({ contributor }: { contributor: Contributor }) {
	const { siteT, formatNumber } = useI18n();
	const contributorsT = siteT.contributors;

	return (
		<Link
			href={contributor.html_url}
			target="_blank"
			rel="noopener noreferrer"
			className="w-full"
		>
			<Card>
				<CardContent className="flex flex-col gap-6 p-8 text-center">
					<Avatar className="mx-auto size-28">
						<AvatarImage
							src={contributor.avatar_url}
							alt={`${contributor.login}: ${contributorsT.avatar}`}
						/>
						<AvatarFallback className="text-lg font-semibold">
							{contributor.login.charAt(0).toUpperCase()}
						</AvatarFallback>
					</Avatar>
					<div className="flex flex-col gap-2">
						<h3 className="text-xl font-semibold">{contributor.login}</h3>
						<div className="flex items-center justify-center gap-2">
							<span className="font-medium">
								{formatNumber(contributor.contributions)}
							</span>
							<span className="text-muted-foreground">
								{contributorsT.contributionsLabel}
							</span>
						</div>
					</div>
				</CardContent>
			</Card>
		</Link>
	);
}

function AllContributorsSection({
	contributors,
}: {
	contributors: Contributor[];
}) {
	const { siteT, formatNumber } = useI18n();
	const contributorsT = siteT.contributors;

	return (
		<div className="flex flex-col gap-12">
			<div className="flex flex-col gap-2 text-center">
				<h2 className="text-2xl font-semibold">{contributorsT.allTitle}</h2>
				<p className="text-muted-foreground">{contributorsT.allDescription}</p>
			</div>

			<div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
				{contributors.map((contributor) => (
					<Link
						key={contributor.id}
						href={contributor.html_url}
						target="_blank"
						rel="noopener noreferrer"
						className="opacity-100 hover:opacity-70"
					>
						<div className="flex flex-col items-center gap-2 p-2">
							<Avatar className="size-16">
								<AvatarImage
									src={contributor.avatar_url}
									alt={`${contributor.login}: ${contributorsT.avatar}`}
								/>
								<AvatarFallback>
									{contributor.login.charAt(0).toUpperCase()}
								</AvatarFallback>
							</Avatar>
							<div className="text-center">
								<h3 className="text-sm font-medium">{contributor.login}</h3>
								<p className="text-muted-foreground text-xs">
									{formatNumber(contributor.contributions)}
								</p>
							</div>
						</div>
					</Link>
				))}
			</div>
		</div>
	);
}

function ExternalToolsSection() {
	const { siteT } = useI18n();
	const contributorsT = siteT.contributors;
	const toolDescriptions: Record<string, string> = {
		Marble: contributorsT.marbleDescription,
		Databuddy: contributorsT.databuddyDescription,
	};

	return (
		<div className="flex flex-col gap-10">
			<div className="flex flex-col gap-2 text-center">
				<h2 className="text-2xl font-semibold">
					{contributorsT.externalToolsTitle}
				</h2>
				<p className="text-muted-foreground">
					{contributorsT.externalToolsDescription}
				</p>
			</div>

			<div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2">
				{EXTERNAL_TOOLS.map((tool, index) => (
					<Link
						key={tool.url}
						href={tool.url}
						target="_blank"
						className="block"
						style={{ animationDelay: `${index * 100}ms` }}
					>
						<Card className="h-full">
							<CardContent className="flex items-center justify-center h-full flex-col gap-4 p-6 text-center">
								<tool.icon className="size-8" />
								<div className="flex flex-1 flex-col gap-2">
									<h3 className="text-lg font-semibold">{tool.name}</h3>
									<p className="text-muted-foreground text-sm">
										{toolDescriptions[tool.name] ?? tool.description}
									</p>
								</div>
							</CardContent>
						</Card>
					</Link>
				))}
			</div>
		</div>
	);
}
