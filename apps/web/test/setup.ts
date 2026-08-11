import { mock } from "bun:test";

class TestOffscreenCanvas {
	constructor(
		readonly width: number,
		readonly height: number,
	) {}

	getContext(contextId: string) {
		if (contextId !== "2d") return null;

		return {
			font: "",
			textBaseline: "alphabetic",
			letterSpacing: "0px",
			save() {},
			restore() {},
			measureText(text: string) {
				return {
					width: text.length * 10,
					actualBoundingBoxAscent: 8,
					actualBoundingBoxDescent: 2,
				} as TextMetrics;
			},
		} as unknown as OffscreenCanvasRenderingContext2D;
	}
}

Object.defineProperty(globalThis, "OffscreenCanvas", {
	configurable: true,
	writable: true,
	value: TestOffscreenCanvas,
});

const TICKS_PER_SECOND = 120_000;
const TICKS_PER_CENTISECOND = TICKS_PER_SECOND / 100;

type FrameRate = {
	numerator: number;
	denominator: number;
};

type TimeCodeFormat =
	| "MM:SS"
	| "HH:MM:SS"
	| "HH:MM:SS:CS"
	| "HH:MM:SS:FF";

function roundHalfAwayFromZero(value: number): number {
	const magnitude = Math.round(Math.abs(value));
	return value < 0 ? -magnitude : magnitude;
}

function ticksPerFrame(rate: FrameRate | undefined): number | undefined {
	if (!rate || rate.numerator <= 0 || rate.denominator <= 0) {
		return undefined;
	}

	const tickNumerator = TICKS_PER_SECOND * rate.denominator;
	if (tickNumerator % rate.numerator !== 0) {
		return undefined;
	}

	return tickNumerator / rate.numerator;
}

function floorToFrame({
	time,
	rate,
}: {
	time: number;
	rate: FrameRate;
}): number | undefined {
	const frameTicks = ticksPerFrame(rate);
	if (frameTicks === undefined) return undefined;
	return Math.floor(time / frameTicks) * frameTicks;
}

function roundToFrame({
	time,
	rate,
}: {
	time: number;
	rate: FrameRate;
}): number | undefined {
	const frameTicks = ticksPerFrame(rate);
	if (frameTicks === undefined) return undefined;

	const floorFrame = Math.floor(time / frameTicks);
	const floorTicks = floorFrame * frameTicks;
	const remainder = time - floorTicks;
	const frame = remainder * 2 >= frameTicks ? floorFrame + 1 : floorFrame;
	return frame * frameTicks;
}

function mediaTimeFromFrame({
	frame,
	rate,
}: {
	frame: number;
	rate: FrameRate;
}): number | undefined {
	const frameTicks = ticksPerFrame(rate);
	return frameTicks === undefined ? undefined : frame * frameTicks;
}

function mediaTimeToFrame({
	time,
	rate,
}: {
	time: number;
	rate: FrameRate;
}): number | undefined {
	const frameTicks = ticksPerFrame(rate);
	if (frameTicks === undefined) return undefined;

	const floorFrame = Math.floor(time / frameTicks);
	const floorTicks = floorFrame * frameTicks;
	const remainder = time - floorTicks;
	return remainder * 2 >= frameTicks ? floorFrame + 1 : floorFrame;
}

function parseTimecode({
	timeCode,
	format = "HH:MM:SS:CS",
	rate,
}: {
	timeCode: string;
	format?: TimeCodeFormat;
	rate?: FrameRate;
}): number | undefined {
	const trimmed = timeCode.trim();
	if (!trimmed) return undefined;

	const parts = trimmed.split(":").map((part) => Number(part));
	if (parts.some((part) => !Number.isInteger(part) || part < 0)) {
		return undefined;
	}

	if (format === "MM:SS") {
		if (parts.length !== 2) return undefined;
		const [minutes, seconds] = parts;
		if (seconds >= 60) return undefined;
		return (minutes * 60 + seconds) * TICKS_PER_SECOND;
	}

	if (format === "HH:MM:SS") {
		if (parts.length !== 3) return undefined;
		const [hours, minutes, seconds] = parts;
		if (minutes >= 60 || seconds >= 60) return undefined;
		return (hours * 3600 + minutes * 60 + seconds) * TICKS_PER_SECOND;
	}

	if (parts.length !== 4) return undefined;
	const [hours, minutes, seconds, subsecond] = parts;
	if (minutes >= 60 || seconds >= 60) return undefined;

	const wholeSecondsTicks =
		(hours * 3600 + minutes * 60 + seconds) * TICKS_PER_SECOND;

	if (format === "HH:MM:SS:CS") {
		if (subsecond >= 100) return undefined;
		return wholeSecondsTicks + subsecond * TICKS_PER_CENTISECOND;
	}

	const frameTicks = ticksPerFrame(rate);
	if (frameTicks === undefined || !rate) return undefined;
	if (subsecond >= Math.ceil(rate.numerator / rate.denominator)) {
		return undefined;
	}
	return wholeSecondsTicks + subsecond * frameTicks;
}

mock.module("opencut-wasm", () => ({
	TICKS_PER_SECOND: () => TICKS_PER_SECOND,
	mediaTimeFromSeconds: ({ seconds }: { seconds: number }) =>
		Number.isFinite(seconds)
			? roundHalfAwayFromZero(seconds * TICKS_PER_SECOND)
			: undefined,
	mediaTimeToSeconds: ({ time }: { time: number }) => time / TICKS_PER_SECOND,
	mediaTimeFromFrame,
	mediaTimeToFrame,
	roundToFrame,
	floorToFrame,
	isFrameAligned: ({ time, rate }: { time: number; rate: FrameRate }) => {
		const frameTicks = ticksPerFrame(rate);
		return frameTicks === undefined ? undefined : time % frameTicks === 0;
	},
	lastFrameTime: ({ duration, rate }: { duration: number; rate: FrameRate }) => {
		if (duration <= 0) return 0;
		return floorToFrame({ time: duration - 1, rate });
	},
	snappedSeekTime: ({
		time,
		duration,
		rate,
	}: {
		time: number;
		duration: number;
		rate: FrameRate;
	}) => {
		const snapped = roundToFrame({ time, rate });
		return snapped === undefined
			? undefined
			: Math.min(Math.max(snapped, 0), duration);
	},
	parseTimecode,
}));
