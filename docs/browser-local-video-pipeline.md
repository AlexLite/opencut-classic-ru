# Local video processing and browser compatibility

OpenCut keeps imported media on the user's device. Video import, preview fallback, effects rendering, encoding, and muxing are browser-side operations. The local fallback must never upload a source `File`, `Blob`, or media `ArrayBuffer` to an API.

## Pipeline

```text
import File
  -> inspect container/track with Mediabunny
  -> obtain the exact VideoDecoderConfig
  -> VideoDecoder.isConfigSupported(prefer-hardware)
  -> VideoDecoder.isConfigSupported(no-preference) when needed
  -> native decode supported: keep original for preview and export
  -> native decode unsupported: transcode a local preview proxy in a Worker
       -> H.264/AVC (libx264)
       -> 8-bit yuv420p
       -> MP4
       -> AAC when audio is present
       -> faststart
       -> max 1280x720 while preserving aspect ratio
  -> cache preview proxy in OPFS using a fingerprint of the original file
  -> preview uses proxy only
  -> export re-checks the original stream when capability is unknown/unsupported
  -> if original decode is still unsupported, create a temporary full-resolution local render mezzanine
       -> H.264/AVC High, 8-bit yuv420p
       -> source resolution is preserved
       -> AAC audio
       -> MP4 faststart
       -> verify the generated stream with VideoDecoder.isConfigSupported()
  -> render effects locally
  -> WebCodecs VideoEncoder (prefer-hardware)
  -> existing Mediabunny MP4/WebM muxer
  -> discard temporary render mezzanine/object URLs after export
```

AVC and H.264 are treated as the same codec family. Codec decisions use the RFC 6381 parameter string (`avc1...`, `avc3...`, `hvc1...`, `hev1...`) and, for AVC, the decoder description/SPS where available.

## WebCodecs feature detection

The implementation checks:

- `VideoDecoder.isConfigSupported()` with the exact decoder config returned by Mediabunny;
- `VideoEncoder.isConfigSupported()` before export;
- `VideoDecoder.isTypeSupported()` only when a browser exposes that non-standard method;
- `hardwareAcceleration: "prefer-hardware"` first, with a `no-preference` capability fallback for decode probing.

`prefer-hardware` is a hint. A browser may ignore it, and a supported codec family does not imply that every profile, level, bit depth, resolution, or platform decoder path is supported.

## Preview proxy versus render mezzanine

The preview proxy and the export fallback intentionally have different purposes:

- **preview proxy**: at most 1280x720, CRF 23, cached in OPFS, used only for interactive preview;
- **render mezzanine**: source resolution, CRF 18, temporary, created only when the original cannot be decoded for final rendering.

The 720p preview proxy is never used as the master source for final export. If the original stream becomes decodable (for example after reopening the project on a different browser/device), export uses the original and skips the render mezzanine.

Temporary render object URLs are revoked after export. Video decoder cache entries for affected media IDs are cleared before and after rendering so an existing preview decoder cannot be accidentally reused for the full-resolution render source.

## Browser expectations

### Chrome and Edge

WebCodecs is the primary path. H.264/AVC support still depends on the exact stream configuration and the OS/GPU codec stack, so every imported track is checked rather than assuming that all AVC files are decodable.

### Safari

Safari has shipped video WebCodecs since Safari 16.4. Safari 17.4 expanded WebCodecs support to HEVC. The implementation still performs per-stream capability detection because codec availability and supported profiles can differ by macOS/iOS version and hardware.

### Browsers without VideoDecoder/VideoEncoder

The capability layer reports WebCodecs as unavailable instead of throwing during import. ffmpeg.wasm can still create a compatible proxy, but the Mediabunny preview/export renderer itself relies on WebCodecs; therefore a browser with no WebCodecs implementation at all is not a fully supported editing target.

## ffmpeg.wasm Worker and bundle impact

The application bundle adds only the `@ffmpeg/ffmpeg` and `@ffmpeg/util` JavaScript wrappers. The heavy ffmpeg core is loaded lazily only when an unsupported video needs local transcoding.

The current fallback uses ffmpeg.wasm core `0.12.10`:

- single-thread: `@ffmpeg/core`;
- multi-thread: `@ffmpeg/core-mt`.

The official ffmpeg.wasm example describes the core download as roughly 31 MB. Multi-thread mode requires `SharedArrayBuffer`, and the implementation enables it only when both `crossOriginIsolated === true` and `SharedArrayBuffer` are available.

The core files are downloaded from jsDelivr at runtime. Deployments with a strict CSP or offline requirements should self-host the same pinned core files and update the Worker base URLs.

## COOP/COEP for multi-thread ffmpeg.wasm

The repository does not currently enable cross-origin isolation globally. Therefore normal deployments use the single-thread core unless the host already supplies the required isolation headers.

A deployment that wants the multi-thread core normally needs responses such as:

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

After enabling them, verify in DevTools:

```js
crossOriginIsolated === true
typeof SharedArrayBuffer !== "undefined"
```

Do not enable these headers blindly. `Cross-Origin-Embedder-Policy` changes which third-party resources may be loaded; existing images, fonts, authentication flows, analytics, or other integrations must be tested for CORS/CORP compatibility.

## Proxy storage and lifecycle

Preview proxies are stored in OPFS under `media-preview-proxies`. A cache key is derived from file metadata plus hashes of the first and last 64 KiB. Project metadata continues to persist the original media asset; the proxy is runtime-only and can be regenerated.

When a project is reopened, an existing matching OPFS preview proxy is restored automatically. Decoder capability is re-checked before final export when runtime capability metadata is unavailable. Full-resolution render mezzanines are deliberately not persisted in OPFS to avoid silently consuming large amounts of browser storage.

Object URLs for preview proxies are revoked when project media is cleared. Object URLs for render mezzanines are revoked immediately after export or cancellation/failure.

## Failure handling

Proxy/render fallback errors are classified into:

- ffmpeg core loading failure;
- out-of-memory failure;
- Worker unavailable;
- generic transcode failure.

The original file remains imported if preview proxy creation fails. The UI offers a retry action after the media asset has been saved. Very large files (750 MiB or more) and devices reporting <=4 GiB device memory or <=4 logical processors receive an early warning.

Final export is cancellable while a render mezzanine is being generated: cancelling terminates the local Worker. A generated render mezzanine is capability-checked before rendering; export fails with a localized error instead of continuing with an undecodable temporary source.

ffmpeg.wasm is substantially slower and more memory-hungry than native FFmpeg. The current Worker writes the source into the ffmpeg virtual filesystem, so very large files can require multiple copies of the file in memory. This applies especially to full-resolution render fallbacks. For multi-gigabyte production media, a future improvement should mount the source through WORKERFS/streaming I/O instead of copying the complete file into WASM memory.

## Manual browser checks

Use at least these fixtures:

1. H.264/AVC 8-bit yuv420p that the browser supports: no proxy; preview and export use the original.
2. H.264/AVC profile/parameters rejected by `VideoDecoder.isConfigSupported()`: import succeeds; exact AVC message is shown; local preview proxy progress reaches completion; preview uses the proxy.
3. Export the fixture from step 2: export re-checks the original, creates a full-resolution local render mezzanine, verifies it, renders effects, then encodes/muxes locally.
4. HEVC stream rejected by the browser: import succeeds; UI explains that a local H.264/AVC preview copy is being created; export uses a full-resolution local H.264 render fallback if the original remains undecodable.
5. Force ffmpeg core loading failure (offline/CSP): original stays imported; localized retry action is available for preview and export reports a localized render-fallback failure when applicable.
6. Force low-memory/large-file conditions: warning is shown and the UI remains responsive.
7. Cancel export while the render mezzanine is being created: the Worker terminates and export reports cancellation rather than a transcode error.
8. Export MP4 in Chrome/Edge and Safari where available: effects render locally; WebCodecs encoder is detected; Mediabunny muxes locally.
9. Reload the project after a preview proxy was created: OPFS preview proxy is reused rather than retranscoded; final export still prefers the original if it is decodable.

## References

- WebCodecs specification: https://www.w3.org/TR/webcodecs/
- Mediabunny codec support: https://mediabunny.dev/guide/supported-formats-and-codecs
- Mediabunny reading/decoder config: https://mediabunny.dev/guide/reading-media-files
- ffmpeg.wasm usage: https://ffmpegwasm.netlify.app/docs/getting-started/usage/
- ffmpeg.wasm API: https://ffmpegwasm.netlify.app/docs/api/ffmpeg/classes/ffmpeg/
- Chrome WebCodecs guidance: https://developer.chrome.com/docs/web-platform/best-practices/webcodecs
- WebKit Safari 17.2 notes: https://webkit.org/blog/14787/webkit-features-in-safari-17-2/
- WebKit Safari 17.4 notes: https://webkit.org/blog/15063/webkit-features-in-safari-17-4/
