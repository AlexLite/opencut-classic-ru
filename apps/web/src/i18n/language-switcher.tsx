"use client";

import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "./use-i18n";

export function LanguageSwitcher() {
	const { locale, setLocale, t } = useI18n();
	const nextLocale = locale === "ru" ? "en" : "ru";
	const currentLanguage =
		locale === "ru" ? t.language.russian : t.language.english;

	return (
		<Button
			variant="ghost"
			size="sm"
			className="gap-1.5 px-2"
			onClick={() => setLocale(nextLocale)}
			aria-label={`${t.language.label}: ${currentLanguage}`}
			title={`${t.language.label}: ${currentLanguage}`}
		>
			<Languages className="size-4" />
			<span className="text-xs font-medium uppercase">{locale}</span>
		</Button>
	);
}
