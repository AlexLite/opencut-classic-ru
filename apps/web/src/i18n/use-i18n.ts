"use client";

import { useEffect } from "react";
import { en } from "./locales/en";
import { editorEn } from "./locales/en/editor";
import { assetsEn } from "./locales/en/assets";
import { useLocaleStore } from "./store";
import {
	assetDictionaries,
	dictionaries,
	editorDictionaries,
	intlLocales,
} from "./runtime";

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
	const editorT = editorDictionaries[locale] ?? editorEn;
	const assetsT = assetDictionaries[locale] ?? assetsEn;
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
		editorT,
		assetsT,
		intlLocale,
		formatDate,
		formatNumber,
		plural,
	};
}
