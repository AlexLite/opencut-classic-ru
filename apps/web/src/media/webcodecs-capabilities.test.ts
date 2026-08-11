import { afterEach, describe, expect, test } from "bun:test";
import {
	canUseThreadedFfmpeg,
	checkVideoDecoderCapability,
	checkVideoEncoderCapability,
} from "./webcodecs-capabilities";

const originalVideoDecoder = globalThis.VideoDecoder;
const originalVideoEncoder = globalThis.VideoEncoder;
const originalCrossOriginIsolated = globalThis.crossOriginIsolated;
const originalSharedArrayBuffer = globalThis.SharedArrayBuffer;

function installVideoDecoderMock({
	supportedCodecs,
	typeSupport = true,
}: {
	supportedCodecs: Set<string>;
	typeSupport?: boolean;
}) {
	class VideoDecoderMock {
		static async isConfigSupported(config: VideoDecoderConfig) {
			return { supported: supportedCodecs.has(config.codec), config };
		}

		static async isTypeSupported() {
			return typeSupport;
		}
	}

	Object.defineProperty(globalThis, "VideoDecoder", {
		configurable: true,
		value: VideoDecoderMock,
	});
}

function installVideoEncoderMock({
	hardwareSupported,
	softwareSupported,
}: {
	hardwareSupported: boolean;
	softwareSupported: boolean;
}) {
	class VideoEncoderMock {
		static async isConfigSupported(config: VideoEncoderConfig) {
			const supported =
				config.hardwareAcceleration === "prefer-hardware"
					? hardwareSupported
					: softwareSupported;
			return { supported, config };
		}
	}

	Object.defineProperty(globalThis, "VideoEncoder", {
		configurable: true,
		value: VideoEncoderMock,
	});
}

afterEach(() => {
	if (originalVideoDecoder === undefined) {
		Reflect.deleteProperty(globalThis, "VideoDecoder");
	} else {
		Object.defineProperty(globalThis, "VideoDecoder", {
			configurable: true,
			value: originalVideoDecoder,
		});
	}
	if (originalVideoEncoder === undefined) {
		Reflect.deleteProperty(globalThis, "VideoEncoder");
	} else {
		Object.defineProperty(globalThis, "VideoEncoder", {
			configurable: true,
			value: originalVideoEncoder,
		});
	}

	Object.defineProperty(globalThis, "crossOriginIsolated", {
		configurable: true,
		value: originalCrossOriginIsolated,
	});
	Object.defineProperty(globalThis, "SharedArrayBuffer", {
		configurable: true,
		value: originalSharedArrayBuffer,
	});
});

describe("WebCodecs decoder capability", () => {
	test("AVC/H.264 supported", async () => {
		installVideoDecoderMock({ supportedCodecs: new Set(["avc1.640028"]) });
		const result = await checkVideoDecoderCapability({
			config: { codec: "avc1.640028", codedWidth: 1920, codedHeight: 1080 },
		});
		expect(result.supported).toBe(true);
		expect(result.hardwareAcceleration).toBe("prefer-hardware");
	});

	test("keeps exact config support authoritative over non-standard type support", async () => {
		installVideoDecoderMock({
			supportedCodecs: new Set(["avc1.640028"]),
			typeSupport: false,
		});
		const result = await checkVideoDecoderCapability({
			config: { codec: "avc1.640028", codedWidth: 1920, codedHeight: 1080 },
		});
		expect(result.supported).toBe(true);
		expect(result.reason).toBe("supported");
	});

	test("AVC/H.264 unsupported", async () => {
		installVideoDecoderMock({ supportedCodecs: new Set() });
		const result = await checkVideoDecoderCapability({
			config: { codec: "avc1.6e0028", codedWidth: 1920, codedHeight: 1080 },
		});
		expect(result.supported).toBe(false);
		expect(result.reason).toBe("config-unsupported");
	});

	test("HEVC unsupported", async () => {
		installVideoDecoderMock({ supportedCodecs: new Set() });
		const result = await checkVideoDecoderCapability({
			config: { codec: "hvc1.1.6.L93.B0", codedWidth: 3840, codedHeight: 2160 },
		});
		expect(result.supported).toBe(false);
	});

	test("WebCodecs unavailable", async () => {
		Reflect.deleteProperty(globalThis, "VideoDecoder");
		const result = await checkVideoDecoderCapability({
			config: { codec: "avc1.640028", codedWidth: 1920, codedHeight: 1080 },
		});
		expect(result).toMatchObject({
			available: false,
			supported: false,
			reason: "webcodecs-unavailable",
		});
	});
});

describe("WebCodecs encoder capability", () => {
	test("prefers hardware when the requested config is supported", async () => {
		installVideoEncoderMock({ hardwareSupported: true, softwareSupported: true });
		const result = await checkVideoEncoderCapability({
			config: {
				codec: "avc1.640034",
				width: 1920,
				height: 1080,
				framerate: 30,
			},
		});
		expect(result.supported).toBe(true);
		expect(result.hardwareAcceleration).toBe("prefer-hardware");
	});

	test("uses no-preference when hardware config is rejected", async () => {
		installVideoEncoderMock({ hardwareSupported: false, softwareSupported: true });
		const result = await checkVideoEncoderCapability({
			config: {
				codec: "avc1.640034",
				width: 1920,
				height: 1080,
				framerate: 30,
			},
		});
		expect(result.supported).toBe(true);
		expect(result.hardwareAcceleration).toBe("no-preference");
	});
});

describe("ffmpeg.wasm threading gate", () => {
	test("requires cross-origin isolation and SharedArrayBuffer", () => {
		Object.defineProperty(globalThis, "crossOriginIsolated", {
			configurable: true,
			value: true,
		});
		Object.defineProperty(globalThis, "SharedArrayBuffer", {
			configurable: true,
			value: class SharedArrayBufferMock {},
		});
		expect(canUseThreadedFfmpeg()).toBe(true);
	});
});
