import { getMessages } from "@/i18n";

/**
 * Production-ready structure for a homepage section whose underlying
 * datasets are not imported yet. Never fills the gap with invented numbers
 * — states plainly what is missing and (optionally) what unlocks it.
 */
export function SectionPlaceholder({
  heading,
  subheading,
  note,
}: {
  heading: string;
  subheading?: string;
  note?: string;
}) {
  const t = getMessages();
  return (
    <section className="mx-auto max-w-content px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <h2 className="text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-tight text-foreground">{heading}</h2>
      {subheading ? <p className="mt-2 max-w-xl text-foreground-muted">{subheading}</p> : null}
      <div className="mt-8 rounded-lg border border-dashed border-border bg-surface-muted p-10 text-center">
        <p className="text-sm text-foreground-subtle">{note ?? t.emptyStates.noData}</p>
      </div>
    </section>
  );
}
