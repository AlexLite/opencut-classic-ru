"use client";

import { DraggableItem } from "@/components/editor/panels/assets/draggable-item";
import { PanelView } from "@/components/editor/panels/assets/views/base-panel";
import { useEditor } from "@/editor/use-editor";
import { DEFAULTS } from "@/timeline/defaults";
import { buildTextElement } from "@/timeline/element-utils";
import type { MediaTime } from "@/wasm";
import { useI18n } from "@/i18n/use-i18n";

export function TextView() {
	const editor = useEditor();
	const { assetsT } = useI18n();

	const localizedTextDefaults = {
		...DEFAULTS.text.element,
		name: assetsT.text.elementName,
		params: {
			...DEFAULTS.text.element.params,
			content: assetsT.text.defaultText,
		},
	};

	const handleAddToTimeline = ({ currentTime }: { currentTime: MediaTime }) => {
		const activeScene = editor.scenes.getActiveScene();
		if (!activeScene) return;

		const element = buildTextElement({
			raw: localizedTextDefaults,
			startTime: currentTime,
		});

		editor.timeline.insertElement({
			element,
			placement: { mode: "auto" },
		});
	};

	return (
		<PanelView title={assetsT.text.title}>
			<DraggableItem
				name={assetsT.text.defaultText}
				preview={
					<div className="bg-accent flex size-full items-center justify-center rounded">
						<span className="text-xs select-none">{assetsT.text.defaultText}</span>
					</div>
				}
				dragData={{
					id: "temp-text-id",
					type: DEFAULTS.text.element.type,
					name: assetsT.text.elementName,
					content: assetsT.text.defaultText,
				}}
				aspectRatio={1}
				onAddToTimeline={handleAddToTimeline}
				shouldShowLabel={false}
			/>
		</PanelView>
	);
}
