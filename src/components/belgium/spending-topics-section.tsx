import {
  spendingReferenceYear,
  spendingReviewedAt,
  spendingTopics,
} from "@/data/reference/spending-topics";
import { formatCompactCurrency, formatCurrency } from "@/lib/format/money";

const reviewedDate = new Intl.DateTimeFormat("nl-BE", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
}).format(new Date(`${spendingReviewedAt}T00:00:00Z`));

export function SpendingTopicsSection() {
  return (
    <section id="bestedingen" className="mx-auto max-w-content scroll-mt-16 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <h2 className="text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-tight text-foreground">
        Onderwijs, partijen en NAVO
      </h2>
      <p className="mt-2 max-w-2xl text-foreground-muted">
        Hoeveel overheidsgeld gaat hiernaartoe? Deze vergelijking gebruikt {spendingReferenceYear} als
        gemeenschappelijk referentiejaar. Elk bedrag heeft een eigen afbakening en bron.
      </p>

      <dl className="mt-8 divide-y divide-border border-y border-border">
        {spendingTopics.map((topic) => (
          <div key={topic.id} className="grid gap-3 py-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:gap-8">
            <dt className="text-base font-semibold text-foreground">{topic.label}</dt>
            <dd className="min-w-0">
              <p className="text-xl font-semibold tabular-nums text-foreground">
                {topic.status === "Indicatieve budgetraming" ? "Circa " : ""}
                {formatCompactCurrency(topic.amountEUR)}
                <span className="ml-2 text-sm font-normal text-foreground-muted">in {spendingReferenceYear}</span>
              </p>
              <p className="mt-1 text-sm text-foreground-muted">{topic.status}</p>
              <p className="mt-3 text-sm text-foreground-muted">{topic.scope}</p>
              <details className="mt-3 text-sm text-foreground-muted">
                <summary className="cursor-pointer font-medium text-foreground">
                  Afbakening en bronnen voor {topic.label.toLowerCase()}
                </summary>
                <p className="mt-2">{topic.caveat}</p>
                {topic.status !== "Indicatieve budgetraming" ? (
                  <p className="mt-2">Bedrag vóór compacte weergave: {formatCurrency(topic.amountEUR)}.</p>
                ) : null}
                <ul className="mt-3 list-disc space-y-2 pl-5">
                  {topic.sources.map((source) => (
                    <li key={source.url}>
                      <a href={source.url} className="text-accent underline underline-offset-2">
                        {source.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </details>
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-5 max-w-2xl text-sm text-foreground-muted">
        Tel deze bedragen niet bij elkaar op: de afbakeningen kunnen overlappen. De NAVO-norm voor
        defensie-uitgaven is een afspraak over nationale bestedingen, geen lidgeld aan de NAVO.
      </p>
      <p className="mt-2 max-w-2xl text-xs text-foreground-subtle">
        Referentieoverzicht, bronnen gecontroleerd op {reviewedDate}. Dit overzicht wordt handmatig
        bijgewerkt; de uitgaven per functie hierboven volgen de geïmporteerde Eurostat-reeks en kunnen
        door bronherzieningen afwijken.
      </p>
    </section>
  );
}
