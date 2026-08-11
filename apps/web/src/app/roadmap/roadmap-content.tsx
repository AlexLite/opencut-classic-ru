"use client";

import { BasePage } from "@/app/base-page";
import { GitHubContributeSection } from "@/components/gitHub-contribute-section";
import { Badge } from "@/components/ui/badge";
import { ReactMarkdownWrapper } from "@/components/ui/react-markdown-wrapper";
import { useI18n } from "@/i18n/use-i18n";
import { cn } from "@/utils/ui";

const LAST_UPDATED = "2026-02-25T12:00:00Z";

type StatusType = "complete" | "pending" | "default" | "info";

interface Status {
	text: string;
	type: StatusType;
}

interface RoadmapItem {
	title: string;
	description: string;
	status: Status;
}

export function RoadmapContent() {
	const { siteT, formatDate } = useI18n();
	const roadmapT = siteT.roadmap;
	const roadmapItems: RoadmapItem[] = [
		{
			title: roadmapT.items.startTitle,
			description: roadmapT.items.startDescription,
			status: { text: roadmapT.statuses.completed, type: "complete" },
		},
		{
			title: roadmapT.items.coreUiTitle,
			description: roadmapT.items.coreUiDescription,
			status: { text: roadmapT.statuses.completed, type: "complete" },
		},
		{
			title: roadmapT.items.essentialTitle,
			description: roadmapT.items.essentialDescription,
			status: { text: roadmapT.statuses.inProgress, type: "pending" },
		},
		{
			title: roadmapT.items.nativeTitle,
			description: roadmapT.items.nativeDescription,
			status: { text: roadmapT.statuses.notStarted, type: "default" },
		},
	];
	const lastUpdated = formatDate(LAST_UPDATED, {
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	return (
		<BasePage
			title={roadmapT.title}
			description={`${roadmapT.comingNext} (${roadmapT.lastUpdated}: ${lastUpdated})`}
		>
			<div className="mx-auto flex max-w-4xl flex-col gap-16">
				<div className="flex flex-col gap-6">
					{roadmapItems.map((item, index) => (
						<RoadmapItemView key={item.title} item={item} index={index} />
					))}
				</div>
				<GitHubContributeSection
					title={roadmapT.helpTitle}
					description={roadmapT.helpDescription}
				/>
			</div>
		</BasePage>
	);
}

function RoadmapItemView({ item, index }: { item: RoadmapItem; index: number }) {
	return (
		<div className="flex flex-col gap-2">
			<div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-lg font-medium">
				<span className="leading-normal select-none">{index + 1}</span>
				<h3>{item.title}</h3>
				<StatusBadge status={item.status} className="ml-1" />
			</div>
			<div className="text-foreground/70 leading-relaxed">
				<ReactMarkdownWrapper>{item.description}</ReactMarkdownWrapper>
			</div>
		</div>
	);
}

function StatusBadge({
	status,
	className,
}: {
	status: Status;
	className?: string;
}) {
	return (
		<Badge
			className={cn("shadow-none", className, {
				"bg-green-500! text-white": status.type === "complete",
				"bg-yellow-500! text-white": status.type === "pending",
				"bg-blue-500! text-white": status.type === "info",
				"bg-foreground/10! text-accent-foreground": status.type === "default",
			})}
		>
			{status.text}
		</Badge>
	);
}
