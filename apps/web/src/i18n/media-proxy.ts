import { mediaProxyEn } from "./locales/en/media-proxy";
import { mediaProxyRu } from "./locales/ru/media-proxy";
import { useLocaleStore } from "./store";

export function getMediaProxyMessages() {
	return useLocaleStore.getState().locale === "ru" ? mediaProxyRu : mediaProxyEn;
}
