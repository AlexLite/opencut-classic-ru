import { canUseThreadedFfmpeg } from "../webcodecs-capabilities";
import { cacheVideoProxy, getCachedVideoProxy } from "./proxy-cache";
import {
	classifyLocalProxyError,
	LocalProxyError,
	type LocalProxyFailureCode,
} from "./proxy-errors";

export interface LocalVideoProxyResult {
	file: File;
	cacheKey: string | null;
	fromCache: boolean;
}

type WorkerResponse =
	| { type: "progress"; id: string; progress: number }
	| { type: "complete"; id: string; blob: Blob }
	| { type: "error"; id: string; code: LocalProxyFailureCode; message: string };

async function transcodeInWorker({
	file,
	onProgress,
}: {
	file: File;
	onProgress?: (progress: number) => void;
}): Promise<Blob> {
	if (typeof Worker === "undefined") {
		throw new LocalProxyError("Web Workers are unavailable in this browser", "worker-unavailable");
	}

	const worker = new Worker(new URL("./ffmpeg-proxy.worker.ts", import.meta.url), {
		type: "module",
	});
	const id = typeof crypto.randomUUID === "function"
		? crypto.randomUUID()
		: `${Date.now()}-${Math.random().toString(16).slice(2)}`;

	try {
		return await new Promise<Blob>((resolve, reject) => {
			worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
				const message = event.data;
				if (!message || message.id !== id) return;
				if (message.type === "progress") {
					onProgress?.(message.progress);
					return;
				}
				if (message.type === "complete") {
					resolve(message.blob);
					return;
				}
				reject(new LocalProxyError(message.message, message.code));
			};
			worker.onerror = (event) => {
				reject(new LocalProxyError(event.message || "Proxy worker failed", "transcode-failed"));
			};
			worker.postMessage({
				type: "transcode",
				id,
				file,
				useMultithread: canUseThreadedFfmpeg(),
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
		const blob = await transcodeInWorker({ file, onProgress });
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
