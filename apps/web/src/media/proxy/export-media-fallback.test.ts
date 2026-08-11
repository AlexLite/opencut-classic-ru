import { describe, expect, test } from "bun:test";
import type { SceneTracks } from "@/timeline";
import { collectExportVideoMediaIds } from "./export-media-fallback";

describe("export media fallback selection", () => {
	test("collects only visible video assets used by visual tracks", () => {
		const tracks = {
			main: {
				hidden: false,
				elements: [
					{ type: "video", mediaId: "main-video" },
					{ type: "image", mediaId: "image" },
				],
			},
			overlay: [
				{
					hidden: false,
					elements: [
						{ type: "video", mediaId: "overlay-video" },
						{ type: "video", mediaId: "hidden-element", hidden: true },
					],
				},
				{
					hidden: true,
					elements: [{ type: "video", mediaId: "hidden-track" }],
				},
			],
			audio: [],
		};

		// This unit only reads track visibility, element type/mediaId and hidden.
		// Keep the fixture intentionally minimal instead of constructing unrelated timeline fields.
		// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
		const sceneTracks = tracks as unknown as SceneTracks;

		expect([...collectExportVideoMediaIds({ tracks: sceneTracks })].sort()).toEqual([
			"main-video",
			"overlay-video",
		]);
	});
});
