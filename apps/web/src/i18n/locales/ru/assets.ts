import type { assetsEn } from "../en/assets";
import type { TranslationShape } from "../../types";

export const assetsRu = {
	text: {
		title: "Текст",
		defaultText: "Текст по умолчанию",
		elementName: "Текст",
	},
	effects: {
		title: "Эффекты",
		names: {
			blur: "Размытие",
		},
		paramLabels: {
			intensity: "Интенсивность",
		},
	},
	stickers: {
		searchPlaceholder: "Поиск...",
		categoriesAria: "Категории стикеров",
		categories: {
			all: "Все",
			flags: "Флаги",
			shapes: "Фигуры",
		},
		noFoundTitle: "Стикеры не найдены",
		resultsCountForms: {
			one: "результат",
			few: "результата",
			many: "результатов",
			other: "результатов",
		},
		noForPrefix: "Стикеры не найдены по запросу ",
		noAvailable: "Стикеров пока нет.",
		noAvailableInPrefix: "В категории «",
		noAvailableInSuffix: "» пока нет стикеров.",
		recentlyUsed: "Недавно использованные",
		clear: "Очистить",
		seeAll: "Показать все",
		addFailed: "Не удалось добавить стикер на таймлайн",
	},
} satisfies TranslationShape<typeof assetsEn>;
