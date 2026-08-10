import type { Metadata } from "next";
import {
	ContributorsContent,
	type Contributor,
} from "./contributors-content";

export const metadata: Metadata = {
	title: "Contributors - OpenCut",
	description:
		"Meet the amazing people who contribute to OpenCut, the free and open-source video editor.",
	openGraph: {
		title: "Contributors - OpenCut",
		description:
			"Meet the amazing people who contribute to OpenCut, the free and open-source video editor.",
		type: "website",
	},
};

async function getContributors(): Promise<Contributor[]> {
	try {
		const response = await fetch(
			"https://api.github.com/repos/OpenCut-app/OpenCut/contributors?per_page=100",
			{
				headers: {
					Accept: "application/vnd.github.v3+json",
					"User-Agent": "OpenCut-Web-App",
				},
				next: { revalidate: 600 },
			},
		);

		if (!response.ok) {
			console.error("Failed to fetch contributors");
			return [];
		}

		const contributors = (await response.json()) as Contributor[];
		return contributors.filter((contributor) => contributor.type === "User");
	} catch (error) {
		console.error("Error fetching contributors:", error);
		return [];
	}
}

export default async function ContributorsPage() {
	const contributors = await getContributors();
	return <ContributorsContent contributors={contributors} />;
}
