"use client";

import { useEffect } from "react";
import { en } from "./locales/en";
import { ru } from "./locales/ru";
import { useLocaleStore } from "./store";
import type { Locale, TranslationShape } from "./types";

const dictionaries: Record<Locale, TranslationShape<typeof en>> = {
	en,
	ru,
};

const intlLocales: Record<Locale, string> = {
	en: "en-US",
	ru: "ru-RU",
};

type PluralForms = {
	one: string;
	few: string;
	many: string;
	other: string;
};

export function useI18n() {
	const locale = useLocaleStore((state) => state.locale);
	const setLocale = useLocaleStore((state) => state.setLocale);
	const t = dictionaries[locale] ?? en;
	const intlLocale = intlLocales[locale] ?? intlLocales.en;
	const pluralRules = new Intl.PluralRules(intlLocale);

	useEffect(() => {
		document.documentElement.lang = locale;
	}, [locale]);

	const formatDate = (
		value: Date | string | number,
		options?: Intl.DateTimeFormatOptions,
	) => new Intl.DateTimeFormat(intlLocale, options).format(new Date(value));

	const formatNumber = (
		value: number,
		options?: Intl.NumberFormatOptions,
	) => new Intl.NumberFormat(intlLocale, options).format(value);

	const plural = (count: number, forms: PluralForms) => {
		const category = pluralRules.select(count);
		if (category === "one" || category === "few" || category === "many") {
			return forms[category];
		}
		return forms.other;
	};

	return {
		locale,
		setLocale,
		t,
		intlLocale,
		formatDate,
		formatNumber,
		plural,
	};
}
