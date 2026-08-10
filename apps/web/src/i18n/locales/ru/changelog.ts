import type { changelogEn } from "../en/changelog";
import type { TranslationShape } from "../../types";

export const changelogRu = {
	dismiss: "Скрыть",
	seeFullChangelog: "Открыть полный список изменений",
	copyAsMarkdown: "Копировать как Markdown",
	copied: "Скопировано",
	sections: {
		features: "Новые возможности",
		improvements: "Улучшения",
		bugFixes: "Исправления ошибок",
		chores: "Технические изменения",
	},
} satisfies TranslationShape<typeof changelogEn>;
