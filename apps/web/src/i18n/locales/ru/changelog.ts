import type { changelogEn } from "../en/changelog";
import type { TranslationShape } from "../../types";

export const changelogRu = {
	dismiss: "Скрыть",
	seeFullChangelog: "Открыть полный список изменений",
	copyAsMarkdown: "Копировать как Markdown",
	copied: "Скопировано",
	sections: {
		new: "Новые возможности",
		improved: "Улучшения",
		fixed: "Исправления",
		breaking: "Несовместимые изменения",
		technical: "Технические детали",
	},
} satisfies TranslationShape<typeof changelogEn>;
