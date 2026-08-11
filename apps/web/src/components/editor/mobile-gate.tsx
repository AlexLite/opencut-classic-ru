"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Button } from "../ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/use-i18n";

const STORAGE_KEY = "mobile-acknowledged";
const MOBILE_QUERY = "(max-width: 1023px)";
const LOCAL_CHANGE_EVENT = "opencut-mobile-gate-change";
let sessionAcknowledged = false;

interface MobileGateProps {
	children: React.ReactNode;
}

function subscribe(onStoreChange: () => void) {
	const mediaQuery = window.matchMedia(MOBILE_QUERY);
	const handleStorage = (event: StorageEvent) => {
		if (event.key === STORAGE_KEY) onStoreChange();
	};

	mediaQuery.addEventListener("change", onStoreChange);
	window.addEventListener("storage", handleStorage);
	window.addEventListener(LOCAL_CHANGE_EVENT, onStoreChange);

	return () => {
		mediaQuery.removeEventListener("change", onStoreChange);
		window.removeEventListener("storage", handleStorage);
		window.removeEventListener(LOCAL_CHANGE_EVENT, onStoreChange);
	};
}

function getSnapshot() {
	let acknowledged = sessionAcknowledged;
	try {
		acknowledged ||= localStorage.getItem(STORAGE_KEY) === "true";
	} catch {
		// localStorage unavailable; session acknowledgement still works.
	}
	return window.matchMedia(MOBILE_QUERY).matches && !acknowledged;
}

function getServerSnapshot(): boolean | null {
	return null;
}

export function MobileGate({ children }: MobileGateProps) {
	const router = useRouter();
	const show = useSyncExternalStore<boolean | null>(
		subscribe,
		getSnapshot,
		getServerSnapshot,
	);
	const { t } = useI18n();

	if (show === null) return null;
	if (!show) return <>{children}</>;

	const handleContinue = () => {
		sessionAcknowledged = true;
		try {
			localStorage.setItem(STORAGE_KEY, "true");
		} catch {
			// Persisting the acknowledgement is optional for this session.
		}
		window.dispatchEvent(new Event(LOCAL_CHANGE_EVENT));
	};

	const handleGoBack = () => {
		router.back();
	};

	return (
		<div className="bg-background relative flex h-screen w-screen flex-col overflow-hidden">
			<Button
				variant="text"
				className="absolute top-6 left-6 flex items-center gap-1 text-muted-foreground"
				onClick={handleGoBack}
			>
				<HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
				<span className="text-sm">{t.mobile.goBack}</span>
			</Button>

			<div className="flex flex-1 flex-col justify-center gap-5 px-7">
				<div className="flex flex-col gap-3">
					<h1 className="text-foreground text-3xl font-bold tracking-tight">
						{t.mobile.title}
					</h1>
					<p className="text-muted-foreground text-sm leading-relaxed">
						{t.mobile.description}
					</p>
				</div>
				<div className="flex items-center gap-3">
					<Button onClick={handleContinue}>{t.mobile.continue}</Button>
					<Button variant="ghost" asChild>
						<Link href="/roadmap" className="flex items-center gap-1">
							{t.mobile.roadmap}
							<HugeiconsIcon icon={ArrowRight01Icon} size={14} />
						</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
