"use client";

import { useMemo } from "react";
import { useKeybindingsStore } from "@/actions/keybindings-store";
import { ACTIONS, type TActionWithOptionalArgs } from "@/actions";
import {
	getPlatformAlternateKey,
	getPlatformSpecialKey,
} from "@/utils/platform";
import { useI18n } from "@/i18n/use-i18n";

export interface KeyboardShortcut {
	id: string;
	keys: string[];
	description: string;
	category: string;
	action: TActionWithOptionalArgs;
	icon?: React.ReactNode;
}

type ShortcutKeyLabels = {
	shift: string;
	space: string;
	home: string;
	enter: string;
	end: string;
	delete: string;
	backspace: string;
};

function formatKey({
	key,
	labels,
}: {
	key: string;
	labels: Readonly<ShortcutKeyLabels>;
}): string {
	return key
		.replace("ctrl", getPlatformSpecialKey())
		.replace("alt", getPlatformAlternateKey())
		.replace("shift", labels.shift)
		.replace("left", "←")
		.replace("right", "→")
		.replace("up", "↑")
		.replace("down", "↓")
		.replace("space", labels.space)
		.replace("home", labels.home)
		.replace("enter", labels.enter)
		.replace("end", labels.end)
		.replace("delete", labels.delete)
		.replace("backspace", labels.backspace)
		.replace("escape", "Esc")
		.replace("-", "+");
}

export function useKeyboardShortcutsHelp() {
	const { keybindings } = useKeybindingsStore();
	const { editorT } = useI18n();
	const keyLabels = editorT.shortcuts.keyLabels;

	const shortcuts = useMemo(() => {
		const actionToKeys = new Map<TActionWithOptionalArgs, string[]>();

		for (const [key, action] of keybindings) {
			const existing = actionToKeys.get(action);
			const formattedKey = formatKey({ key, labels: keyLabels });
			if (existing) {
				existing.push(formattedKey);
			} else {
				actionToKeys.set(action, [formattedKey]);
			}
		}

		const result: KeyboardShortcut[] = [];
		for (const [action, keys] of actionToKeys) {
			const actionDef = ACTIONS[action];
			if (!actionDef) continue;
			result.push({
				id: action,
				keys,
				description: actionDef.description,
				category: actionDef.category,
				action,
			});
		}

		return result.sort((a, b) => {
			if (a.category !== b.category) {
				return a.category.localeCompare(b.category);
			}
			return a.description.localeCompare(b.description);
		});
	}, [keybindings, keyLabels]);

	return {
		shortcuts,
	};
}
