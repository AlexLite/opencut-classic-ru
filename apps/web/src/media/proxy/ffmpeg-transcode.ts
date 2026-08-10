export type LocalVideoTranscodePurpose = "preview" | "render";

const PREVIEW_SCALE_FILTER =
	"scale=w='min(1280,iw)':h='min(720,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2";

export function buildLocalVideoTranscodeArgs({
	inputName,
	outputName,
	purpose,
}: {
	inputName: string;
	outputName: string;
	purpose: LocalVideoTranscodePurpose;
}): string[] {
	const previewArgs =
		purpose === "preview"
			? ["-vf", PREVIEW_SCALE_FILTER, "-preset", "veryfast", "-crf", "23"]
			: ["-preset", "fast", "-crf", "18"];

	return [
		"-i",
		inputName,
		"-map",
		"0:v:0",
		"-map",
		"0:a?",
		...previewArgs,
		"-c:v",
		"libx264",
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
