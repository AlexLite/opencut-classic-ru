"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { ClockIcon } from "lucide-react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import {
	Form,
	FormField,
	FormItem,
	FormControl,
	clearFormDraft,
} from "@/components/ui/form";
import type { FeedbackEntry } from "../types";
import { useI18n } from "@/i18n/use-i18n";

const PERSIST_KEY = "feedback-draft";
const HISTORY_KEY = "feedback-history";
const MAX_HISTORY = 20;

interface FeedbackFormValues {
	message: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function isFeedbackEntry(value: unknown): value is FeedbackEntry {
	return (
		isRecord(value) &&
		typeof value.id === "string" &&
		typeof value.message === "string" &&
		typeof value.createdAt === "string"
	);
}

function readHistory(): FeedbackEntry[] {
	try {
		const stored = localStorage.getItem(HISTORY_KEY);
		if (!stored) return [];

		const parsed: unknown = JSON.parse(stored);
		if (!Array.isArray(parsed)) return [];
		return parsed.filter(isFeedbackEntry).slice(0, MAX_HISTORY);
	} catch {
		return [];
	}
}

function writeHistory({ entries }: { entries: FeedbackEntry[] }): void {
	try {
		localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
	} catch {
		// localStorage may be full or unavailable
	}
}

function useFeedback() {
	const [entries, setEntries] = useState<FeedbackEntry[]>(readHistory);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const { editorT } = useI18n();

	async function submit({
		values,
		onSuccess,
	}: {
		values: FeedbackFormValues;
		onSuccess: () => void;
	}) {
		if (isSubmitting) return;
		setIsSubmitting(true);

		try {
			const res = await fetch("/api/feedback", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(values),
			});

			if (!res.ok) {
				throw new Error(`Feedback request failed with status ${res.status}`);
			}

			const responseData: unknown = await res.json();
			if (!isRecord(responseData) || !isFeedbackEntry(responseData.entry)) {
				throw new Error("Feedback response has an invalid shape");
			}

			const next = [responseData.entry, ...entries].slice(0, MAX_HISTORY);
			setEntries(next);
			writeHistory({ entries: next });
			onSuccess();
			toast.success(editorT.feedback.sent);
		} catch (error) {
			console.error("Failed to send feedback:", error);
			toast.error(editorT.feedback.failed);
		} finally {
			setIsSubmitting(false);
		}
	}

	return { entries, isSubmitting, submit };
}

export function FeedbackPopover() {
	const [open, setOpen] = useState(false);
	const { editorT } = useI18n();

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button variant="outline" className="h-8">
					{editorT.feedback.sendFeedback}
				</Button>
			</PopoverTrigger>
			<PopoverContent align="end" className="w-80 p-0">
				<FeedbackPopoverContent onClose={() => setOpen(false)} />
			</PopoverContent>
		</Popover>
	);
}

type View = "compose" | "history";

function FeedbackPopoverContent({ onClose }: { onClose: () => void }) {
	const { entries, isSubmitting, submit } = useFeedback();
	const [view, setView] = useState<View>("compose");
	const { editorT } = useI18n();

	const form = useForm<FeedbackFormValues>({
		defaultValues: { message: "" },
	});
	const message = useWatch({ control: form.control, name: "message" });
	const hasMessage = Boolean(message?.trim());

	async function handleSubmit(values: FeedbackFormValues) {
		await submit({
			values,
			onSuccess: () => {
				form.reset({ message: "" });
				clearFormDraft({ key: PERSIST_KEY });
				onClose();
			},
		});
	}

	if (view === "history") {
		return (
			<div className="flex flex-col">
				<div
					className="max-h-72 overflow-y-auto divide-y"
					style={{
						maskImage:
							"linear-gradient(to bottom, black 80%, transparent 100%)",
					}}
				>
					{entries.map((entry) => (
						<FeedbackEntryItem key={entry.id} entry={entry} />
					))}
				</div>
				<div className="border-t px-3 py-2">
					<button
						type="button"
						onClick={() => setView("compose")}
						className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
					>
						← {editorT.feedback.back}
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col">
			<Form persistKey={PERSIST_KEY} {...form}>
				<form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col">
					<FormField
						control={form.control}
						name="message"
						render={({ field }) => (
							<FormItem>
								<FormControl>
									<Textarea
										placeholder={editorT.feedback.placeholder}
										className="min-h-[7rem] text-sm p-3 bg-background shadow-none border-none! resize-none"
										{...field}
									/>
								</FormControl>
							</FormItem>
						)}
					/>
					<div className="flex items-center justify-between border-t px-3 py-2">
						{entries.length > 0 ? (
							<button
								type="button"
								onClick={() => setView("history")}
								className="flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
							>
								<ClockIcon className="size-3" />
								{entries.length}
							</button>
						) : (
							<span />
						)}
						<div className="flex gap-2">
							{!hasMessage && (
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={onClose}
								>
									{editorT.feedback.cancel}
								</Button>
							)}
							<Button
								type="submit"
								size="sm"
								disabled={isSubmitting || !hasMessage}
							>
								{isSubmitting ? <Spinner /> : editorT.feedback.send}
							</Button>
						</div>
					</div>
				</form>
			</Form>
		</div>
	);
}

function relativeDate(iso: string, intlLocale: string): string {
	const diff = Date.now() - new Date(iso).getTime();
	const mins = Math.floor(diff / 60_000);
	const relative = new Intl.RelativeTimeFormat(intlLocale, {
		numeric: "auto",
		style: "short",
	});
	if (mins < 1) return relative.format(0, "minute");
	if (mins < 60) return relative.format(-mins, "minute");
	const hrs = Math.floor(mins / 60);
	if (hrs < 24) return relative.format(-hrs, "hour");
	const days = Math.floor(hrs / 24);
	if (days < 7) return relative.format(-days, "day");
	return new Intl.DateTimeFormat(intlLocale, {
		month: "short",
		day: "numeric",
	}).format(new Date(iso));
}

function FeedbackEntryItem({ entry }: { entry: FeedbackEntry }) {
	const { intlLocale } = useI18n();
	return (
		<div className="px-3 py-2.5">
			<p className="text-sm text-muted-foreground leading-snug whitespace-pre-wrap break-words">
				{entry.message}
			</p>
			<span className="mt-1 block text-[11px] text-muted-foreground/50">
				{relativeDate(entry.createdAt, intlLocale)}
			</span>
		</div>
	);
}
