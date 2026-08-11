import type { VideoCodec } from "mediabunny";

export type VideoCodecFamily =
	| "avc"
	| "hevc"
	| "vp8"
	| "vp9"
	| "av1"
	| "unknown";

export interface VideoCodecInfo {
	codec: VideoCodec | string | null;
	codecString: string | null;
	family: VideoCodecFamily;
	profile: string | null;
	level: string | null;
	bitDepth: number | null;
	pixelFormat: string | null;
}

const AVC_HIGH_PROFILE_IDS = new Set([
	44, 83, 86, 100, 110, 118, 122, 128, 134, 135, 138, 139, 244,
]);

const AVC_PROFILE_NAMES: Record<number, string> = {
	44: "CAVLC 4:4:4 Intra",
	66: "Baseline",
	77: "Main",
	83: "Scalable Baseline",
	86: "Scalable High",
	88: "Extended",
	100: "High",
	110: "High 10",
	118: "Multiview High",
	122: "High 4:2:2",
	128: "Stereo High",
	134: "MFC High",
	135: "MFC Depth High",
	138: "Multiview Depth High",
	139: "Enhanced Multiview Depth High",
	244: "High 4:4:4 Predictive",
};

const HEVC_PROFILE_NAMES: Record<number, string> = {
	1: "Main",
	2: "Main 10",
	3: "Main Still Picture",
};

class BitReader {
	private bitOffset = 0;

	constructor(private readonly bytes: Uint8Array) {}

	readBits(count: number): number {
		let value = 0;
		for (let i = 0; i < count; i += 1) {
			const byteOffset = this.bitOffset >> 3;
			if (byteOffset >= this.bytes.length) {
				throw new Error("Unexpected end of H.264 SPS");
			}
			const bitInByte = 7 - (this.bitOffset & 7);
			value = (value << 1) | ((this.bytes[byteOffset] >> bitInByte) & 1);
			this.bitOffset += 1;
		}
		return value;
	}

	readUnsignedExpGolomb(): number {
		let leadingZeroBits = 0;
		while (this.readBits(1) === 0) {
			leadingZeroBits += 1;
			if (leadingZeroBits > 31) {
				throw new Error("Invalid H.264 Exp-Golomb value");
			}
		}

		if (leadingZeroBits === 0) return 0;
		return (1 << leadingZeroBits) - 1 + this.readBits(leadingZeroBits);
	}
}

function normalizeCodecString(value: string | null | undefined): string | null {
	const trimmed = value?.trim();
	return trimmed ? trimmed.toLowerCase() : null;
}

export function normalizeVideoCodecFamily(
	codec: VideoCodec | string | null | undefined,
): VideoCodecFamily {
	const normalized = normalizeCodecString(codec);
	if (!normalized) return "unknown";

	if (
		normalized === "avc" ||
		normalized === "h264" ||
		normalized === "h.264" ||
		normalized.startsWith("avc1") ||
		normalized.startsWith("avc3")
	) {
		return "avc";
	}
	if (
		normalized === "hevc" ||
		normalized === "h265" ||
		normalized === "h.265" ||
		normalized.startsWith("hvc1") ||
		normalized.startsWith("hev1")
	) {
		return "hevc";
	}
	if (normalized === "vp8" || normalized.startsWith("vp08")) return "vp8";
	if (normalized === "vp9" || normalized.startsWith("vp09")) return "vp9";
	if (normalized === "av1" || normalized.startsWith("av01")) return "av1";
	return "unknown";
}

export function isAvcCodec(codec: VideoCodec | string | null | undefined): boolean {
	return normalizeVideoCodecFamily(codec) === "avc";
}

export function isHevcCodec(codec: VideoCodec | string | null | undefined): boolean {
	return normalizeVideoCodecFamily(codec) === "hevc";
}

function toUint8Array(
	description: VideoDecoderConfig["description"],
): Uint8Array | null {
	if (!description) return null;
	if (description instanceof ArrayBuffer) return new Uint8Array(description);
	if (ArrayBuffer.isView(description)) {
		return new Uint8Array(
			description.buffer,
			description.byteOffset,
			description.byteLength,
		);
	}
	return null;
}

function removeEmulationPreventionBytes(bytes: Uint8Array): Uint8Array {
	const result: number[] = [];
	for (let i = 0; i < bytes.length; i += 1) {
		if (
			i >= 2 &&
			bytes[i] === 0x03 &&
			bytes[i - 1] === 0x00 &&
			bytes[i - 2] === 0x00
		) {
			continue;
		}
		result.push(bytes[i]);
	}
	return new Uint8Array(result);
}

function pixelFormatFromChroma({
	chromaFormatIdc,
	bitDepth,
}: {
	chromaFormatIdc: number;
	bitDepth: number;
}): string | null {
	const base =
		chromaFormatIdc === 0
			? "gray"
			: chromaFormatIdc === 1
				? "yuv420p"
				: chromaFormatIdc === 2
					? "yuv422p"
					: chromaFormatIdc === 3
						? "yuv444p"
						: null;
	if (!base) return null;
	if (bitDepth === 8) return base;
	return `${base}${bitDepth}le`;
}

function readAvcSpsFromDecoderDescription(
	description: VideoDecoderConfig["description"],
): {
	profileIdc: number;
	levelIdc: number;
	bitDepth: number;
	pixelFormat: string | null;
} | null {
	const bytes = toUint8Array(description);
	if (!bytes || bytes.length < 8 || bytes[0] !== 1) return null;

	try {
		let offset = 5;
		const numSps = bytes[offset] & 0x1f;
		offset += 1;
		if (numSps < 1 || offset + 2 > bytes.length) return null;

		const spsLength = (bytes[offset] << 8) | bytes[offset + 1];
		offset += 2;
		if (spsLength < 4 || offset + spsLength > bytes.length) return null;

		const rawSps = bytes.subarray(offset, offset + spsLength);
		const rbsp = removeEmulationPreventionBytes(rawSps);
		const reader = new BitReader(rbsp);

		reader.readBits(8); // NAL header
		const profileIdc = reader.readBits(8);
		reader.readBits(8); // constraint flags + reserved bits
		const levelIdc = reader.readBits(8);
		reader.readUnsignedExpGolomb(); // seq_parameter_set_id

		let chromaFormatIdc = 1;
		let bitDepth = 8;
		if (AVC_HIGH_PROFILE_IDS.has(profileIdc)) {
			chromaFormatIdc = reader.readUnsignedExpGolomb();
			if (chromaFormatIdc === 3) {
				reader.readBits(1); // separate_colour_plane_flag
			}
			bitDepth = 8 + reader.readUnsignedExpGolomb();
			reader.readUnsignedExpGolomb(); // bit_depth_chroma_minus8
		}

		return {
			profileIdc,
			levelIdc,
			bitDepth,
			pixelFormat: pixelFormatFromChroma({ chromaFormatIdc, bitDepth }),
		};
	} catch {
		return null;
	}
}

function parseAvcCodecString(codecString: string | null): {
	profileIdc: number | null;
	levelIdc: number | null;
} {
	if (!codecString) return { profileIdc: null, levelIdc: null };
	const match = /^(?:avc1|avc3)\.([0-9a-f]{6})$/i.exec(codecString);
	if (!match) return { profileIdc: null, levelIdc: null };
	return {
		profileIdc: Number.parseInt(match[1].slice(0, 2), 16),
		levelIdc: Number.parseInt(match[1].slice(4, 6), 16),
	};
}

function formatAvcLevel(levelIdc: number | null): string | null {
	if (levelIdc === null) return null;
	return (levelIdc / 10).toFixed(levelIdc % 10 === 0 ? 0 : 1);
}

function parseHevcCodecString(codecString: string | null): {
	profile: string | null;
	level: string | null;
	bitDepth: number | null;
	pixelFormat: string | null;
} {
	if (!codecString) {
		return { profile: null, level: null, bitDepth: null, pixelFormat: null };
	}
	const match = /^(?:hvc1|hev1)\.(\d+)(?:\.[^.]+)*\.([lh])(\d+)/i.exec(
		codecString,
	);
	if (!match) {
		return { profile: null, level: null, bitDepth: null, pixelFormat: null };
	}

	const profileId = Number.parseInt(match[1], 10);
	const levelIdc = Number.parseInt(match[3], 10);
	const bitDepth = profileId === 2 ? 10 : profileId === 1 ? 8 : null;
	return {
		profile: HEVC_PROFILE_NAMES[profileId] ?? `Profile ${profileId}`,
		level: Number.isFinite(levelIdc)
			? (levelIdc / 30).toFixed(levelIdc % 30 === 0 ? 0 : 1)
			: null,
		bitDepth,
		pixelFormat: bitDepth === 10 ? "yuv420p10le" : bitDepth === 8 ? "yuv420p" : null,
	};
}

export function inspectVideoCodec({
	codec,
	decoderConfig,
}: {
	codec: VideoCodec | string | null;
	decoderConfig?: VideoDecoderConfig | null;
}): VideoCodecInfo {
	const codecString = normalizeCodecString(decoderConfig?.codec ?? codec);
	const family = normalizeVideoCodecFamily(codecString ?? codec);

	if (family === "avc") {
		const fromString = parseAvcCodecString(codecString);
		const fromSps = readAvcSpsFromDecoderDescription(decoderConfig?.description);
		const profileIdc = fromSps?.profileIdc ?? fromString.profileIdc;
		const levelIdc = fromSps?.levelIdc ?? fromString.levelIdc;
		return {
			codec,
			codecString,
			family,
			profile:
				profileIdc === null
					? null
					: AVC_PROFILE_NAMES[profileIdc] ?? `Profile ${profileIdc}`,
			level: formatAvcLevel(levelIdc),
			bitDepth: fromSps?.bitDepth ?? 8,
			pixelFormat: fromSps?.pixelFormat ?? "yuv420p",
		};
	}

	if (family === "hevc") {
		const hevc = parseHevcCodecString(codecString);
		return {
			codec,
			codecString,
			family,
			...hevc,
		};
	}

	return {
		codec,
		codecString,
		family,
		profile: null,
		level: null,
		bitDepth: null,
		pixelFormat: null,
	};
}
