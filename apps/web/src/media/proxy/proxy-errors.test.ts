import { describe, expect, test } from "bun:test";
import { classifyLocalProxyError } from "./proxy-errors";

describe("ffmpeg.wasm fallback failures", () => {
	test("classifies a core loading failure", () => {
		expect(classifyLocalProxyError(new Error("Failed to load ffmpeg core"))).toMatchObject({
			code: "ffmpeg-load-failed",
		});
	});

	test("classifies an out-of-memory failure", () => {
		expect(
			classifyLocalProxyError(new Error("WebAssembly.Memory: out of memory")),
		).toMatchObject({ code: "out-of-memory" });
	});
});
