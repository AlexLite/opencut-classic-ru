import { describe, expect, test } from "bun:test";
import {
	inspectVideoCodec,
	isAvcCodec,
	normalizeVideoCodecFamily,
} from "./codec-info";

describe("codec family normalization", () => {
	test.each(["avc", "h264", "H.264", "avc1.640028", "avc3.4d401f"])(
		"treats %s as AVC/H.264",
		(codec) => {
			expect(normalizeVideoCodecFamily(codec)).toBe("avc");
			expect(isAvcCodec(codec)).toBe(true);
		},
	);

	test("detects HEVC family", () => {
		expect(normalizeVideoCodecFamily("hvc1.1.6.L93.B0")).toBe("hevc");
	});
});

describe("codec details", () => {
	test("reads AVC profile and level from RFC 6381 codec string", () => {
		expect(
			inspectVideoCodec({
				codec: "avc",
				decoderConfig: {
					codec: "avc1.640028",
					codedWidth: 1920,
					codedHeight: 1080,
				},
			}),
		).toMatchObject({
			family: "avc",
			profile: "High",
			level: "4",
			bitDepth: 8,
			pixelFormat: "yuv420p",
		});
	});
});
