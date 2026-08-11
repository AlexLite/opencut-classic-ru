"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n/use-i18n";

export function DeleteProjectDialog({
	isOpen,
	onOpenChange,
	onConfirm,
	projectNames,
}: {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
	projectNames: string[];
}) {
	const count = projectNames.length;
	const isSingle = count === 1;
	const singleName = isSingle ? projectNames[0] : null;
	const { t, plural } = useI18n();
	const projectCountLabel = plural(count, t.projects.projectCountForms);

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent
				onOpenAutoFocus={(event) => {
					event.preventDefault();
					event.stopPropagation();
				}}
			>
				<DialogHeader>
					<DialogTitle>
						{singleName ? (
							<>
								{t.projects.deleteDialog.titleSinglePrefix}
								<span className="inline-block max-w-[300px] truncate align-bottom">
									{singleName}
								</span>
								{t.projects.deleteDialog.titleSingleSuffix}
							</>
						) : (
							`${t.projects.deleteDialog.titleMultiplePrefix}${count} ${projectCountLabel}${t.projects.deleteDialog.titleMultipleSuffix}`
						)}
					</DialogTitle>
				</DialogHeader>
				<DialogBody>
					<Alert variant="destructive">
						<AlertTitle>{t.projects.deleteDialog.warning}</AlertTitle>
						<AlertDescription>
							{singleName
								? `${t.projects.deleteDialog.descriptionSinglePrefix}${singleName}${t.projects.deleteDialog.descriptionSingleSuffix}`
								: `${t.projects.deleteDialog.descriptionMultiplePrefix}${count} ${projectCountLabel}${t.projects.deleteDialog.descriptionMultipleSuffix}`}
						</AlertDescription>
					</Alert>
					<div className="flex flex-col gap-3">
						<Label className="text-xs font-semibold text-slate-500">
							{t.projects.deleteDialog.confirmPrompt}
						</Label>
						<Input
							type="text"
							placeholder={t.projects.deleteDialog.confirmValue}
							size="lg"
							variant="destructive"
						/>
					</div>
				</DialogBody>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						{t.common.cancel}
					</Button>
					<Button variant="destructive" onClick={onConfirm}>
						{t.projects.deleteDialog.deleteProject}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
