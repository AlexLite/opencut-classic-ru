"use client";

import { useState } from "react";
import { CheckIcon, ClipboardIcon } from "lucide-react";
import {
	getSectionTitle,
	groupAndOrderChanges,
	isSectionCollapsible,
} from "../utils";
import type { Change } from "../utils";
import { cn } from "@/utils/ui";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/use-i18n";

function localizedSectionTitle({
	type,
	sectionTitles,
}: {
	type: string;
	sectionTitles: Record<string, string>;
}) {
	return sectionTitles[type] ?? getSectionTitle({ type });
}

function buildMarkdown({
	description,
	changes,
	sectionTitles,
}: {
	description?: string;
	changes: Change[];
	sectionTitles: Record<string, string>;
}): string {
	const lines: string[] = [];

	if (description) {
		lines.push(description, "");
	}

	const { grouped, orderedTypes } = groupAndOrderChanges({ changes });

	for (const type of orderedTypes) {
		const title = localizedSectionTitle({ type, sectionTitles });
		if (isSectionCollapsible({ type })) {
			lines.push(
				buildCollapsibleMarkdownSection({
					title,
					changes: grouped[type],
				}),
				"",
			);
			continue;
		}

		lines.push(`## ${title}`);
		for (const change of grouped[type]) {
			lines.push(`- ${change.text}`);
		}
		lines.push("");
	}

	return lines.join("\n").trimEnd();
}

function buildCollapsibleMarkdownSection({
	title,
	changes,
}: {
	title: string;
	changes: Change[];
}): string {
	const bulletLines = changes.map((change) => `- ${change.text}`).join("\n");

	return `<details>\n<summary>${title}</summary>\n\n${bulletLines}\n\n</details>`;
}

export function CopyMarkdownButton({
	description,
	changes,
}: {
	description?: string;
	changes: Change[];
}) {
	const [copied, setCopied] = useState(false);
	const { changelogT } = useI18n();

	const handleCopy = async () => {
		const markdown = buildMarkdown({
			description,
			changes,
			sectionTitles: changelogT.sections as Record<string, string>,
		});
		await navigator.clipboard.writeText(markdown);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<Button
			size="sm"
			variant="text"
			onClick={handleCopy}
			className={cn(
				"flex items-center gap-1.5",
				copied && "pointer-events-none",
			)}
			title={changelogT.copyAsMarkdown}
		>
			{copied ? (
				<CheckIcon className="size-4" />
			) : (
				<ClipboardIcon className="size-4" />
			)}
			{copied ? changelogT.copied : changelogT.copyAsMarkdown}
		</Button>
	);
}
