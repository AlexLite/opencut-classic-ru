"use client";

import Link from "next/link";
import { BasePage } from "@/app/base-page";
import { Separator } from "@/components/ui/separator";
import { useI18n } from "@/i18n/use-i18n";

export interface BlogListPost {
	id: string;
	slug: string;
	title: string;
	description: string;
}

export function BlogContent({ posts }: { posts: BlogListPost[] }) {
	const { siteT } = useI18n();
	const t = siteT.blog;

	return (
		<BasePage title={t.title} description={t.description}>
			{posts.length === 0 ? (
				<p className="text-muted-foreground text-center">{t.noPosts}</p>
			) : (
				<div className="flex flex-col">
					{posts.map((post) => (
						<div key={post.id} className="flex flex-col">
							<Link href={`/blog/${post.slug}`}>
								<div className="flex h-auto w-full items-center justify-between py-6 opacity-100 hover:opacity-75">
									<div className="flex flex-col gap-2">
										<h2 className="text-xl font-semibold">{post.title}</h2>
										<p className="text-muted-foreground">{post.description}</p>
									</div>
								</div>
							</Link>
							<Separator />
						</div>
					))}
				</div>
			)}
		</BasePage>
	);
}
