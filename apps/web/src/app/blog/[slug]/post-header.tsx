"use client";

import Image from "next/image";
import { useI18n } from "@/i18n/use-i18n";

export function PostHeader({
	title,
	coverImage,
	publishedAt,
}: {
	title: string;
	coverImage: string;
	publishedAt: string;
}) {
	const { formatDate } = useI18n();
	const formattedDate = formatDate(publishedAt, {
		day: "numeric",
		month: "long",
		year: "numeric",
	});

	return (
		<div className="flex flex-col items-center justify-center gap-8">
			<div className="flex items-center justify-center">
				<time dateTime={publishedAt}>{formattedDate}</time>
			</div>
			<h1 className="text-center text-5xl font-bold tracking-tight md:text-4xl">
				{title}
			</h1>
			{coverImage && (
				<div className="relative mt-4 aspect-video w-full overflow-hidden rounded-lg">
					<Image
						src={coverImage}
						alt={title}
						loading="eager"
						fill
						className="rounded-lg object-cover"
					/>
				</div>
			)}
		</div>
	);
}
