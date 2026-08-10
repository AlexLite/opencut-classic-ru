import { toast } from "sonner";
import { getCurrentI18n } from "@/i18n/runtime";

export interface MediaUploadToastResult {
	uploadedCount: number;
	assetNames?: string[];
}

function waitForNextPaint(): Promise<void> {
	return new Promise((resolve) => {
		requestAnimationFrame(() => {
			requestAnimationFrame(() => resolve());
		});
	});
}

export async function showMediaUploadToast<T extends MediaUploadToastResult>({
	filesCount,
	promise,
}: {
	filesCount: number;
	promise: Promise<T> | (() => Promise<T>);
}) {
	const run = typeof promise === "function" ? promise : () => promise;
	const { editorT } = getCurrentI18n();
	const uploadT = editorT.media.upload;
	const toastPromise = toast.promise(
		async () => {
			await waitForNextPaint();
			return run();
		},
		{
			loading:
				filesCount === 1 ? uploadT.loadingSingle : uploadT.loadingMultiple,
			success: ({ uploadedCount, assetNames }) => {
				if (uploadedCount === 1) {
					const assetName = assetNames?.[0];
					return assetName
						? `${uploadT.uploadedNamedPrefix}${assetName}${uploadT.uploadedNamedSuffix}`
						: uploadT.uploadedSingle;
				}

				if (uploadedCount > 1) {
					return `${uploadT.uploadedMultiplePrefix}${uploadedCount}`;
				}

				return uploadT.noneUploaded;
			},
			error: uploadT.failed,
		},
	);

	return toastPromise.unwrap();
}
