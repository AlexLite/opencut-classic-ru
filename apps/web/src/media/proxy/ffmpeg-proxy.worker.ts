import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";
import { classifyLocalProxyError, LocalProxyError } from "./proxy-errors";
import {
	buildLocalVideoTranscodeArgs,
	type LocalVideoTranscodePurpose,
} from "./ffmpeg-transcode";

const SINGLE_THREAD_CORE = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd";
const MULTI_THREAD_CORE = "https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.10/dist/umd";

type TranscodeRequest = {
	type: "transcode";
	id: string;
	file: File;
	useMultithread: boolean;
	purpose: LocalVideoTranscodePurpose;
};

type WorkerResponse =
	| { type: "progress"; id: string; progress: number }
	| { type: "complete"; id: string; blob: Blob }
	| { type: "error"; id: string; code: string; message: string };

type LocalWorkerScope = {
	postMessage: (message: WorkerResponse) => void;
	onmessage: ((event: MessageEvent<TranscodeRequest>) => void) | null;
};

const workerScope = self as unknown as LocalWorkerScope;

let ffmpeg: FFmpeg | null = null;
let loadedMode: "single" | "multi" | null = null;

function post(message: WorkerResponse) {
	workerScope.postMessage(message);
}

async function loadFfmpeg({ useMultithread }: { useMultithread: boolean }) {
	const mode = useMultithread ? "multi" : "single";
	if (ffmpeg && loadedMode === mode) return ffmpeg;

	ffmpeg?.terminate();
	ffmpeg = new FFmpeg();
	loadedMode = null;
	const baseURL = useMultithread ? MULTI_THREAD_CORE : SINGLE_THREAD_CORE;

	try {
		const config = {
			coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
			wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
			...(useMultithread && {
				workerURL: await toBlobURL(
					`${baseURL}/ffmpeg-core.worker.js`,
					"text/javascript",
				),
			}),
		};
		await ffmpeg.load(config);
		loadedMode = mode;
		return ffmpeg;
	} catch (error) {
		ffmpeg?.terminate();
		ffmpeg = null;
		loadedMode = null;
		throw new LocalProxyError(
			"ffmpeg.wasm core could not be loaded",
			"ffmpeg-load-failed",
			{ cause: error },
		);
	}
}

workerScope.onmessage = async (event: MessageEvent<TranscodeRequest>) => {
	const request = event.data;
	if (request?.type !== "transcode") return;

	const inputName = `input-${request.id}`;
	const outputName = `${request.purpose}-${request.id}.mp4`;

	try {
		const instance = await loadFfmpeg({ useMultithread: request.useMultithread });
		const progressHandler = ({ progress }: { progress: number }) => {
			post({
				type: "progress",
				id: request.id,
				progress: Math.max(0, Math.min(1, progress)),
			});
		};
		instance.on("progress", progressHandler);
		try {
			await instance.writeFile(
				inputName,
				new Uint8Array(await request.file.arrayBuffer()),
			);
			const exitCode = await instance.exec(
				buildLocalVideoTranscodeArgs({
					inputName,
					outputName,
					purpose: request.purpose,
				}),
			);
			if (exitCode !== 0) {
				throw new Error(`ffmpeg.wasm exited with code ${exitCode}`);
			}
			const data = await instance.readFile(outputName);
			if (typeof data === "string") {
				throw new Error("ffmpeg.wasm returned an unexpected text result");
			}
			const bytes = new Uint8Array(data.byteLength);
			bytes.set(data);
			post({
				type: "complete",
				id: request.id,
				blob: new Blob([bytes], { type: "video/mp4" }),
			});
		} finally {
			instance.off("progress", progressHandler);
			await instance.deleteFile(inputName).catch(() => undefined);
			await instance.deleteFile(outputName).catch(() => undefined);
		}
	} catch (error) {
		const normalized = classifyLocalProxyError(error);
		post({
			type: "error",
			id: request.id,
			code: normalized.code,
			message: normalized.message,
		});
	}
};
