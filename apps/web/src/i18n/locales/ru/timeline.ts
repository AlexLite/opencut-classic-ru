import type { timelineEn } from "../en/timeline";
import type { TranslationShape } from "../../types";

export const timelineRu = {
	ariaLabel: "Таймлайн",
	toolbar: {
		split: "Разделить элемент",
		splitLeft: "Обрезать слева",
		splitRight: "Обрезать справа",
		extractAudio: "Отделить аудио",
		restoreAudio: "Вернуть исходное аудио",
		duplicate: "Дублировать элемент",
		freezeFrame: "Стоп-кадр (скоро)",
		delete: "Удалить элемент",
		addBookmark: "Добавить закладку",
		removeBookmark: "Удалить закладку",
		noScene: "Нет сцены",
		autoSnapping: "Автоматическая привязка",
		rippleEditing: "Монтаж со сдвигом",
		zoomOut: "Уменьшить масштаб",
		zoomIn: "Увеличить масштаб",
		zoom: "Масштаб таймлайна",
	},
	track: {
		delete: "Удалить дорожку",
		hide: "Скрыть дорожку",
		show: "Показать дорожку",
		mute: "Выключить звук дорожки",
		unmute: "Включить звук дорожки",
	},
} satisfies TranslationShape<typeof timelineEn>;
