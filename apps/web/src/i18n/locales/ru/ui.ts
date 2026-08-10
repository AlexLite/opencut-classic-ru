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
	breadcrumb: {
		label: "Навигационная цепочка",
		more: "Ещё",
	},
	section: {
		collapse: "Свернуть раздел",
		expand: "Развернуть раздел",
	},
	editableTimecode: {
		clickToEdit: "Нажмите, чтобы изменить время",
	},
	storage: {
		unsupportedWarning:
			"Браузер поддерживает локальное хранилище не полностью. Некоторые функции могут работать некорректно.",
	},
	draggableItem: {
		addToTimeline: "Добавить на таймлайн",
		addOrDrag: "Добавить на таймлайн или перетащить в нужное место",
	},
} satisfies TranslationShape<typeof uiEn>;
