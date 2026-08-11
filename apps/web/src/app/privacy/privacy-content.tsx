"use client";

import { BasePage } from "@/app/base-page";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { useI18n } from "@/i18n/use-i18n";
import { SOCIAL_LINKS } from "@/site/social";

const LAST_UPDATED = new Date("2026-03-15T12:00:00Z");

export function PrivacyContent() {
	const { legalT, formatDate } = useI18n();
	const t = legalT.privacy;
	const common = legalT.common;

	return (
		<BasePage title={t.title} description={t.description}>
			<Accordion type="single" collapsible className="w-full">
				<AccordionItem value="quick-summary" className="rounded-2xl border px-5">
					<AccordionTrigger className="no-underline!">
						{common.quickSummary}
					</AccordionTrigger>
					<AccordionContent>
						<h3 className="mb-3 text-lg font-medium">{t.summaryTitle}</h3>
						<ol className="list-decimal space-y-2 pl-6">
							{Object.values(t.summaryItems).map((item) => (
								<li key={item}>{item}</li>
							))}
						</ol>
						<p className="mt-4">
							{common.questionsEmailPrefix}{" "}
							<a href="mailto:oss@opencut.app" className="text-primary hover:underline">
								oss@opencut.app
							</a>
						</p>
					</AccordionContent>
				</AccordionItem>
			</Accordion>

			<section className="flex flex-col gap-3">
				<h2 className="text-2xl font-semibold">{t.content.title}</h2>
				<p>
					<strong>{t.content.strong}</strong> {t.content.text}
				</p>
			</section>

			<section className="flex flex-col gap-3">
				<h2 className="text-2xl font-semibold">{t.accounts.title}</h2>
				<p>{t.accounts.paragraphOne}</p>
				<p>{t.accounts.paragraphTwo}</p>
				<p>{t.accounts.paragraphThree}</p>
			</section>

			<section className="flex flex-col gap-3">
				<h2 className="text-2xl font-semibold">{t.analytics.title}</h2>
				<p>
					{t.analytics.beforeDatabuddy}{" "}
					<a
						href="https://www.databuddy.cc"
						target="_blank"
						rel="noopener noreferrer"
						className="text-primary hover:underline"
					>
						Databuddy
					</a>{" "}
					{t.analytics.afterDatabuddy}
				</p>
				<p>{t.analytics.paragraphTwo}</p>
			</section>

			<section className="flex flex-col gap-3">
				<h2 className="text-2xl font-semibold">{t.storage.title}</h2>
				<p>{t.storage.intro}</p>
				<ul className="list-disc space-y-2 pl-6">
					{Object.values(t.storage.items).map((item) => (
						<li key={item}>{item}</li>
					))}
				</ul>
				<p>{t.storage.outro}</p>
			</section>

			<section className="flex flex-col gap-3">
				<h2 className="text-2xl font-semibold">{t.thirdParty.title}</h2>
				<p>{t.thirdParty.intro}</p>
				<ul className="list-disc space-y-2 pl-6">
					<li>
						<strong>Vercel:</strong> {t.thirdParty.vercel}
					</li>
					<li>
						<strong>Databuddy:</strong> {t.thirdParty.databuddy}
					</li>
				</ul>
			</section>

			<section className="flex flex-col gap-3">
				<h2 className="text-2xl font-semibold">{t.rights.title}</h2>
				<p>{t.rights.intro}</p>
				<ul className="list-disc space-y-2 pl-6">
					{Object.values(t.rights.items).map((item) => (
						<li key={item}>{item}</li>
					))}
				</ul>
			</section>

			<section className="flex flex-col gap-3">
				<h2 className="text-2xl font-semibold">{t.openSource.title}</h2>
				<p>{t.openSource.paragraphOne}</p>
				<p>
					{t.openSource.viewSourcePrefix}{" "}
					<a
						href={SOCIAL_LINKS.github}
						target="_blank"
						rel="noopener noreferrer"
						className="text-primary hover:underline"
					>
						GitHub
					</a>
					.
				</p>
			</section>

			<section className="flex flex-col gap-3">
				<h2 className="text-2xl font-semibold">{t.contact.title}</h2>
				<p>{t.contact.intro}</p>
				<p>
					{t.contact.issuePrefix}{" "}
					<a
						href={`${SOCIAL_LINKS.github}/issues`}
						target="_blank"
						rel="noopener noreferrer"
						className="text-primary hover:underline"
					>
						{common.githubRepository}
					</a>
					, {t.contact.emailPrefix}{" "}
					<a href="mailto:oss@opencut.app" className="text-primary hover:underline">
						oss@opencut.app
					</a>
					, {t.contact.xPrefix}{" "}
					<a
						href={SOCIAL_LINKS.x}
						target="_blank"
						rel="noopener noreferrer"
						className="text-primary hover:underline"
					>
						{common.xTwitter}
					</a>
					.
				</p>
			</section>

			<Separator />
			<p className="text-muted-foreground text-sm">
				{common.lastUpdated}: {formatDate(LAST_UPDATED, { year: "numeric", month: "long", day: "numeric" })}
			</p>
		</BasePage>
	);
}
