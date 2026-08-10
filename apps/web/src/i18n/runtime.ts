import { en } from "./locales/en";
import { ru } from "./locales/ru";
import { editorEn } from "./locales/en/editor";
import { editorRu } from "./locales/ru/editor";
import { assetsEn } from "./locales/en/assets";
import { assetsRu } from "./locales/ru/assets";
import { timelineEn } from "./locales/en/timeline";
import { timelineRu } from "./locales/ru/timeline";
import { previewEn } from "./locales/en/preview";
import { previewRu } from "./locales/ru/preview";
import { changelogEn } from "./locales/en/changelog";
import { changelogRu } from "./locales/ru/changelog";
import { siteEn } from "./locales/en/site";
import { siteRu } from "./locales/ru/site";
import { legalEn } from "./locales/en/legal";
import { legalRu } from "./locales/ru/legal";
import { uiEn } from "./locales/en/ui";
import { uiRu } from "./locales/ru/ui";
import { propertiesEn } from "./locales/en/properties";
import { propertiesRu } from "./locales/ru/properties";
import { useLocaleStore } from "./store";
import type { Locale, TranslationShape } from "./types";

export const dictionaries: Record<Locale, TranslationShape<typeof en>> = { en, ru };
export const editorDictionaries: Record<Locale, TranslationShape<typeof editorEn>> = { en: editorEn, ru: editorRu };
export const assetDictionaries: Record<Locale, TranslationShape<typeof assetsEn>> = { en: assetsEn, ru: assetsRu };
export const timelineDictionaries: Record<Locale, TranslationShape<typeof timelineEn>> = { en: timelineEn, ru: timelineRu };
export const previewDictionaries: Record<Locale, TranslationShape<typeof previewEn>> = { en: previewEn, ru: previewRu };
export const changelogDictionaries: Record<Locale, TranslationShape<typeof changelogEn>> = { en: changelogEn, ru: changelogRu };
export const siteDictionaries: Record<Locale, TranslationShape<typeof siteEn>> = { en: siteEn, ru: siteRu };
export const legalDictionaries: Record<Locale, TranslationShape<typeof legalEn>> = { en: legalEn, ru: legalRu };
export const uiDictionaries: Record<Locale, TranslationShape<typeof uiEn>> = { en: uiEn, ru: uiRu };
export const propertyPanelDictionaries: Record<Locale, TranslationShape<typeof propertiesEn>> = { en: propertiesEn, ru: propertiesRu };

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
		previewT: previewDictionaries[locale] ?? previewEn,
		changelogT: changelogDictionaries[locale] ?? changelogEn,
		siteT: siteDictionaries[locale] ?? siteEn,
		legalT: legalDictionaries[locale] ?? legalEn,
		uiT: uiDictionaries[locale] ?? uiEn,
		propertiesT: propertyPanelDictionaries[locale] ?? propertiesEn,
		intlLocale: intlLocales[locale] ?? intlLocales.en,
	};
}
