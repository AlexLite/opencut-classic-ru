import { describe, expect, test } from "bun:test";
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

function collectLeafKeys(value: unknown, prefix = ""): string[] {
	if (typeof value !== "object" || value === null) {
		return [prefix];
	}

	return Object.entries(value).flatMap(([key, child]) => {
		const nextPrefix = prefix ? `${prefix}.${key}` : key;
		return collectLeafKeys(child, nextPrefix);
	});
}

const dictionaryPairs = [
	["base", en, ru],
	["editor", editorEn, editorRu],
	["assets", assetsEn, assetsRu],
	["timeline", timelineEn, timelineRu],
	["preview", previewEn, previewRu],
] as const;

describe("i18n dictionaries", () => {
	for (const [name, english, russian] of dictionaryPairs) {
		test(`${name} RU dictionary matches EN structure`, () => {
			expect(collectLeafKeys(russian).sort()).toEqual(
				collectLeafKeys(english).sort(),
			);
		});
	}
});

describe("Russian plural rules", () => {
	const pluralRules = new Intl.PluralRules("ru-RU");

	test.each([
		[1, "one"],
		[2, "few"],
		[5, "many"],
		[21, "one"],
		[22, "few"],
		[25, "many"],
	] as const)("%i uses %s form", (count, expected) => {
		expect(pluralRules.select(count)).toBe(expected);
	});
});
