import Link from "next/link";
import { getMessages } from "@/i18n";
import { getHundredEuroRevenue, getHundredEuroExpenditure, type HundredEuroDisplayCategory } from "@/server/queries/finance";

export async function HundredEuroBreakdown() {
  const t = getMessages();
  const [revenue, expenditure] = await Promise.all([getHundredEuroRevenue(), getHundredEuroExpenditure()]);

  const unavailable = !revenue.available && !expenditure.available;

  return (
    <section className="mx-auto max-w-content px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <h2 className="text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-tight text-foreground">
        {t.hundredEuro.heading}
      </h2>
      <p className="mt-2 max-w-xl text-foreground-muted">{t.hundredEuro.subheading}</p>

      {unavailable ? (
        <div className="mt-8 rounded-lg border border-dashed border-border bg-surface-muted p-10 text-center">
          <p className="text-sm text-foreground-subtle">{t.hundredEuro.unavailable}</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          <BreakdownColumn
            title={t.hundredEuro.revenueTitle}
            year={revenue.available ? revenue.year : null}
            categories={revenue.available ? revenue.categories : []}
            reason={!revenue.available ? revenue.reason : undefined}
            residualNote={revenue.available ? revenue.residualNote : undefined}
            detailHref="/belgie#belastingen"
          />
          <BreakdownColumn
            title={t.hundredEuro.expenditureTitle}
            year={expenditure.available ? expenditure.year : null}
            categories={expenditure.available ? expenditure.categories : []}
            reason={!expenditure.available ? expenditure.reason : undefined}
            detailHref="/belgie#cofog"
          />
        </div>
      )}
    </section>
  );
}

function BreakdownColumn({
  title,
  year,
  categories,
  reason,
  residualNote,
  detailHref,
}: {
  title: string;
  year: number | null;
  categories: HundredEuroDisplayCategory[];
  reason?: string;
  residualNote?: string;
  detailHref: string;
}) {
  if (categories.length === 0) {
    return (
      <div className="rounded-md border border-border bg-surface p-5">
        <h3 className="text-sm font-medium text-foreground-muted">{title}</h3>
        <p className="mt-3 text-sm text-foreground-subtle">{reason}</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-surface p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium text-foreground-muted">{title}</h3>
        {year ? <span className="text-xs text-foreground-subtle">{year}</span> : null}
      </div>
      <ul className="mt-4 space-y-2">
        {categories.map((c) => (
          <li key={c.code} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-foreground">{c.label}</span>
            <span className="tabular-nums font-medium text-foreground">{c.amountPer100}</span>
          </li>
        ))}
      </ul>
      {residualNote ? <p className="mt-4 text-xs text-foreground-subtle">{residualNote}</p> : null}
      <Link href={detailHref} className="mt-4 inline-block text-sm font-medium text-accent underline underline-offset-2">
        Bekijk detail →
      </Link>
    </div>
  );
}
