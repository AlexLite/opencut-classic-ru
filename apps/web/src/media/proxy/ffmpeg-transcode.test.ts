import { describe, expect, test } from "bun:test";
import { buildLocalVideoTranscodeArgs } from "./ffmpeg-transcode";

describe("local ffmpeg transcode profiles", () => {
	test("preview creates a bounded H.264/AAC faststart proxy", () => {
		const args = buildLocalVideoTranscodeArgs({
			inputName: "input.mov",
			outputName: "preview.mp4",
			purpose: "preview",
		});

		expect(args).toContain("-vf");
		expect(args.join(" ")).toContain("min(1280,iw)");
		expect(args).toContain("libx264");
		expect(args).toContain("yuv420p");
		expect(args).toContain("avc1");
		expect(args).toContain("128k");
		expect(args).toContain("+faststart");
	});

	test("render keeps source content size and uses a higher quality mezzanine", () => {
		const args = buildLocalVideoTranscodeArgs({
			inputName: "input.mov",
			outputName: "render.mp4",
			purpose: "render",
		});
		const joined = args.join(" ");

		expect(joined).not.toContain("min(1280,iw)");
		expect(joined).toContain("pad=ceil(iw/2)*2:ceil(ih/2)*2");
		expect(args.indexOf("-c:v")).toBeLessThan(args.indexOf("-preset"));
		expect(args).toContain("libx264");
		expect(args).toContain("yuv420p");
		expect(args).toContain("high");
		expect(args).toContain("192k");
		expect(args[args.indexOf("-crf") + 1]).toBe("18");
	});
});
