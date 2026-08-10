import { ALL_FORMATS, BlobSource, Input } from "mediabunny";
import { inspectVideoCodec, type VideoCodecInfo } from "./codec-info";
import {
	checkVideoDecoderCapability,
	type VideoDecoderCapability,
} from "./webcodecs-capabilities";

export interface VideoDecodeInspection {
	codecInfo: VideoCodecInfo;
	decoderConfig: VideoDecoderConfig | null;
	capability: VideoDecoderCapability;
}

export async function inspectVideoDecodeCapability({
	file,
}: {
	file: File;
}): Promise<VideoDecodeInspection> {
	const input = new Input({
		source: new BlobSource(file),
		formats: ALL_FORMATS,
	});

	try {
		const videoTrack = await input.getPrimaryVideoTrack();
		if (!videoTrack) {
			throw new Error("No video track found in the file");
		}

		const [codec, decoderConfig] = await Promise.all([
			videoTrack.getCodec(),
			videoTrack.getDecoderConfig(),
		]);
		const codecInfo = inspectVideoCodec({ codec, decoderConfig });
		const capability = await checkVideoDecoderCapability({ config: decoderConfig });

		return { codecInfo, decoderConfig, capability };
	} finally {
		input.dispose();
	}
}
