import type { Metadata } from "next";
import { getPosts } from "@/blog/query";
import { BlogContent } from "./blog-content";

export const metadata: Metadata = {
	title: "Blog - OpenCut",
	description:
		"Read the latest news and updates about OpenCut, the free and open-source video editor.",
	openGraph: {
		title: "Blog - OpenCut",
		description:
			"Read the latest news and updates about OpenCut, the free and open-source video editor.",
		type: "website",
	},
};

export default async function BlogPage() {
	const data = await getPosts().catch(() => null);
	const posts =
		data?.posts.map((post) => ({
			id: post.id,
			slug: post.slug,
			title: post.title,
			description: post.description,
		})) ?? [];

	return <BlogContent posts={posts} />;
}
