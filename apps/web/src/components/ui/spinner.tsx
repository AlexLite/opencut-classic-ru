"use client";

import { HugeiconsIcon, type HugeiconsIconProps } from "@hugeicons/react";
import { Loading03Icon } from "@hugeicons/core-free-icons";
import { useI18n } from "@/i18n/use-i18n";
import { cn } from "@/utils/ui";

function Spinner({ className, ...props }: Omit<HugeiconsIconProps, "icon">) {
	const { t } = useI18n();

	return (
		<HugeiconsIcon
			icon={Loading03Icon}
			role="status"
			aria-label={t.common.loading}
			className={cn("size-4 animate-spin", className)}
			{...props}
		/>
	);
}

export { Spinner };
