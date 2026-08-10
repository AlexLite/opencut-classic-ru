"use client";

import { Button } from "./ui/button";
import { useTheme } from "next-themes";
import { cn } from "@/utils/ui";
import { Sun03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useI18n } from "@/i18n/use-i18n";

interface ThemeToggleProps {
	className?: string;
	iconClassName?: string;
	onToggle?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export function ThemeToggle({ className, iconClassName, onToggle }: ThemeToggleProps) {
	const { theme, setTheme } = useTheme();
	const { t } = useI18n();
	const nextThemeLabel = theme === "dark" ? t.common.lightMode : t.common.darkMode;

	return (
		<Button
			size="icon"
			variant="ghost"
			className={cn("size-8", className)}
			onClick={(e) => {
				setTheme(theme === "dark" ? "light" : "dark");
				onToggle?.(e);
			}}
			aria-label={nextThemeLabel}
			title={nextThemeLabel}
		>
			<HugeiconsIcon
				icon={Sun03Icon}
				className={cn("!size-[1.1rem]", iconClassName)}
			/>
			<span className="sr-only">{nextThemeLabel}</span>
		</Button>
	);
}
