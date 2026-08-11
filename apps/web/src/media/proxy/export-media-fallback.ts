import type { MediaAsset } from "@/media/types";
import type { SceneTracks, TimelineTrack } from "@/timeline";
import { inspectVideoDecodeCapability } from "../video-capability-inspector";
import {
	createLocalVideoRenderMezzanine,
	isLocalVideoTranscodeAbort,
} from "./local-video-proxy";
import { LocalProxyError } from "./proxy-errors";

export type PreparedExportMedia =
	| {
			cancelled: false;
			mediaAssets: MediaAsset[];
			fallbackCount: number;
			cleanup: () => void;
	  }
	| {
			cancelled: true;
			mediaAssets: MediaAsset[];
			fallbackCount: number;
			cleanup: () => void;
	  };

function getVisibleVideoMediaIdsFromTrack({
	track,
}: {
	track: TimelineTrack;
}): string[] {
	if ("hidden" in track && track.hidden) return [];
	return track.elements.flatMap((element) => {
		if (element.type !== "video") return [];
		if ("hidden" in element && element.hidden) return [];
		return [element.mediaId];
	});
}

export function collectExportVideoMediaIds({
	tracks,
}: {
	tracks: SceneTracks;
}): Set<string> {
	return new Set(
		[tracks.main, ...tracks.overlay].flatMap((track) =>
			getVisibleVideoMediaIdsFromTrack({ track }),
		),
	);
}

function createCancellationPoll({
	shouldCancel,
	controller,
}: {
	shouldCancel?: () => boolean;
	controller: AbortController;
}): ReturnType<typeof setInterval> | null {
	if (!shouldCancel) return null;
	return setInterval(() => {
		if (shouldCancel()) controller.abort();
	}, 100);
}

export async function prepareMediaAssetsForExport({
	tracks,
	mediaAssets,
	onProgress,
	shouldCancel,
}: {
	tracks: SceneTracks;
	mediaAssets: MediaAsset[];
	onProgress?: (progress: number) => void;
	shouldCancel?: () => boolean;
}): Promise<PreparedExportMedia> {
	const usedVideoIds = collectExportVideoMediaIds({ tracks });
	const candidates = mediaAssets.filter(
		(asset) =>
			asset.type === "video" &&
			usedVideoIds.has(asset.id) &&
			asset.nativeDecodable !== true,
	);
	const createdUrls: string[] = [];
	const cleanup = () => {
		for (const url of createdUrls) URL.revokeObjectURL(url);
	};

	try {
		const unsupportedAssets: MediaAsset[] = [];
		for (const asset of candidates) {
			if (shouldCancel?.()) {
				return {
					cancelled: true,
					mediaAssets,
					fallbackCount: 0,
					cleanup,
				};
			}
			const inspection = await inspectVideoDecodeCapability({ file: asset.file });
			if (!inspection.capability.supported) unsupportedAssets.push(asset);
		}

		if (unsupportedAssets.length === 0) {
			return {
				cancelled: false,
				mediaAssets,
				fallbackCount: 0,
				cleanup,
			};
		}

		const replacements = new Map<string, MediaAsset>();
		for (let index = 0; index < unsupportedAssets.length; index++) {
			const asset = unsupportedAssets[index];
			if (shouldCancel?.()) {
				return {
					cancelled: true,
					mediaAssets,
					fallbackCount: replacements.size,
					cleanup,
				};
			}

			const controller = new AbortController();
			const cancelPoll = createCancellationPoll({ shouldCancel, controller });
			try {
				const mezzanine = await createLocalVideoRenderMezzanine({
					file: asset.file,
					signal: controller.signal,
					onProgress: (progress) => {
						onProgress?.((index + progress) / unsupportedAssets.length);
					},
				});
				const verification = await inspectVideoDecodeCapability({
					file: mezzanine.file,
				});
				if (!verification.capability.supported) {
					throw new LocalProxyError(
						"The generated full-resolution H.264 render copy is still unsupported by this browser",
						"transcode-failed",
					);
				}
				const renderUrl = URL.createObjectURL(mezzanine.file);
				createdUrls.push(renderUrl);
				replacements.set(asset.id, {
					...asset,
					file: mezzanine.file,
					url: renderUrl,
					nativeDecodable: true,
				});
				onProgress?.((index + 1) / unsupportedAssets.length);
			} catch (error) {
				if (isLocalVideoTranscodeAbort(error)) {
					return {
						cancelled: true,
						mediaAssets,
						fallbackCount: replacements.size,
						cleanup,
					};
				}
				throw error;
			} finally {
				if (cancelPoll !== null) clearInterval(cancelPoll);
			}
		}

		return {
			cancelled: false,
			mediaAssets: mediaAssets.map(
				(asset) => replacements.get(asset.id) ?? asset,
			),
			fallbackCount: replacements.size,
			cleanup,
		};
	} catch (error) {
		cleanup();
		throw error;
	}
}
