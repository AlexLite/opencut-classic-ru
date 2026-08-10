import type { uiEn } from "../en/ui";
import type { TranslationShape } from "../../types";

export const uiRu = {
	fontPicker: {
		allFonts: "Все шрифты",
		myFonts: "Мои шрифты",
		favorites: "Избранное",
		selectFont: "Выберите шрифт",
		searchPrefix: "Поиск",
		loading: "Загрузка шрифтов...",
		loadFailed: "Не удалось загрузить предпросмотр шрифтов.",
		retry: "Повторить",
		noFonts: "Шрифты не найдены.",
	},
	colorPicker: {
		selectMode: "Выберите режим",
		custom: "Свой цвет",
		saved: "Сохранённые",
		eyeDropper: "Выбрать цвет с экрана",
		close: "Закрыть выбор цвета",
		saturation: "Насыщенность и яркость",
		hue: "Оттенок",
		opacity: "Прозрачность",
		open: "Открыть выбор цвета",
	},
} satisfies TranslationShape<typeof uiEn>;
