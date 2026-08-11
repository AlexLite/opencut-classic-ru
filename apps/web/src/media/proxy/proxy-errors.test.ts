import { describe, expect, test } from "bun:test";
import { classifyLocalProxyError, LocalProxyError } from "./proxy-errors";

describe("ffmpeg.wasm fallback failures", () => {
	test("classifies a core loading failure", () => {
		expect(classifyLocalProxyError(new Error("Failed to load ffmpeg core"))).toMatchObject({
			code: "ffmpeg-load-failed",
		});
	});

	test("preserves the explicit input-size limit failure", () => {
		expect(
			classifyLocalProxyError(
				new LocalProxyError("Input exceeds ffmpeg.wasm limit", "input-too-large"),
			),
		).toMatchObject({ code: "input-too-large" });
	});

	test("classifies an out-of-memory failure", () => {
		expect(
			classifyLocalProxyError(new Error("WebAssembly.Memory: out of memory")),
		).toMatchObject({ code: "out-of-memory" });
	});
});
