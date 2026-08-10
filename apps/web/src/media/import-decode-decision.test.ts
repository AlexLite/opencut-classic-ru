import { describe, expect, test } from "bun:test";
import { resolveImportDecodability } from "./import-decode-decision";

describe("resolveImportDecodability", () => {
	test("keeps original when both checks support decoding", () => {
		expect(
			resolveImportDecodability({
				mediabunnyCanDecode: true,
				webCodecsSupported: true,
			}),
		).toBe(true);
	});

	test("creates fallback when exact WebCodecs check rejects the stream", () => {
		expect(
			resolveImportDecodability({
				mediabunnyCanDecode: true,
				webCodecsSupported: false,
			}),
		).toBe(false);
	});

	test("creates fallback when Mediabunny cannot use the stream", () => {
		expect(
			resolveImportDecodability({
				mediabunnyCanDecode: false,
				webCodecsSupported: true,
			}),
		).toBe(false);
	});

	test("uses whichever successful check is available", () => {
		expect(resolveImportDecodability({ webCodecsSupported: true })).toBe(true);
		expect(resolveImportDecodability({ mediabunnyCanDecode: true })).toBe(true);
	});

	test("fails closed when neither inspection completed", () => {
		expect(resolveImportDecodability({})).toBe(false);
	});
});
