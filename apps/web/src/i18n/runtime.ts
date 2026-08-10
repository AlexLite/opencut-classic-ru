import { en } from "./locales/en";
import { ru } from "./locales/ru";
import { editorEn } from "./locales/en/editor";
import { editorRu } from "./locales/ru/editor";
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
		intlLocale: intlLocales[locale] ?? intlLocales.en,
	};
}
