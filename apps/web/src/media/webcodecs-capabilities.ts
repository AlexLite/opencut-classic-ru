export type HardwareAccelerationPreference =
	| "prefer-hardware"
	| "no-preference";

export interface VideoDecoderCapability {
	available: boolean;
	supported: boolean;
	hardwareAcceleration: HardwareAccelerationPreference | null;
	config: VideoDecoderConfig | null;
	reason:
		| "supported"
		| "webcodecs-unavailable"
		| "type-unsupported"
		| "config-unsupported"
		| "invalid-config";
}

export interface VideoEncoderCapability {
	available: boolean;
	supported: boolean;
	hardwareAcceleration: HardwareAccelerationPreference | null;
	config: VideoEncoderConfig | null;
	reason:
		| "supported"
		| "webcodecs-unavailable"
		| "config-unsupported"
		| "invalid-config";
}

type VideoDecoderConstructorWithTypeSupport = typeof VideoDecoder & {
	isTypeSupported?: (type: string) => boolean | Promise<boolean>;
};

async function isDecoderTypeSupportedIfAvailable({
	decoder,
	codec,
}: {
	decoder: VideoDecoderConstructorWithTypeSupport;
	codec: string;
}): Promise<boolean | null> {
	if (typeof decoder.isTypeSupported !== "function") return null;
	try {
		return await decoder.isTypeSupported(codec);
	} catch {
		// isTypeSupported() is non-standard and its accepted argument differs between
		// implementations. isConfigSupported() remains the authoritative check.
		return null;
	}
}

async function checkDecoderConfig({
	decoder,
	config,
	hardwareAcceleration,
}: {
	decoder: typeof VideoDecoder;
	config: VideoDecoderConfig;
	hardwareAcceleration: HardwareAccelerationPreference;
}): Promise<VideoDecoderSupport | null> {
	try {
		return await decoder.isConfigSupported({
			...config,
			hardwareAcceleration,
		});
	} catch {
		return null;
	}
}

export async function checkVideoDecoderCapability({
	config,
}: {
	config: VideoDecoderConfig | null;
}): Promise<VideoDecoderCapability> {
	if (typeof globalThis.VideoDecoder === "undefined") {
		return {
			available: false,
			supported: false,
			hardwareAcceleration: null,
			config: null,
			reason: "webcodecs-unavailable",
		};
	}
	if (!config?.codec) {
		return {
			available: true,
			supported: false,
			hardwareAcceleration: null,
			config: null,
			reason: "invalid-config",
		};
	}

	const decoder = globalThis.VideoDecoder as VideoDecoderConstructorWithTypeSupport;
	const typeSupported = await isDecoderTypeSupportedIfAvailable({
		decoder,
		codec: config.codec,
	});

	const hardware = await checkDecoderConfig({
		decoder,
		config,
		hardwareAcceleration: "prefer-hardware",
	});
	if (hardware?.supported) {
		return {
			available: true,
			supported: true,
			hardwareAcceleration: "prefer-hardware",
			config: hardware.config ?? null,
			reason: "supported",
		};
	}

	const fallback = await checkDecoderConfig({
		decoder,
		config,
		hardwareAcceleration: "no-preference",
	});
	if (fallback?.supported) {
		return {
			available: true,
			supported: true,
			hardwareAcceleration: "no-preference",
			config: fallback.config ?? null,
			reason: "supported",
		};
	}

	return {
		available: true,
		supported: false,
		hardwareAcceleration: null,
		config: fallback?.config ?? hardware?.config ?? null,
		reason:
			hardware === null && fallback === null
				? "invalid-config"
				: typeSupported === false
					? "type-unsupported"
					: "config-unsupported",
	};
}

async function checkEncoderConfig({
	encoder,
	config,
	hardwareAcceleration,
}: {
	encoder: typeof VideoEncoder;
	config: VideoEncoderConfig;
	hardwareAcceleration: HardwareAccelerationPreference;
}): Promise<VideoEncoderSupport | null> {
	try {
		return await encoder.isConfigSupported({
			...config,
			hardwareAcceleration,
		});
	} catch {
		return null;
	}
}

export async function checkVideoEncoderCapability({
	config,
}: {
	config: VideoEncoderConfig;
}): Promise<VideoEncoderCapability> {
	if (typeof globalThis.VideoEncoder === "undefined") {
		return {
			available: false,
			supported: false,
			hardwareAcceleration: null,
			config: null,
			reason: "webcodecs-unavailable",
		};
	}

	const encoder = globalThis.VideoEncoder;
	const hardware = await checkEncoderConfig({
		encoder,
		config,
		hardwareAcceleration: "prefer-hardware",
	});
	if (hardware?.supported) {
		return {
			available: true,
			supported: true,
			hardwareAcceleration: "prefer-hardware",
			config: hardware.config ?? null,
			reason: "supported",
		};
	}

	const fallback = await checkEncoderConfig({
		encoder,
		config,
		hardwareAcceleration: "no-preference",
	});
	if (fallback?.supported) {
		return {
			available: true,
			supported: true,
			hardwareAcceleration: "no-preference",
			config: fallback.config ?? null,
			reason: "supported",
		};
	}

	return {
		available: true,
		supported: false,
		hardwareAcceleration: null,
		config: fallback?.config ?? hardware?.config ?? null,
		reason:
			hardware === null && fallback === null
				? "invalid-config"
				: "config-unsupported",
	};
}

export function canUseThreadedFfmpeg(): boolean {
	return (
		globalThis.crossOriginIsolated === true &&
		typeof globalThis.SharedArrayBuffer !== "undefined"
	);
}
