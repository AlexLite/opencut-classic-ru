import type { siteEn } from "../en/site";
import type { TranslationShape } from "../../types";

export const siteRu = {
	header: {
		roadmap: "Дорожная карта",
		contributors: "Участники",
		sponsors: "Спонсоры",
		blog: "Блог",
		copySvg: "Копировать SVG",
		downloadSvg: "Скачать SVG",
		brandAssets: "Материалы бренда",
		projects: "Проекты",
		closeMenu: "Закрыть меню",
		logoAlt: "Логотип OpenCut",
	},
	hero: {
		backgroundAlt: "Фон главной страницы видеоредактора OpenCut",
		openSource: "Открытый исходный код",
		videoEditor: "Видеоредактор",
		description:
			"Простой, но мощный видеоредактор для повседневного монтажа. Работает на любой платформе.",
		tryEarlyBeta: "Попробовать раннюю бета-версию",
	},
	footer: {
		description: "Видеоредактор с приоритетом приватности и простым интерфейсом.",
		resources: "Ресурсы",
		company: "Проект",
		roadmap: "Дорожная карта",
		changelog: "Список изменений",
		blog: "Блог",
		privacy: "Конфиденциальность",
		termsOfUse: "Условия использования",
		contributors: "Участники",
		sponsors: "Спонсоры",
		brand: "Бренд",
		about: "О проекте",
		allRightsReserved: "Все права защищены",
	},
} satisfies TranslationShape<typeof siteEn>;
