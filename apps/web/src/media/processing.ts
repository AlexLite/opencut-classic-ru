import { toast } from "sonner";
import { getMediaProxyMessages } from "@/i18n/media-proxy";
import { getMediaTypeFromFile } from "@/media/media-utils";
import { formatStorageBytes } from "@/services/storage/quota";
import { storageService } from "@/services/storage/service";
import type { MediaAsset } from "@/media/types";
import { readVideoFile } from "./mediabunny";
import { renderThumbnailDataUrl } from "./thumbnail";
import { inspectVideoDecodeCapability } from "./video-capability-inspector";
import { createLocalVideoProxy } from "./proxy/local-video-proxy";
import { classifyLocalProxyError } from "./proxy/proxy-errors";
import type { VideoCodecFamily } from "./codec-info";

export interface ProcessedMediaAsset extends Omit<MediaAsset, "id"> {}

const LARGE_PROXY_FILE_BYTES = 750 * 1024 * 1024;

const getStorageLimitDescription = ({
	fileSize,
	availableBytes,
}: {
	fileSize: number;
	availableBytes: number | null;
}): string => {
	const fileSizeLabel = formatStorageBytes({ bytes: fileSize });

	if (availableBytes === null) {
		return `File size is ${fileSizeLabel}.`;
	}

	return `File size is ${fileSizeLabel}, but only ${formatStorageBytes({
		bytes: availableBytes,
	})} is safely available in browser storage.`;
};

async function generateImageThumbnail({
	imageFile,
}: {
	imageFile: File;
}): Promise<{ thumbnailUrl: string; width: number; height: number }> {
	return new Promise((resolve, reject) => {
		const image = new window.Image();
		const objectUrl = URL.createObjectURL(imageFile);

		image.addEventListener("load", () => {
			try {
				const thumbnailUrl = renderThumbnailDataUrl({
					width: image.naturalWidth,
					height: image.naturalHeight,
					draw: ({ context, width, height }) => {
						context.drawImage(image, 0, 0, width, height);
					},
				});
				resolve({
					thumbnailUrl,
					width: image.naturalWidth,
					height: image.naturalHeight,
				});
			} catch (error) {
				reject(
					error instanceof Error ? error : new Error("Could not render image"),
				);
			} finally {
				URL.revokeObjectURL(objectUrl);
				image.remove();
			}
		});

		image.addEventListener("error", () => {
			URL.revokeObjectURL(objectUrl);
			image.remove();
			reject(new Error("Could not load image"));
		});

		image.src = objectUrl;
	});
}

function getProxyDescription({ family }: { family: VideoCodecFamily }): string {
	const messages = getMediaProxyMessages();
	if (family === "avc") return messages.avcUnsupported;
	if (family === "hevc") return messages.hevcUnsupported;
	return messages.genericUnsupported;
}

function shouldWarnAboutLocalTranscode({ file }: { file: File }): boolean {
	if (file.size >= LARGE_PROXY_FILE_BYTES) return true;
	if (typeof navigator === "undefined") return false;
	const deviceMemory = (navigator as Navigator & { deviceMemory?: number })
		.deviceMemory;
	return (
		(typeof deviceMemory === "number" && deviceMemory <= 4) ||
		(typeof navigator.hardwareConcurrency === "number" &&
			navigator.hardwareConcurrency <= 4)
	);
}

export async function processMediaAssets({
	files,
	onProgress,
}: {
	files: FileList | File[];
	onProgress?: ({ progress }: { progress: number }) => void;
}): Promise<ProcessedMediaAsset[]> {
	const fileArray = Array.from(files);
	const processedAssets: ProcessedMediaAsset[] = [];
	const total = fileArray.length;
	let completed = 0;

	const reportCurrentFileProgress = (fraction: number) => {
		if (!onProgress || total === 0) return;
		const clamped = Math.max(0, Math.min(1, fraction));
		onProgress({ progress: Math.round(((completed + clamped) / total) * 100) });
	};
	const markCurrentFileDone = () => {
		completed += 1;
		reportCurrentFileProgress(0);
	};

	for (const file of fileArray) {
		const proxyMessages = getMediaProxyMessages();
		const fileType = getMediaTypeFromFile({ file });

		if (!fileType) {
			toast.error(`Unsupported file type: ${file.name}`);
			markCurrentFileDone();
			continue;
		}

		const storageCheck = await storageService.canStoreFile({ size: file.size });
		if (!storageCheck.canStore) {
			toast.error(`Not enough browser storage for ${file.name}`, {
				description: getStorageLimitDescription({
					fileSize: file.size,
					availableBytes: storageCheck.availableBytes,
				}),
			});
			markCurrentFileDone();
			continue;
		}

		const url = URL.createObjectURL(file);
		let previewFile: File | undefined;
		let previewUrl: string | undefined;
		let thumbnailUrl: string | undefined;
		let duration: number | undefined;
		let width: number | undefined;
		let height: number | undefined;
		let fps: number | undefined;
		let hasAudio: boolean | undefined;
		let nativeDecodable: boolean | undefined;
		let sourceCodecInfo: MediaAsset["sourceCodecInfo"];
		let proxyFallbackFailure: MediaAsset["proxyFallbackFailure"];

		try {
			if (fileType === "image") {
				const result = await generateImageThumbnail({ imageFile: file });
				thumbnailUrl = result.thumbnailUrl;
				width = result.width;
				height = result.height;
				reportCurrentFileProgress(1);
			} else if (fileType === "video") {
				try {
					const [videoData, decodeInspection] = await Promise.all([
						readVideoFile({ file }),
						inspectVideoDecodeCapability({ file }),
					]);
					duration = videoData.duration;
					width = videoData.width;
					height = videoData.height;
					fps = Number.isFinite(videoData.fps)
						? Math.round(videoData.fps)
						: undefined;
					hasAudio = videoData.hasAudio;
					thumbnailUrl = videoData.thumbnailUrl ?? undefined;
					nativeDecodable = decodeInspection.capability.supported;
					sourceCodecInfo = decodeInspection.codecInfo;

					if (!nativeDecodable) {
						const description = getProxyDescription({
							family: decodeInspection.codecInfo.family,
						});
						if (shouldWarnAboutLocalTranscode({ file })) {
							toast.warning(proxyMessages.largeFileTitle, {
								description: proxyMessages.largeFileDescription,
							});
						}

						const proxyToastId = toast.loading(proxyMessages.creatingTitle, {
							description,
						});
						try {
							const proxy = await createLocalVideoProxy({
								file,
								onProgress: (progress) => {
									reportCurrentFileProgress(progress);
									toast.loading(proxyMessages.creatingTitle, {
										id: proxyToastId,
										description: `${description} ${Math.round(progress * 100)}%`,
									});
								},
							});
							previewFile = proxy.file;
							previewUrl = URL.createObjectURL(proxy.file);
							const proxyData = await readVideoFile({ file: proxy.file });
							thumbnailUrl = proxyData.thumbnailUrl ?? thumbnailUrl;
							toast.success(proxyMessages.ready, { id: proxyToastId });
						} catch (error) {
							const normalized = classifyLocalProxyError(error);
							proxyFallbackFailure = normalized.code;
							toast.dismiss(proxyToastId);
						}
					}
				} catch (error) {
					const message =
						error instanceof Error ? error.message : "Could not process video";
					toast.error(`Couldn't process ${file.name}`, { description: message });
				}
			} else if (fileType === "audio") {
				duration = await getMediaDuration({ file });
				reportCurrentFileProgress(1);
			}

			processedAssets.push({
				name: file.name,
				type: fileType,
				file,
				url,
				previewFile,
				previewUrl,
				thumbnailUrl,
				duration,
				width,
				height,
				fps,
				hasAudio,
				nativeDecodable,
				sourceCodecInfo,
				proxyFallbackFailure,
			});

			await new Promise((resolve) => setTimeout(resolve, 0));
			markCurrentFileDone();
		} catch (error) {
			console.error("Error processing file:", file.name, error);
			toast.error(`Failed to process ${file.name}`);
			URL.revokeObjectURL(url);
			if (previewUrl) URL.revokeObjectURL(previewUrl);
			markCurrentFileDone();
		}
	}

	return processedAssets;
}

const getMediaDuration = ({ file }: { file: File }): Promise<number> => {
	return new Promise((resolve, reject) => {
		const element = document.createElement(
			file.type.startsWith("video/") ? "video" : "audio",
		) as HTMLVideoElement;
		const objectUrl = URL.createObjectURL(file);

		element.addEventListener("loadedmetadata", () => {
			resolve(element.duration);
			URL.revokeObjectURL(objectUrl);
			element.remove();
		});

		element.addEventListener("error", () => {
			reject(new Error("Could not load media"));
			URL.revokeObjectURL(objectUrl);
			element.remove();
		});

		element.src = objectUrl;
		element.load();
	});
};
