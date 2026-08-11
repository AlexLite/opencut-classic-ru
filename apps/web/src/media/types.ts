import type { MediaAssetData } from "@/services/storage/types";
import type { VideoCodecInfo } from "./codec-info";
import type { LocalProxyFailureCode } from "./proxy/proxy-errors";

export type MediaType = "image" | "video" | "audio";

export interface MediaAsset
	extends Omit<MediaAssetData, "size" | "lastModified"> {
	file: File;
	url?: string;
	previewFile?: File;
	previewUrl?: string;
	nativeDecodable?: boolean;
	sourceCodecInfo?: VideoCodecInfo;
	proxyFallbackFailure?: LocalProxyFailureCode;
}
