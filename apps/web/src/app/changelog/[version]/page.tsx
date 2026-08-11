import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getReleaseByVersion, getSortedReleases } from "@/changelog/utils";
import { ReleaseDetailContent } from "./release-detail-content";

type Props = { params: Promise<{ version: string }> };

export async function generateStaticParams() {
	return getSortedReleases().map((release) => ({ version: release.version }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { version } = await params;
	const release = getReleaseByVersion({ version });
	if (!release) return {};
	return {
		title: `${release.title} (${release.version}) - OpenCut Changelog`,
		description: release.description,
	};
}

export default async function ReleaseDetailPage({ params }: Props) {
	const { version } = await params;
	const releases = getSortedReleases();
	const index = releases.findIndex((entry) => entry.version === version);
	if (index === -1) notFound();
	const release = releases[index];
	const newer = index > 0 ? releases[index - 1] : null;
	const older = index < releases.length - 1 ? releases[index + 1] : null;

	return <ReleaseDetailContent release={release} newer={newer} older={older} />;
}
