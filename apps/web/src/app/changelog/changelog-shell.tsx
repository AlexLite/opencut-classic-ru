"use client";

import type { ReactNode } from "react";
import { BasePage } from "@/app/base-page";
import { useI18n } from "@/i18n/use-i18n";

export function ChangelogShell({ children }: { children: ReactNode }) {
	const { changelogT } = useI18n();

	return (
		<BasePage
			title={changelogT.page.title}
			description={changelogT.page.description}
		>
			{children}
		</BasePage>
	);
}
