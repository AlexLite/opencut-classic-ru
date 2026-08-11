const SINGLE_THREAD_CORE =
	"https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd";
const MULTI_THREAD_CORE =
	"https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.10/dist/umd";

function post(message) {
	self.postMessage(message);
}

function errorMessage(error) {
	return error instanceof Error ? error.message : String(error);
}

function classifyRuntimeError(error) {
	const message = errorMessage(error);
	const normalized = message.toLowerCase();
	if (
		normalized.includes("out of memory") ||
		normalized.includes("memory access out of bounds") ||
		normalized.includes("cannot allocate memory") ||
		normalized.includes("allocation failed")
	) {
		return { code: "out-of-memory", message };
	}
	return { code: "transcode-failed", message };
}

async function fetchBlobUrl(url, type) {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to load ffmpeg.wasm asset (${response.status})`);
	}
	const data = await response.arrayBuffer();
	return URL.createObjectURL(new Blob([data], { type }));
}

async function loadCore(useMultithread) {
	const baseURL = useMultithread ? MULTI_THREAD_CORE : SINGLE_THREAD_CORE;
	const objectUrls = [];
	try {
		const coreURL = await fetchBlobUrl(
			`${baseURL}/ffmpeg-core.js`,
			"text/javascript",
		);
		objectUrls.push(coreURL);
		const wasmURL = await fetchBlobUrl(
			`${baseURL}/ffmpeg-core.wasm`,
			"application/wasm",
		);
		objectUrls.push(wasmURL);
		let workerURL;
		if (useMultithread) {
			workerURL = await fetchBlobUrl(
				`${baseURL}/ffmpeg-core.worker.js`,
				"text/javascript",
			);
			objectUrls.push(workerURL);
		}

		importScripts(coreURL);
		if (typeof self.createFFmpegCore !== "function") {
			throw new Error("ffmpeg.wasm core did not expose createFFmpegCore");
		}

		const ffmpeg = await self.createFFmpegCore({
			mainScriptUrlOrBlob: `${coreURL}#${btoa(
				JSON.stringify({ wasmURL, workerURL }),
			)}`,
		});
		return { ffmpeg, objectUrls };
	} catch (error) {
		for (const url of objectUrls) URL.revokeObjectURL(url);
		throw error;
	}
}

async function loadPreferredCore(useMultithread) {
	if (!useMultithread) return loadCore(false);
	try {
		return await loadCore(true);
	} catch (multithreadError) {
		try {
			return await loadCore(false);
		} catch (singleThreadError) {
			throw new Error(
				`Multi-thread ffmpeg.wasm failed: ${errorMessage(multithreadError)}; single-thread fallback failed: ${errorMessage(singleThreadError)}`,
			);
		}
	}
}

self.onmessage = async (event) => {
	const request = event.data;
	if (!request || request.type !== "transcode") return;

	const { id, file, useMultithread, inputName, outputName, args } = request;
	let ffmpeg;
	let objectUrls = [];
	let phase = "load";

	try {
		const loaded = await loadPreferredCore(Boolean(useMultithread));
		ffmpeg = loaded.ffmpeg;
		objectUrls = loaded.objectUrls;
		phase = "transcode";

		ffmpeg.setProgress(({ progress }) => {
			const value = Number.isFinite(progress)
				? Math.max(0, Math.min(1, progress))
				: 0;
			post({ type: "progress", id, progress: value });
		});

		ffmpeg.FS.writeFile(inputName, new Uint8Array(await file.arrayBuffer()));
		ffmpeg.setTimeout(-1);
		ffmpeg.exec(...args);
		const exitCode = ffmpeg.ret;
		ffmpeg.reset();
		if (exitCode !== 0) {
			throw new Error(`ffmpeg.wasm exited with code ${exitCode}`);
		}

		const data = ffmpeg.FS.readFile(outputName);
		const bytes = new Uint8Array(data.byteLength);
		bytes.set(data);
		post({
			type: "complete",
			id,
			blob: new Blob([bytes], { type: "video/mp4" }),
		});
	} catch (error) {
		const normalized =
			phase === "load"
				? { code: "ffmpeg-load-failed", message: errorMessage(error) }
				: classifyRuntimeError(error);
		post({ type: "error", id, ...normalized });
	} finally {
		if (ffmpeg) {
			try {
				ffmpeg.FS.unlink(inputName);
			} catch {}
			try {
				ffmpeg.FS.unlink(outputName);
			} catch {}
		}
		for (const url of objectUrls) URL.revokeObjectURL(url);
	}
};
