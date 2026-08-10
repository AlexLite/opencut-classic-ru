import { canUseThreadedFfmpeg } from "../webcodecs-capabilities";
import { cacheVideoProxy, getCachedVideoProxy } from "./proxy-cache";
import {
	classifyLocalProxyError,
	LocalProxyError,
	type LocalProxyFailureCode,
} from "./proxy-errors";
import type { LocalVideoTranscodePurpose } from "./ffmpeg-transcode";

export interface LocalVideoProxyResult {
	file: File;
	cacheKey: string | null;
	fromCache: boolean;
}

export interface LocalVideoRenderMezzanineResult {
	file: File;
}

const MAX_FFMPEG_WASM_INPUT_BYTES = 2_000_000_000;

type WorkerResponse =
	| { type: "progress"; id: string; progress: number }
	| { type: "complete"; id: string; blob: Blob }
	| { type: "error"; id: string; code: LocalProxyFailureCode; message: string };

function createAbortError(): Error {
	if (typeof DOMException !== "undefined") {
		return new DOMException("Local video transcode was cancelled", "AbortError");
	}
	const error = new Error("Local video transcode was cancelled");
	error.name = "AbortError";
	return error;
}

export function isLocalVideoTranscodeAbort(error: unknown): boolean {
	return error instanceof Error && error.name === "AbortError";
}

async function transcodeInWorker({
	file,
	onProgress,
	purpose,
	signal,
}: {
	file: File;
	onProgress?: (progress: number) => void;
	purpose: LocalVideoTranscodePurpose;
	signal?: AbortSignal;
}): Promise<Blob> {
	if (file.size >= MAX_FFMPEG_WASM_INPUT_BYTES) {
		throw new LocalProxyError(
			"This file reaches the 2 GB input limit of the current ffmpeg.wasm core",
			"input-too-large",
		);
	}
	if (typeof Worker === "undefined") {
		throw new LocalProxyError(
			"Web Workers are unavailable in this browser",
			"worker-unavailable",
		);
	}
	if (signal?.aborted) throw createAbortError();

	const worker = new Worker(new URL("./ffmpeg-proxy.worker.ts", import.meta.url), {
		type: "module",
	});
	const id =
		typeof crypto.randomUUID === "function"
			? crypto.randomUUID()
			: `${Date.now()}-${Math.random().toString(16).slice(2)}`;

	try {
		return await new Promise<Blob>((resolve, reject) => {
			let settled = false;
			const finish = (callback: () => void) => {
				if (settled) return;
				settled = true;
				signal?.removeEventListener("abort", handleAbort);
				callback();
			};
			const handleAbort = () => finish(() => reject(createAbortError()));

			signal?.addEventListener("abort", handleAbort, { once: true });
			worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
				const message = event.data;
				if (!message || message.id !== id) return;
				if (message.type === "progress") {
					onProgress?.(message.progress);
					return;
				}
				if (message.type === "complete") {
					finish(() => resolve(message.blob));
					return;
				}
				finish(() =>
					reject(new LocalProxyError(message.message, message.code)),
				);
			};
			worker.onerror = (event) => {
				finish(() =>
					reject(
						new LocalProxyError(
							event.message || "Proxy worker failed",
							"transcode-failed",
						),
					),
				);
			};
			worker.postMessage({
				type: "transcode",
				id,
				file,
				useMultithread: canUseThreadedFfmpeg(),
				purpose,
			});
		});
	} finally {
		worker.terminate();
	}
}

export async function createLocalVideoProxy({
	file,
	onProgress,
}: {
	file: File;
	onProgress?: (progress: number) => void;
}): Promise<LocalVideoProxyResult> {
	const cached = await getCachedVideoProxy({ file });
	if (cached) {
		onProgress?.(1);
		return { file: cached.file, cacheKey: cached.cacheKey, fromCache: true };
	}

	try {
		const blob = await transcodeInWorker({
			file,
			onProgress,
			purpose: "preview",
		});
		const proxyFile = new File([blob], `${file.name}.preview.mp4`, {
			type: "video/mp4",
			lastModified: Date.now(),
		});
		const cacheKey = await cacheVideoProxy({ sourceFile: file, proxyFile });
		onProgress?.(1);
		return { file: proxyFile, cacheKey, fromCache: false };
	} catch (error) {
		throw classifyLocalProxyError(error);
	}
}

export async function createLocalVideoRenderMezzanine({
	file,
	onProgress,
	signal,
}: {
	file: File;
	onProgress?: (progress: number) => void;
	signal?: AbortSignal;
}): Promise<LocalVideoRenderMezzanineResult> {
	try {
		const blob = await transcodeInWorker({
			file,
			onProgress,
			purpose: "render",
			signal,
		});
		onProgress?.(1);
		return {
			file: new File([blob], `${file.name}.render.mp4`, {
				type: "video/mp4",
				lastModified: Date.now(),
			}),
		};
	} catch (error) {
		if (isLocalVideoTranscodeAbort(error)) throw error;
		throw classifyLocalProxyError(error);
	}
}
