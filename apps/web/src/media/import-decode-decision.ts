export function resolveImportDecodability({
	mediabunnyCanDecode,
	webCodecsSupported,
}: {
	mediabunnyCanDecode?: boolean;
	webCodecsSupported?: boolean;
}): boolean {
	if (mediabunnyCanDecode === false || webCodecsSupported === false) {
		return false;
	}
	if (mediabunnyCanDecode === true || webCodecsSupported === true) {
		return true;
	}
	return false;
}
