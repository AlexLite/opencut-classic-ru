export type LocalVideoTranscodePurpose = "preview" | "render";

const PREVIEW_SCALE_FILTER =
	"scale=w='min(1280,iw)':h='min(720,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2";
const RENDER_EVEN_DIMENSION_FILTER =
	"pad=ceil(iw/2)*2:ceil(ih/2)*2";

export function buildLocalVideoTranscodeArgs({
	inputName,
	outputName,
	purpose,
}: {
	inputName: string;
	outputName: string;
	purpose: LocalVideoTranscodePurpose;
}): string[] {
	const purposeArgs =
		purpose === "preview"
			? ["-vf", PREVIEW_SCALE_FILTER, "-preset", "veryfast", "-crf", "23"]
			: [
					"-vf",
					RENDER_EVEN_DIMENSION_FILTER,
					"-preset",
					"fast",
					"-crf",
					"18",
				];

	return [
		"-i",
		inputName,
		"-map",
		"0:v:0",
		"-map",
		"0:a?",
		"-c:v",
		"libx264",
		...purposeArgs,
		"-pix_fmt",
		"yuv420p",
		"-profile:v",
		"high",
		"-tag:v",
		"avc1",
		"-c:a",
		"aac",
		"-b:a",
		purpose === "preview" ? "128k" : "192k",
		"-movflags",
		"+faststart",
		outputName,
	];
}
