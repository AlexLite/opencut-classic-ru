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
import { useStoragePersistence } from "@/services/storage/use-storage-persistence";
import { useI18n } from "@/i18n/use-i18n";

export function StoragePersistenceDialog() {
	const { showDialog, onConfirm, onDismiss } = useStoragePersistence();
	const { t } = useI18n();

	return (
		<Dialog open={showDialog} onOpenChange={(open) => !open && onDismiss()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{t.storage.persistenceTitle}</DialogTitle>
				</DialogHeader>
				<DialogBody>
					<p className="text-base text-muted-foreground">
						{t.storage.persistenceWarning}
					</p>
					<p className="text-base text-muted-foreground">
						{t.storage.persistenceQuestion}
					</p>
				</DialogBody>
				<DialogFooter>
					<Button variant="outline" onClick={onDismiss}>
						{t.storage.notNow}
					</Button>
					<Button onClick={onConfirm}>{t.storage.allow}</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
