export const mediaProxyEn = {
	creatingTitle: "Creating local preview copy",
	avcUnsupported:
		"This file already uses H.264/AVC, but this browser does not support the stream's specific profile or parameters. A compatible local preview copy is being created.",
	hevcUnsupported:
		"This file uses HEVC/H.265, which this browser cannot decode. A local H.264/AVC copy is being created for preview.",
	genericUnsupported:
		"This video stream cannot be decoded by this browser. A compatible local H.264/AVC copy is being created for preview.",
	largeFileTitle: "Large local video conversion",
	largeFileDescription:
		"Creating a preview copy may take a while and use significant memory on this device. The original file stays on your device.",
	ready: "Local preview copy is ready",
	failedTitle: "Could not create local preview copy",
	loadFailed:
		"ffmpeg.wasm could not be loaded. Check the network or content-security settings and retry.",
	memoryFailed:
		"The browser ran out of memory while creating the local preview copy. Close memory-heavy tabs or use a smaller file, then retry.",
	workerUnavailable:
		"This browser cannot start the local video worker required for the preview copy.",
	transcodeFailed:
		"The local H.264/AVC preview conversion failed. The original file was still imported and was not uploaded anywhere.",
	retry: "Retry",
	retrying: "Retrying local preview copy",
	preparingExport: "Preparing compatible local source for export",
	renderFallbackFailed:
		"Could not create a compatible full-resolution local video source for export.",
} as const;
