import { OPFSAdapter } from "@/services/storage/opfs-adapter";

const PROXY_DIRECTORY = "media-preview-proxies";
const FINGERPRINT_BYTES = 64 * 1024;
const proxyAdapter = new OPFSAdapter(PROXY_DIRECTORY);

async function fingerprintFile(file: File): Promise<string> {
	const head = new Uint8Array(await file.slice(0, FINGERPRINT_BYTES).arrayBuffer());
	const tailStart = Math.max(FINGERPRINT_BYTES, file.size - FINGERPRINT_BYTES);
	const tail = new Uint8Array(await file.slice(tailStart).arrayBuffer());
	const metadata = new TextEncoder().encode(
		`${file.name}\0${file.size}\0${file.lastModified}\0${file.type}\0`,
	);
	const bytes = new Uint8Array(metadata.length + head.length + tail.length);
	bytes.set(metadata, 0);
	bytes.set(head, metadata.length);
	bytes.set(tail, metadata.length + head.length);
	const digest = await crypto.subtle.digest("SHA-256", bytes);
	return [...new Uint8Array(digest)]
		.map((value) => value.toString(16).padStart(2, "0"))
		.join("");
}

export async function getVideoProxyCacheKey({ file }: { file: File }): Promise<string> {
	return `preview-${await fingerprintFile(file)}.mp4`;
}

export async function getCachedVideoProxy({
	file,
}: {
	file: File;
}): Promise<{ cacheKey: string; file: File } | null> {
	if (typeof navigator === "undefined" || !OPFSAdapter.isSupported()) return null;
	try {
		const cacheKey = await getVideoProxyCacheKey({ file });
		const cached = await proxyAdapter.get(cacheKey);
		if (!cached) return null;
		return {
			cacheKey,
			file: new File([cached], `${file.name}.preview.mp4`, {
				type: "video/mp4",
				lastModified: cached.lastModified,
			}),
		};
	} catch (error) {
		console.warn("[media-proxy] Failed to read proxy cache:", error);
		return null;
	}
}

export async function cacheVideoProxy({
	sourceFile,
	proxyFile,
}: {
	sourceFile: File;
	proxyFile: File;
}): Promise<string | null> {
	if (typeof navigator === "undefined" || !OPFSAdapter.isSupported()) return null;
	try {
		const cacheKey = await getVideoProxyCacheKey({ file: sourceFile });
		await proxyAdapter.set({ key: cacheKey, value: proxyFile });
		return cacheKey;
	} catch (error) {
		console.warn("[media-proxy] Failed to persist proxy cache:", error);
		return null;
	}
}
