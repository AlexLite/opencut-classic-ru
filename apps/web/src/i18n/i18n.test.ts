import { describe, expect, test } from "bun:test";
import { readdir, readFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
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

function collectLeafKeys(value: unknown, prefix = ""): string[] {
	if (typeof value !== "object" || value === null) {
		return [prefix];
	}

	return Object.entries(value).flatMap(([key, child]) => {
		const nextPrefix = prefix ? `${prefix}.${key}` : key;
		return collectLeafKeys(child, nextPrefix);
	});
}

async function collectSourceFiles(directory: string): Promise<string[]> {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = await Promise.all(
		entries.map(async (entry) => {
			const path = join(directory, entry.name);
			if (entry.isDirectory()) return collectSourceFiles(path);
			return entry.isFile() && (path.endsWith(".ts") || path.endsWith(".tsx"))
				? [path]
				: [];
		}),
	);
	return files.flat();
}

class MemoryStorage implements Storage {
	private readonly values = new Map<string, string>();

	get length() {
		return this.values.size;
	}

	clear() {
		this.values.clear();
	}

	getItem(key: string) {
		return this.values.get(key) ?? null;
	}

	key(index: number) {
		return [...this.values.keys()][index] ?? null;
	}

	removeItem(key: string) {
		this.values.delete(key);
	}

	setItem(key: string, value: string) {
		this.values.set(key, value);
	}
}

const dictionaryPairs = [
	["base", en, ru],
	["editor", editorEn, editorRu],
	["assets", assetsEn, assetsRu],
	["timeline", timelineEn, timelineRu],
	["preview", previewEn, previewRu],
	["changelog", changelogEn, changelogRu],
	["site", siteEn, siteRu],
	["legal", legalEn, legalRu],
	["ui", uiEn, uiRu],
	["properties", propertiesEn, propertiesRu],
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

describe("i18n source hygiene", () => {
	test("keeps Cyrillic text inside locale dictionaries", async () => {
		const sourceRoot = join(process.cwd(), "src");
		const localeDirectory = `${sep}i18n${sep}locales${sep}`;
		const sourceFiles = (await collectSourceFiles(sourceRoot)).filter(
			(path) => !path.includes(localeDirectory),
		);
		const violations: string[] = [];

		for (const path of sourceFiles) {
			const content = await readFile(path, "utf8");
			content.split(/\r?\n/).forEach((line, index) => {
				if (/\p{Script=Cyrillic}/u.test(line)) {
					violations.push(`${relative(sourceRoot, path)}:${index + 1}`);
				}
			});
		}

		expect(violations).toEqual([]);
	});
});

describe("locale store", () => {
	test("switches locale and persists the selection", async () => {
		const existingStorage = globalThis.localStorage;
		const storage = existingStorage ?? new MemoryStorage();
		const installedMemoryStorage = existingStorage == null;

		if (installedMemoryStorage) {
			Object.defineProperty(globalThis, "localStorage", {
				configurable: true,
				value: storage,
			});
		}
		storage.clear();

		try {
			const { useLocaleStore } = await import("./store");

			expect(useLocaleStore.getState().locale).toBe("ru");
			useLocaleStore.getState().setLocale("en");
			expect(useLocaleStore.getState().locale).toBe("en");

			const persisted = storage.getItem("opencut-locale");
			expect(persisted).not.toBeNull();
			expect(JSON.parse(persisted ?? "{}")).toMatchObject({
				state: { locale: "en" },
				version: 1,
			});
		} finally {
			storage.clear();
			if (installedMemoryStorage) {
				Reflect.deleteProperty(globalThis, "localStorage");
			}
		}
	});
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
