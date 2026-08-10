export type LocalProxyFailureCode =
	| "ffmpeg-load-failed"
	| "out-of-memory"
	| "transcode-failed"
	| "worker-unavailable";

export class LocalProxyError extends Error {
	constructor(
		message: string,
		public readonly code: LocalProxyFailureCode,
		options?: ErrorOptions,
	) {
		super(message, options);
		this.name = "LocalProxyError";
	}
}

export function classifyLocalProxyError(error: unknown): LocalProxyError {
	if (error instanceof LocalProxyError) return error;
	const message = error instanceof Error ? error.message : String(error);
	const normalized = message.toLowerCase();

	if (
		normalized.includes("out of memory") ||
		normalized.includes("memory access out of bounds") ||
		normalized.includes("cannot allocate memory") ||
		normalized.includes("allocation failed")
	) {
		return new LocalProxyError(message || "ffmpeg.wasm ran out of memory", "out-of-memory", {
			cause: error,
		});
	}

	if (
		normalized.includes("ffmpeg") &&
		(normalized.includes("load") || normalized.includes("fetch"))
	) {
		return new LocalProxyError(message || "ffmpeg.wasm failed to load", "ffmpeg-load-failed", {
			cause: error,
		});
	}

	return new LocalProxyError(message || "Local proxy transcoding failed", "transcode-failed", {
		cause: error,
	});
}
