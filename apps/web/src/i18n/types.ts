export const SUPPORTED_LOCALES = ["ru", "en"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export type TranslationShape<T> = {
	[K in keyof T]: T[K] extends string ? string : TranslationShape<T[K]>;
};
