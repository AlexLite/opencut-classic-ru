import type { Metadata } from "next";
import { SponsorsContent } from "./sponsors-content";

export const metadata: Metadata = {
	title: "Sponsors - OpenCut",
	description:
		"Support OpenCut and help us build the future of free and open-source video editing.",
	openGraph: {
		title: "Sponsors - OpenCut",
		description:
			"Support OpenCut and help us build the future of free and open-source video editing.",
		type: "website",
	},
};

export default function SponsorsPage() {
	return <SponsorsContent />;
}
