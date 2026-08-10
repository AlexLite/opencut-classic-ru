import { en } from "./locales/en";
import { ru } from "./locales/ru";
import { editorEn } from "./locales/en/editor";
import { editorRu } from "./locales/ru/editor";
import { assetsEn } from "./locales/en/assets";
import { assetsRu } from "./locales/ru/assets";
import { timelineEn } from "./locales/en/timeline";
import { timelineRu } from "./locales/ru/timeline";
import { useLocaleStore } from "./store";
import type { Locale, TranslationShape } from "./types";

export const dictionaries: Record<Locale, TranslationShape<typeof en>> = {
	en,
	ru,
};

export const editorDictionaries: Record<
	Locale,
	TranslationShape<typeof editorEn>
> = {
	en: editorEn,
	ru: editorRu,
};

export const assetDictionaries: Record<
	Locale,
	TranslationShape<typeof assetsEn>
> = {
	en: assetsEn,
	ru: assetsRu,
};

export const timelineDictionaries: Record<
	Locale,
	TranslationShape<typeof timelineEn>
> = {
	en: timelineEn,
	ru: timelineRu,
};

export const intlLocales: Record<Locale, string> = {
	en: "en-US",
	ru: "ru-RU",
};

export function getCurrentI18n() {
	const locale = useLocaleStore.getState().locale;
	return {
		locale,
		t: dictionaries[locale] ?? en,
		editorT: editorDictionaries[locale] ?? editorEn,
		assetsT: assetDictionaries[locale] ?? assetsEn,
		timelineT: timelineDictionaries[locale] ?? timelineEn,
		intlLocale: intlLocales[locale] ?? intlLocales.en,
	};
}
