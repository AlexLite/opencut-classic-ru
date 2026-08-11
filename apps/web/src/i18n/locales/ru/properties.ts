import type { propertiesEn } from "../en/properties";
import type { TranslationShape } from "../../types";

export const propertiesRu = {
	paramLabels: {
		fill: "Заливка",
		stroke: "Цвет",
		strokeWidth: "Толщина",
		strokeAlign: "Положение обводки",
		cornerRadius: "Скругление углов",
		sides: "Стороны",
		points: "Лучи",
		depth: "Глубина",
	},
	optionLabels: {
		inside: "Внутри",
		center: "По центру",
		outside: "Снаружи",
	},
	effects: {
		standaloneTitle: "Эффект",
		title: "Эффекты",
		noEffects: "Эффектов нет",
		noEffectsDescription: "Добавьте эффекты к этому слою из панели материалов.",
		openEffects: "Открыть эффекты",
		toggleEffect: "Включить или выключить эффект",
		removeEffect: "Удалить эффект",
	},
	speed: {
		title: "Скорость",
		speed: "Скорость",
		changePitch: "Изменять высоту тона",
	},
	graphic: {
		stroke: "Обводка",
		enableStroke: "Включить обводку",
		disableStroke: "Отключить обводку",
		names: {
			rectangle: "Прямоугольник",
			ellipse: "Эллипс",
			polygon: "Многоугольник",
			star: "Звезда",
		},
	},
	masks: {
		title: "Маски",
		addMask: "Добавить маску",
		onlyOneSupported:
			"Сейчас поддерживается только одна маска. Если нужно несколько, дублируйте клип и примените к каждой копии отдельную маску.",
		noMasks: "Масок нет",
		noMasksDescription: "Добавьте маску, чтобы скрыть или показать часть слоя.",
		toggleInversion: "Инвертировать маску",
		removeMask: "Удалить маску",
		types: {
			split: "Разделение",
			"cinematic-bars": "Кинематографические полосы",
			rectangle: "Прямоугольник",
			ellipse: "Эллипс",
			heart: "Сердце",
			diamond: "Ромб",
			star: "Звезда",
			text: "Текст",
			freeform: "Свободная форма",
		},
		fields: {
			position: "Положение",
			size: "Размер",
			height: "Высота",
			width: "Ширина",
			scale: "Масштаб",
			rotation: "Поворот",
			feather: "Растушёвка",
			stroke: "Обводка",
			content: "Содержимое",
			font: "Шрифт",
			spacing: "Интервалы",
		},
		strokeAlign: {
			inside: "Внутри",
			center: "По центру",
			outside: "Снаружи",
		},
	},
} satisfies TranslationShape<typeof propertiesEn>;
