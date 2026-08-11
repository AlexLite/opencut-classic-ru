"use client";

import { create } from "zustand";
import {
	createJSONStorage,
	persist,
	type StateStorage,
} from "zustand/middleware";
import type { Locale } from "./types";

type LocaleState = {
	locale: Locale;
	setLocale: (locale: Locale) => void;
};

export function createLocaleStore(storage?: StateStorage) {
	return create<LocaleState>()(
		persist(
			(set) => ({
				locale: "ru",
				setLocale: (locale) => set({ locale }),
			}),
			{
				name: "opencut-locale",
				version: 1,
				storage: createJSONStorage(() => storage ?? localStorage),
			},
		),
	);
}

export const useLocaleStore = createLocaleStore();
