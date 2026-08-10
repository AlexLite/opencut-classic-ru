"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Spinner } from "@/components/ui/spinner";
import { PanelView } from "@/components/editor/panels/assets/panel-view";
import {
	Section,
	SectionContent,
	SectionField,
	SectionFields,
} from "@/components/section";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon, CloudUploadIcon } from "@hugeicons/core-free-icons";
import { TRANSCRIPTION_LANGUAGES } from "@/transcription/languages";
import { transcriptionService } from "@/transcription/service";
import {
	TRANSCRIPTION_DIAGNOSTIC_EVENT,
	getTranscriptionDiagnosticsSnapshot,
	type TranscriptionDiagnostic,
} from "@/transcription/diagnostics";
import { extractProjectAudio } from "@/services/renderer/scene-exporter";
import { useEditor } from "@/editor/use-editor";
import { parseSubtitleFile } from "@/subtitles/parse";
import { insertSubtitleCues } from "@/subtitles/insert";
import { useExternalStore } from "@/hooks/use-external-store";
import { useI18n } from "@/i18n/use-i18n";
import type { ProcessingState } from "@/subtitles/types";

const PROCESSING_INITIAL_STATE: ProcessingState = {
	status: "idle",
	step: "",
	error: null,
	warnings: [],
};

const DIAGNOSTIC_BUTTON_VARIANT = {
	info: "secondary",
	warning: "warning",
	error: "destructive",
} as const;

function processingReducer(
	state: ProcessingState,
	action:
		| { type: "start"; step: string }
		| { type: "step"; step: string }
		| { type: "warnings"; warnings: string[] }
		| { type: "finish" }
		| { type: "fail"; error: string },
): ProcessingState {
	switch (action.type) {
		case "start":
			return {
				status: "processing",
				step: action.step,
				error: null,
				warnings: [],
			};
		case "step":
			return { ...state, status: "processing", step: action.step };
		case "warnings":
			return { ...state, warnings: action.warnings };
		case "finish":
			return { ...state, status: "idle", step: "", error: null };
		case "fail":
			return { ...state, status: "idle", step: "", error: action.error };
	}
}

function useProcessingState() {
	const [state, setState] = useState(PROCESSING_INITIAL_STATE);

	const dispatch = (
		action:
			| { type: "start"; step: string }
			| { type: "step"; step: string }
			| { type: "warnings"; warnings: string[] }
			| { type: "finish" }
			| { type: "fail"; error: string },
	) => setState((currentState) => processingReducer(currentState, action));

	return { state, dispatch };
}

export function Captions() {
	const editor = useEditor();
	const { assetsT, locale } = useI18n();
	const captionsT = assetsT.captions;
	const { state: processing, dispatch } = useProcessingState();
	const [selectedLanguage, setSelectedLanguage] = useState<string>("auto");
	const fileInputRef = useRef<HTMLInputElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const activeDiagnostics = useExternalStore({
		eventName: TRANSCRIPTION_DIAGNOSTIC_EVENT,
		getSnapshot: getTranscriptionDiagnosticsSnapshot,
	});
	const isProcessing = processing.status === "processing";
	const languageDisplayNames = useMemo(
		() => new Intl.DisplayNames([locale], { type: "language" }),
		[locale],
	);

	const getDiagnosticMessage = ({
		id,
		fallback,
	}: {
		id: TranscriptionDiagnostic["id"];
		fallback: string;
	}) => {
		if (id === "transcription.no_audio") {
			return captionsT.diagnostics.noAudio;
		}
		return fallback;
	};

	const getAssWarningMessage = ({ warning }: { warning: string }) => {
		const strippedTags = warning.match(
			/^Stripped unsupported ASS inline override tags from (\d+) subtitle cue\(s\)\.$/,
		);
		if (strippedTags) {
			return `${captionsT.warnings.strippedTagsPrefix}${strippedTags[1]}${captionsT.warnings.strippedTagsSuffix}`;
		}
		const eventEffects = warning.match(
			/^Ignored ASS event effects in (\d+) subtitle cue\(s\)\.$/,
		);
		if (eventEffects) {
			return `${captionsT.warnings.eventEffectsPrefix}${eventEffects[1]}${captionsT.warnings.eventEffectsSuffix}`;
		}
		const missingStyles = warning.match(
			/^Fell back to default subtitle styling for (\d+) cue\(s\) that referenced missing ASS styles\.$/,
		);
		if (missingStyles) {
			return `${captionsT.warnings.missingStylesPrefix}${missingStyles[1]}${captionsT.warnings.missingStylesSuffix}`;
		}
		const nonDialogue = warning.match(
			/^Ignored (\d+) non-dialogue ASS event\(s\)\.$/,
		);
		if (nonDialogue) {
			return `${captionsT.warnings.nonDialoguePrefix}${nonDialogue[1]}${captionsT.warnings.nonDialogueSuffix}`;
		}
		if (
			warning ===
			"Ignored unsupported ASS style features such as outline, shadow, rotation, or scaling."
		) {
			return captionsT.warnings.unsupportedStyles;
		}
		return warning;
	};

	const handleGenerateTranscript = async () => {
		if (isProcessing || activeDiagnostics.length > 0) return;

		dispatch({ type: "start", step: captionsT.steps.extractingAudio });

		try {
			const activeProject = editor.project.getActive();
			const activeScene = editor.scenes.getActiveScene();
			const audioBlob = await extractProjectAudio({
				project: activeProject,
				scene: activeScene,
				onProgress: () => undefined,
			});

			dispatch({ type: "step", step: captionsT.steps.preparingAudio });

			const language = selectedLanguage === "auto" ? undefined : selectedLanguage;
			const result = await transcriptionService.transcribe({
				audioBlob,
				language,
				onProgress: ({ step }) => {
					const stepLabels: Record<string, string> = {
						[captionsT.steps.loadingModel]: captionsT.steps.loadingModel,
						[captionsT.steps.transcribing]: captionsT.steps.transcribing,
						[captionsT.steps.generatingCaptions]: captionsT.steps.generatingCaptions,
					};
					dispatch({ type: "step", step: stepLabels[step] ?? step });
				},
			});

			dispatch({ type: "step", step: captionsT.steps.generatingCaptions });
			insertSubtitleCues({
				editor,
				cues: result.cues,
				startTime: 0,
			});
			dispatch({ type: "finish" });
		} catch (error) {
			console.error("Transcription failed:", error);
			dispatch({
				type: "fail",
				error: captionsT.errors.unexpected,
			});
		}
	};

	const handleImportClick = () => {
		if (isProcessing) return;
		fileInputRef.current?.click();
	};

	const handleImportFile = async ({ file }: { file: File }) => {
		dispatch({ type: "start", step: captionsT.steps.readingSubtitle });

		try {
			const result = await parseSubtitleFile({ file });
			if (result.cues.length === 0) {
				throw new Error("Unsupported subtitle format");
			}

			dispatch({ type: "step", step: captionsT.steps.importingCaptions });
			const malformedCount = result.malformedCueCount;
			const warnings = result.warnings.map((warning) =>
				getAssWarningMessage({ warning }),
			);
			if (malformedCount > 0) {
				warnings.unshift(
					`${captionsT.warnings.malformedPrefix}${malformedCount}${captionsT.warnings.malformedSuffix}`,
				);
			}
			dispatch({ type: "warnings", warnings });
			insertSubtitleCues({
				editor,
				cues: result.cues,
				startTime: editor.playback.getCurrentTime(),
			});
			dispatch({ type: "finish" });
		} catch (error) {
			console.error("Subtitle import failed:", error);
			const message =
				error instanceof Error && error.message === "Unsupported subtitle format"
					? captionsT.errors.unsupportedFormat
					: captionsT.errors.unexpected;
			dispatch({ type: "fail", error: message });
		}
	};

	const handleFileChange = async ({
		event,
	}: {
		event: React.ChangeEvent<HTMLInputElement>;
	}) => {
		const file = event.target.files?.[0];
		if (event.target) {
			event.target.value = "";
		}
		if (!file) return;

		await handleImportFile({ file });
	};

	const handleLanguageChange = ({ value }: { value: string }) => {
		if (value === "auto") {
			setSelectedLanguage("auto");
			return;
		}

		const matchedLanguage = TRANSCRIPTION_LANGUAGES.find(
			(language) => language.code === value,
		);
		if (!matchedLanguage) return;
		setSelectedLanguage(matchedLanguage.code);
	};

	const error = processing.status === "idle" ? processing.error : null;
	const warnings = processing.status === "idle" ? processing.warnings : [];

	return (
		<PanelView
			title={captionsT.title}
			contentClassName="px-0 flex flex-col h-full"
			actions={
				<TooltipProvider>
					<div className="flex items-center gap-1.5">
						{!isProcessing &&
							activeDiagnostics.map((diagnostic) => {
								const diagnosticMessage = getDiagnosticMessage({
									id: diagnostic.id,
									fallback: diagnostic.message,
								});
								return (
									<Tooltip key={diagnostic.id}>
										<TooltipTrigger asChild>
											<Button
												variant={DIAGNOSTIC_BUTTON_VARIANT[diagnostic.severity]}
												size="icon"
												aria-label={diagnosticMessage}
											>
												<HugeiconsIcon icon={AlertCircleIcon} size={16} />
											</Button>
										</TooltipTrigger>
										<TooltipContent>{diagnosticMessage}</TooltipContent>
									</Tooltip>
								);
							})}
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={handleImportClick}
							disabled={isProcessing}
							className="items-center justify-center gap-1.5"
						>
							<HugeiconsIcon icon={CloudUploadIcon} />
							{captionsT.import}
						</Button>
					</div>
				</TooltipProvider>
			}
			ref={containerRef}
		>
			<input
				ref={fileInputRef}
				type="file"
				accept=".srt,.ass"
				className="hidden"
				onChange={(event) => void handleFileChange({ event })}
			/>
			<Section
				showTopBorder={false}
				showBottomBorder={false}
				className="flex-1"
			>
				<SectionContent className="flex flex-col gap-4 h-full pt-1">
					<SectionFields>
						<SectionField label={captionsT.language}>
							<Select
								value={selectedLanguage}
								onValueChange={(value) => handleLanguageChange({ value })}
							>
								<SelectTrigger>
									<SelectValue placeholder={captionsT.selectLanguage} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="auto">{captionsT.autoDetect}</SelectItem>
									{TRANSCRIPTION_LANGUAGES.map((language) => (
										<SelectItem key={language.code} value={language.code}>
											{languageDisplayNames.of(language.code) ?? language.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</SectionField>
					</SectionFields>

					<Button
						type="button"
						className="mt-auto w-full"
						onClick={handleGenerateTranscript}
						disabled={isProcessing || activeDiagnostics.length > 0}
					>
						{isProcessing && <Spinner className="mr-1" />}
						{isProcessing ? processing.step : captionsT.generateTranscript}
					</Button>
					{error && (
						<div className="bg-destructive/10 border-destructive/20 rounded-md border p-3">
							<p className="text-destructive text-sm">{error}</p>
						</div>
					)}
					{warnings.length > 0 && (
						<div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-3">
							<ul className="space-y-1 text-sm text-amber-700">
								{warnings.map((warning) => (
									<li key={warning}>{warning}</li>
								))}
							</ul>
						</div>
					)}
				</SectionContent>
			</Section>
		</PanelView>
	);
}
