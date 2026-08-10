import type { previewEn } from "../en/preview";
import type { TranslationShape } from "../../types";

export const previewRu = {
	fit: "Вписать",
	fitToScreen: "Вписать в экран",
	fullScreen: "На весь экран",
	exitFullScreen: "Выйти из полноэкранного режима",
	play: "Воспроизвести",
	pause: "Пауза",
	saveSnapshot: "Сохранить снимок",
	copySnapshot: "Копировать снимок",
	failedToSaveSnapshot: "Не удалось сохранить снимок",
	failedToCopySnapshot: "Не удалось скопировать снимок",
	tryAgain: "Попробуйте ещё раз",
	zoom: "Масштаб предпросмотра",
	overlays: {
		bookmarkNotes: "Заметки закладок",
		guides: "Направляющие",
	},
} satisfies TranslationShape<typeof previewEn>;
