"use client";

import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { BasePage } from "@/app/base-page";
import type { Release as ReleaseType } from "@/changelog/utils";
import {
	ReleaseArticle,
	ReleaseMeta,
	ReleaseTitle,
	ReleaseDescription,
	ReleaseChanges,
} from "@/changelog/components/release";
import { CopyMarkdownButton } from "@/changelog/components/copy-markdown-button";
import { useI18n } from "@/i18n/use-i18n";

export function ReleaseDetailContent({
	release,
	newer,
	older,
}: {
	release: ReleaseType;
	newer: ReleaseType | null;
	older: ReleaseType | null;
}) {
	const { changelogT } = useI18n();

	return (
		<BasePage>
			<div className="mx-auto w-full max-w-3xl flex flex-col gap-12">
				<Link
					href="/changelog"
					className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 w-fit"
				>
					<ChevronLeftIcon className="size-4" />
					{changelogT.page.allReleases}
				</Link>

				<ReleaseArticle variant="detail">
					<div className="flex flex-col gap-4">
						<div className="flex items-center justify-between">
							<ReleaseMeta release={release} />
							<CopyMarkdownButton
								description={release.description}
								changes={release.changes}
							/>
						</div>
						<ReleaseTitle as="h1">{release.title}</ReleaseTitle>
						{release.description && (
							<ReleaseDescription>{release.description}</ReleaseDescription>
						)}
					</div>
					<ReleaseChanges release={release} />
				</ReleaseArticle>

				<nav className="flex items-center justify-between border-t pt-8">
					{older ? (
						<Link
							href={`/changelog/${older.version}`}
							className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground group"
						>
							<ChevronLeftIcon className="size-4" />
							<div className="flex flex-col">
								<span className="text-xs text-muted-foreground/60">
									{changelogT.page.older}
								</span>
								<span className="font-medium">{older.title}</span>
							</div>
						</Link>
					) : (
						<div />
					)}
					{newer ? (
						<Link
							href={`/changelog/${newer.version}`}
							className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground group text-right"
						>
							<div className="flex flex-col">
								<span className="text-xs text-muted-foreground/60">
									{changelogT.page.newer}
								</span>
								<span className="font-medium">{newer.title}</span>
							</div>
							<ChevronRightIcon className="size-4" />
						</Link>
					) : (
						<div />
					)}
				</nav>
			</div>
		</BasePage>
	);
}
