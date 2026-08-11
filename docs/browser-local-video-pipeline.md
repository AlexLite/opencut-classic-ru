# Local video processing and browser compatibility

OpenCut keeps imported media on the user's device. Video import, preview fallback, effects rendering, encoding, and muxing are browser-side operations. The local fallback must never upload a source `File`, `Blob`, proxy, render mezzanine, or media `ArrayBuffer` to an API.

## Pipeline

```text
import File
  -> inspect container/track with Mediabunny
  -> obtain exact VideoDecoderConfig
  -> VideoDecoder.isConfigSupported(prefer-hardware)
  -> VideoDecoder.isConfigSupported(no-preference) when needed
  -> native decode supported: keep original for preview/export
  -> native decode unsupported: local Worker proxy via ffmpeg.wasm
       -> H.264/AVC (libx264)
       -> 8-bit yuv420p
       -> MP4 + optional AAC + faststart
       -> max 1280x720, aspect ratio preserved
  -> cache preview proxy in OPFS
  -> preview uses proxy only
  -> export re-checks original stream
  -> if original remains unsupported, create temporary full-resolution render mezzanine
       -> H.264/AVC High, 8-bit yuv420p, CRF 18
       -> no downscale; odd dimensions padded by at most one pixel
       -> video-only MP4 + faststart
       -> verify generated stream with VideoDecoder.isConfigSupported()
       -> final audio still comes from original media
  -> render effects locally
  -> WebCodecs VideoEncoder
  -> existing Mediabunny MP4/WebM muxer
  -> discard temporary render mezzanine/object URLs
```

AVC and H.264 are treated as one codec family. Codec decisions use the RFC 6381 parameter string (`avc1...`, `avc3...`, `hvc1...`, `hev1...`) and, for AVC, decoder description/SPS data where available.

## WebCodecs feature detection

The implementation checks:

- `VideoDecoder.isConfigSupported()` using the exact decoder config returned by Mediabunny;
- `VideoEncoder.isConfigSupported()` before export;
- `VideoDecoder.isTypeSupported()` only when a browser exposes that optional/non-standard method;
- `hardwareAcceleration: "prefer-hardware"` first, with `no-preference` as the fallback capability check.

`VideoDecoder.isConfigSupported()` remains authoritative when the optional type probe disagrees with it.

### Hardware acceleration and Mediabunny 1.41

The repository currently resolves Mediabunny **1.41.0**. In this installed API, `VideoSampleSink` and `CanvasSink` do not expose decoder-option parameters for forwarding a `hardwareAcceleration` hint. Passing newer-version `decoderOptions` into those constructors breaks the repository typecheck and is therefore intentionally not done.

The decoder capability layer still probes `prefer-hardware` first so OpenCut knows whether the exact stream can be supported under that preference. Actual preview decoding then uses Mediabunny 1.41's normal browser decoder policy. Explicitly forwarding the decoder hardware hint into the sink would require a separate Mediabunny upgrade and compatibility review.

The encoder path is different: the installed Mediabunny `CanvasSource` supports the video encoding configuration used by the renderer, so the capability-confirmed encoder preference can be used there while preserving the existing muxer pipeline.

`prefer-hardware` is a hint, not a guarantee. Browser/OS/GPU implementations may ignore it, and support for a codec family does not imply support for every profile, level, bit depth, coded size, or stream parameter set.

## Preview proxy versus render mezzanine

The two local transcodes intentionally have different purposes:

- **preview proxy**: at most 1280x720, CRF 23, H.264/AAC MP4, cached in OPFS, used only for interactive preview;
- **render mezzanine**: source content resolution, CRF 18, video-only H.264 MP4, temporary, created only when the original cannot be decoded for final rendering.

The render mezzanine does not downscale. `yuv420p` requires even coded dimensions, so an odd source width/height is padded by at most one pixel rather than resized.

The 720p preview proxy is never used as master media for final export. If the original becomes decodable on another browser/device, export uses the original and skips the mezzanine. When a mezzanine is required, source audio is still decoded from the original media asset, avoiding an unnecessary proxy-audio generation in the final render path.

Temporary render object URLs are revoked after export/cancellation/failure. Video cache entries for replaced media IDs are cleared before and after rendering so a preview decoder is not accidentally reused for the full-resolution source.

## Browser expectations

### Chrome and Edge

WebCodecs is the primary path. H.264/AVC support still depends on the exact stream configuration and OS/GPU codec stack, so each imported stream is checked instead of assuming that all AVC is decodable.

### Safari

Safari supports video WebCodecs on modern releases, with HEVC WebCodecs support depending on Safari/macOS/iOS generation and hardware. OpenCut still performs per-stream capability detection rather than assuming a codec family is universally available.

### Browsers without VideoDecoder/VideoEncoder

The capability layer reports WebCodecs as unavailable instead of throwing during import. ffmpeg.wasm may still be able to generate a compatible local proxy, but the existing Mediabunny preview/export renderer relies on WebCodecs, so browsers without WebCodecs are not complete editing/export targets.

## ffmpeg.wasm Worker and bundle impact

No ffmpeg wrapper package is added to application dependencies. The app owns a small classic Worker at `public/ffmpeg-proxy.worker.js`; it lazily loads pinned ffmpeg core assets only when an unsupported video needs local transcoding.

This keeps the ffmpeg wrapper/internal worker out of the Next.js/Turbopack module graph. The TypeScript app sends the source `File`, selected single/multi-thread mode, temporary local filenames, and internally constructed ffmpeg arguments to the same-origin Worker.

The current fallback uses ffmpeg.wasm core `0.12.10`:

- single-thread: `@ffmpeg/core`;
- multi-thread: `@ffmpeg/core-mt`.

The core is fetched lazily from pinned jsDelivr URLs. Strict-CSP or offline deployments should self-host the same pinned files and change the Worker URLs.

## Threading and COOP/COEP

Multi-thread ffmpeg.wasm is enabled only when both conditions are true:

```js
crossOriginIsolated === true
typeof SharedArrayBuffer !== "undefined"
```

Otherwise the Worker uses the single-thread core. If the multi-thread core fails to load, it retries with the single-thread core before returning a load failure.

The repository deliberately does not enable cross-origin isolation globally. A deployment that wants multi-thread ffmpeg normally needs response headers such as:

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

Do not enable these blindly: `Cross-Origin-Embedder-Policy` can affect third-party images, fonts, auth flows, analytics, and other cross-origin resources.

## Proxy storage and lifecycle

Preview proxies are stored in OPFS under `media-preview-proxies`. The cache key uses file metadata plus hashes of the first and last 64 KiB. Project storage continues to retain the original media asset; the proxy is runtime-only and can be regenerated.

On project reopen, a matching OPFS preview proxy is restored automatically. Full-resolution render mezzanines are not persisted, avoiding hidden large storage consumption.

## Failure handling

Fallback errors are classified into:

- ffmpeg core loading failure;
- input at/above the current 2 GB ffmpeg.wasm limit;
- out-of-memory failure;
- Worker unavailable;
- generic transcode failure.

The current Worker conservatively rejects ffmpeg fallback for files at or above `2_000_000_000` bytes. The original file still imports locally, but retry is not offered because retry cannot change the core limit.

For files below that limit, the Worker currently copies the complete source into ffmpeg's virtual filesystem and can therefore require substantial memory. Files of 750 MiB or more, and devices reporting <=4 GiB memory or <=4 logical processors, receive an early warning.

If preview proxy generation fails, the original remains imported and retry is offered for retryable failures. Export preparation is cancellable; cancelling terminates the local transcode Worker. A generated render mezzanine is capability-checked before rendering.

## Manual browser checks

Use at least these fixtures:

1. H.264/AVC 8-bit yuv420p supported by the browser: no proxy; preview/export use original.
2. H.264/AVC with profile/parameters rejected by `VideoDecoder.isConfigSupported()`: import succeeds, exact AVC message is shown, local preview proxy is created.
3. Export fixture 2: original is re-checked; full-resolution video-only H.264 render mezzanine is generated and verified; audio remains original.
4. Unsupported HEVC: import succeeds; UI explains that a local H.264/AVC copy is being created.
5. Force ffmpeg core load failure: original remains imported and retry is available where useful.
6. Force low-memory/large-file conditions: warning appears and UI remains responsive.
7. Unsupported source >=2 GB: original imports, limit message appears, no pointless retry action is shown.
8. Cancel during render mezzanine creation: Worker terminates and export reports cancellation.
9. Export MP4 in Chrome/Edge and Safari: effects render locally and Mediabunny muxes locally.
10. Reload after preview proxy creation: OPFS proxy is reused; final export still prefers original when decodable.

## Validation notes

The feature was validated in GitHub Actions after Actions were enabled for the repository. A temporary branch-only validation workflow was used and then removed from the PR diff.

Focused validation passes:

- Bun 1.2.18 dependency install;
- ESLint across the complete media diff;
- all newly added media unit tests.

The repository's full TypeScript/build/test baseline still contains unrelated failures outside this media work. The current macOS workflow also fails before Bun in the existing wasm-pack/wasm-opt stage. These baseline issues are tracked separately from this feature and are recorded in the draft PR description.

## References

- WebCodecs specification: https://www.w3.org/TR/webcodecs/
- Mediabunny codec support: https://mediabunny.dev/guide/supported-formats-and-codecs
- Mediabunny reading/decoder config: https://mediabunny.dev/guide/reading-media-files
- Mediabunny video encoding config: https://mediabunny.dev/api/VideoEncodingConfig
- ffmpeg.wasm usage: https://ffmpegwasm.netlify.app/docs/getting-started/usage/
- ffmpeg.wasm FAQ: https://ffmpegwasm.netlify.app/docs/faq/
