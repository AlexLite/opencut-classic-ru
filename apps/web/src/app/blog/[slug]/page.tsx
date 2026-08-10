import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BasePage } from "@/app/base-page";
import Prose from "@/components/ui/prose";
import { Separator } from "@/components/ui/separator";
import { getPosts, getSinglePost, processHtmlContent } from "@/blog/query";
import type { Author } from "@/blog/types";
import { PostHeader } from "./post-header";

type PageProps = {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const slug = (await params).slug;
	const data = await getSinglePost({ slug });

	if (!data || !data.post) return {};

	return {
		title: data.post.title,
		description: data.post.description,
		twitter: {
			title: `${data.post.title}`,
			description: `${data.post.description}`,
			card: "summary_large_image",
			images: [
				{
					url: data.post.coverImage,
					width: "1200",
					height: "630",
					alt: data.post.title,
				},
			],
		},
		openGraph: {
			type: "article",
			images: [
				{
					url: data.post.coverImage,
					width: "1200",
					height: "630",
					alt: data.post.title,
				},
			],
			title: data.post.title,
			description: data.post.description,
			publishedTime: new Date(data.post.publishedAt).toISOString(),
			authors: data.post.authors.map((author: Author) => author.name),
		},
	};
}

export async function generateStaticParams() {
	const data = await getPosts();
	if (!data || !data.posts.length) return [];

	return data.posts.map((post) => ({ slug: post.slug }));
}

export default async function BlogPostPage({ params }: PageProps) {
	const slug = (await params).slug;
	const data = await getSinglePost({ slug });
	if (!data || !data.post) return notFound();

	const html = await processHtmlContent({ html: data.post.content });

	return (
		<BasePage>
			<PostHeader
				title={data.post.title}
				coverImage={data.post.coverImage}
				publishedAt={new Date(data.post.publishedAt).toISOString()}
			/>
			<Separator />
			<section>
				<Prose html={html} />
			</section>
		</BasePage>
	);
}
