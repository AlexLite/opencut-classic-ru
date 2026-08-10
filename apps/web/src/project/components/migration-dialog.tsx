"use client";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useEditor } from "@/editor/use-editor";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/i18n/use-i18n";

export function MigrationDialog() {
	const editor = useEditor();
	const migrationState = editor.project.getMigrationState();
	const { t } = useI18n();

	if (!migrationState.isMigrating) return null;

	const title = migrationState.projectName
		? t.projects.migration.updatingProject
		: t.projects.migration.updatingProjects;
	const description = migrationState.projectName
		? `${t.projects.migration.singlePrefix}${migrationState.projectName}${t.projects.migration.singleMiddle}${migrationState.fromVersion}${t.projects.migration.toVersion}${migrationState.toVersion}`
		: `${t.projects.migration.multiplePrefix}${migrationState.fromVersion}${t.projects.migration.toVersion}${migrationState.toVersion}`;

	return (
		<Dialog open={true}>
			<DialogContent
				className="sm:max-w-md"
				onPointerDownOutside={(event) => event.preventDefault()}
				onEscapeKeyDown={(event) => event.preventDefault()}
			>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>

				<div className="flex items-center justify-center py-4">
					<Loader2 className="text-muted-foreground size-8 animate-spin" />
				</div>
			</DialogContent>
		</Dialog>
	);
}
