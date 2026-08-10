import type { Metadata } from "next";
import { RoadmapContent } from "./roadmap-content";

export const metadata: Metadata = {
	title: "Roadmap - OpenCut",
	description:
		"See what's coming next for OpenCut - the free, open-source video editor that respects your privacy.",
	openGraph: {
		title: "OpenCut Roadmap - What's Coming Next",
		description:
			"See what's coming next for OpenCut - the free, open-source video editor that respects your privacy.",
		type: "website",
		images: [
			{
				url: "/open-graph/roadmap.jpg",
				width: 1200,
				height: 630,
				alt: "OpenCut Roadmap",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "OpenCut Roadmap - What's Coming Next",
		description:
			"See what's coming next for OpenCut - the free, open-source video editor that respects your privacy.",
		images: ["/open-graph/roadmap.jpg"],
	},
};

export default function RoadmapPage() {
	return <RoadmapContent />;
}
