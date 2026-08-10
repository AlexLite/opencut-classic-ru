"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Locale } from "./types";

type LocaleState = {
	locale: Locale;
	setLocale: (locale: Locale) => void;
};

export const useLocaleStore = create<LocaleState>()(
	persist(
		(set) => ({
			locale: "ru",
			setLocale: (locale) => set({ locale }),
		}),
		{
			name: "opencut-locale",
			version: 1,
		},
	),
);
