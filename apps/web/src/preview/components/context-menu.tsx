"use client";

import {
	ContextMenuCheckboxItem,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { usePreviewViewport } from "@/preview/components/preview-viewport";
import { useEditor } from "@/editor/use-editor";
import type { PreviewOverlayControl } from "@/preview/overlays";
import { toast } from "sonner";
import { useI18n } from "@/i18n/use-i18n";

export function PreviewContextMenu({
	onToggleFullscreen,
	container,
	overlayControls,
	onOverlayVisibilityChange,
}: {
	onToggleFullscreen: () => void;
	container: HTMLElement | null;
	overlayControls: PreviewOverlayControl[];
	onOverlayVisibilityChange: (params: {
		overlayId: string;
		isVisible: boolean;
	}) => void;
}) {
	const editor = useEditor();
	const viewport = usePreviewViewport();
	const { previewT } = useI18n();

	const handleCopySnapshot = async () => {
		const result = await editor.renderer.copySnapshot();

		if (!result.success) {
			console.error("Failed to copy snapshot:", result.error);
			toast.error(previewT.failedToCopySnapshot, {
				description: previewT.tryAgain,
			});
		}
	};

	const handleSaveSnapshot = async () => {
		const result = await editor.renderer.saveSnapshot();

		if (!result.success) {
			console.error("Failed to save snapshot:", result.error);
			toast.error(previewT.failedToSaveSnapshot, {
				description: previewT.tryAgain,
			});
		}
	};

	const getOverlayLabel = (overlayControl: PreviewOverlayControl) => {
		if (overlayControl.id === "bookmark-notes") {
			return previewT.overlays.bookmarkNotes;
		}
		if (overlayControl.id === "guides") {
			return previewT.overlays.guides;
		}
		return overlayControl.label;
	};

	return (
		<ContextMenuContent className="w-56" container={container}>
			<ContextMenuItem onClick={viewport.fitToScreen} inset>
				{previewT.fitToScreen}
			</ContextMenuItem>
			<ContextMenuSeparator />
			<ContextMenuItem onClick={onToggleFullscreen} inset>
				{previewT.fullScreen}
			</ContextMenuItem>
			<ContextMenuItem onClick={handleSaveSnapshot} inset>
				{previewT.saveSnapshot}
			</ContextMenuItem>
			<ContextMenuItem onClick={handleCopySnapshot} inset>
				{previewT.copySnapshot}
			</ContextMenuItem>
			{overlayControls.length > 0 ? <ContextMenuSeparator /> : null}
			{overlayControls.map((overlayControl) => (
				<ContextMenuCheckboxItem
					key={overlayControl.id}
					checked={overlayControl.isVisible}
					onCheckedChange={(checked) =>
						onOverlayVisibilityChange({
							overlayId: overlayControl.id,
							isVisible: !!checked,
						})
					}
				>
					{getOverlayLabel(overlayControl)}
				</ContextMenuCheckboxItem>
			))}
		</ContextMenuContent>
	);
}
