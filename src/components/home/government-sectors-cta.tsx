import Link from "next/link";

/**
 * Minimal homepage CTA for the `/belgie#overheidsniveaus` section (Phase 19)
 * — deliberately lightweight, no data fetching here. Replaces the earlier
 * "Wie beheert het geld?" placeholder now that DF_NFGOV_DISS is imported.
 */
export function GovernmentSectorsCta() {
  return (
    <section className="mx-auto max-w-content px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <h2 className="text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-tight text-foreground">
        Wie beheert het geld?
      </h2>
      <p className="mt-2 max-w-xl text-foreground-muted">
        Belgische overheidsfinanciën bestaan uit verschillende bestuursniveaus: de federale overheid, de
        gemeenschappen en gewesten, de lokale overheden en de sociale zekerheid.
      </p>
      <div className="mt-8 rounded-lg border border-border bg-surface-muted p-10 text-center">
        <Link
          href="/belgie#overheidsniveaus"
          className="inline-flex items-center gap-1 text-sm font-medium text-foreground underline underline-offset-2 hover:text-foreground-muted"
        >
          Bekijk de verdeling per overheidsniveau
        </Link>
      </div>
    </section>
  );
}
