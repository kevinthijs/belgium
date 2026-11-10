import { getMessages } from "@/i18n";
import { getLatestDataUpdates } from "@/server/queries/homepage";

export async function DataUpdates() {
  const t = getMessages();
  const updates = await getLatestDataUpdates();

  return (
    <section className="mx-auto max-w-content px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <h2 className="text-[clamp(1.5rem,2.5vw,2rem)] font-semibold tracking-tight text-foreground">
        {t.dataUpdates.heading}
      </h2>

      {updates.length === 0 ? (
        <p className="mt-4 text-sm text-foreground-subtle">{t.dataUpdates.empty}</p>
      ) : (
        <ul className="mt-6 divide-y divide-border rounded-lg border border-border bg-surface">
          {updates.map((update) => (
            <li key={update.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
              <div>
                <p className="font-medium text-foreground">{update.datasetName}</p>
                <p className="text-foreground-subtle">
                  {update.organisation}
                  {update.latestPeriod ? ` · ${update.latestPeriod}` : ""}
                </p>
              </div>
              <p className="tabular-nums text-xs text-foreground-subtle">
                {update.completedAt ? new Date(update.completedAt).toLocaleDateString("nl-BE") : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
