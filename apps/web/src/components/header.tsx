"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { ThemeToggle } from "./theme-toggle";
import {
	Copy01Icon,
	Download01Icon,
	GithubIcon,
	LinkSquare02Icon,
	Menu02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/utils/ui";
import { DEFAULT_LOGO_URL } from "@/site/brand";
import { SOCIAL_LINKS } from "@/site/social";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "./ui/context-menu";
import { LanguageSwitcher } from "@/i18n/language-switcher";
import { useI18n } from "@/i18n/use-i18n";

export function Header() {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const { siteT } = useI18n();
	const closeMenu = () => setIsMenuOpen(false);

	const links = [
		{
			label: siteT.header.roadmap,
			href: "/roadmap",
		},
		{
			label: siteT.header.contributors,
			href: "/contributors",
		},
		{
			label: siteT.header.sponsors,
			href: "/sponsors",
		},
		{
			label: siteT.header.blog,
			href: "/blog",
		},
	];

	return (
		<header className="bg-background shadow-background/85 sticky top-0 z-10 shadow-[0_30px_35px_15px_rgba(0,0,0,1)]">
			<div className="relative flex w-full items-center justify-between px-6 pt-4">
				<div className="relative z-10 flex items-center gap-6">
					<ContextMenu>
						<ContextMenuTrigger asChild>
							<Link href="/" className="flex items-center gap-3">
								<Image
									src={DEFAULT_LOGO_URL}
									alt={siteT.header.logoAlt}
									className="invert dark:invert-0"
									width={32}
									height={32}
								/>
							</Link>
						</ContextMenuTrigger>
						<ContextMenuContent>
							<ContextMenuItem
								onClick={async () => {
									const res = await fetch(DEFAULT_LOGO_URL);
									const svg = await res.text();
									await navigator.clipboard.writeText(svg);
								}}
							>
								<HugeiconsIcon icon={Copy01Icon} />
								{siteT.header.copySvg}
							</ContextMenuItem>
							<ContextMenuItem
								onClick={() => {
									const a = document.createElement("a");
									a.href = DEFAULT_LOGO_URL;
									a.download = "opencut-logo.svg";
									a.click();
							}}
							>
								<HugeiconsIcon icon={Download01Icon} />
								{siteT.header.downloadSvg}
							</ContextMenuItem>
							<Link href="/brand">
								<ContextMenuItem>
									<HugeiconsIcon icon={LinkSquare02Icon} />
									{siteT.header.brandAssets}
								</ContextMenuItem>
							</Link>
						</ContextMenuContent>
					</ContextMenu>

					<nav className="hidden items-center gap-4 lg:flex">
						{links.map((link) => (
							<Link key={link.href} href={link.href}>
								<Button variant="text" className="p-0 text-sm">
									{link.label}
								</Button>
							</Link>
						))}
					</nav>
				</div>

				<div className="relative z-10">
					<div className="flex items-center gap-3 lg:hidden">
						<LanguageSwitcher />
						<Button
							variant="text"
							size="icon"
							className="flex items-center justify-center p-0"
							onClick={() => setIsMenuOpen(!isMenuOpen)}
							aria-label={
								isMenuOpen ? siteT.header.closeMenu : siteT.header.openMenu
							}
							aria-expanded={isMenuOpen}
						>
							<HugeiconsIcon icon={Menu02Icon} size={30} />
						</Button>
					</div>
					<div className="hidden items-center gap-3 lg:flex">
						<Link href={SOCIAL_LINKS.github}>
							<Button className="bg-background text-sm" variant="outline">
								<HugeiconsIcon icon={GithubIcon} className="size-4" />
								40k+
							</Button>
						</Link>
						<Link href="/projects">
							<Button className="text-sm">
								{siteT.header.projects}
								<ArrowRight className="size-4" />
							</Button>
						</Link>
						<LanguageSwitcher />
						<ThemeToggle />
					</div>
				</div>
				<div
					className={cn(
						"bg-background/20 pointer-events-none fixed inset-0 opacity-0 backdrop-blur-3xl",
						"transition-opacity duration-150",
						isMenuOpen && "pointer-events-auto opacity-100",
					)}
				>
					<div className="relative h-full">
						<button
							type="button"
							aria-label={siteT.header.closeMenu}
							className="absolute inset-0"
							onClick={closeMenu}
							onKeyDown={(event) => {
								if (
									event.key === "Enter" ||
									event.key === " " ||
									event.key === "Escape"
								) {
									event.preventDefault();
									closeMenu();
								}
							}}
						/>
						<nav className="flex flex-col gap-3 px-6 pt-[5rem]">
							{links.map((link, index) => (
								<motion.div
									key={link.href}
									initial={{ scale: 0.98, opacity: 0 }}
									animate={{
										scale: isMenuOpen ? 1 : 0.98,
										opacity: isMenuOpen ? 1 : 0,
									}}
									transition={{
										duration: 0.4,
										delay: isMenuOpen ? index * 0.1 : 0,
										ease: [0.25, 0.46, 0.45, 0.94],
									}}
								>
									<Link
										href={link.href}
										className="text-2xl font-semibold"
										onClick={() => setIsMenuOpen(false)}
									>
										{link.label}
									</Link>
								</motion.div>
							))}
						</nav>
						<ThemeToggle
							className="absolute right-8 bottom-8 size-10"
							iconClassName="!size-[1.2rem]"
							onToggle={(e) => {
								e.preventDefault();
								e.stopPropagation();
							}}
						/>
					</div>
				</div>
			</div>
		</header>
	);
}
