import { PublicAdministrationSummary } from "@/components/belgium/public-administration-comparison";
import { Suspense } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { HomeHero } from "@/components/home/home-hero";
import { BelgiumOverview } from "@/components/home/belgium-overview";
import { SectionPlaceholder } from "@/components/home/section-placeholder";
import { GovernmentSectorsCta } from "@/components/home/government-sectors-cta";
import { HundredEuroBreakdown } from "@/components/home/hundred-euro-breakdown";
import { CofogBreakdown } from "@/components/home/cofog-breakdown";
import { DebtHistory } from "@/components/home/debt-history";
import { NeighbourComparison } from "@/components/home/neighbour-comparison";
import { InternationalComparison } from "@/components/home/international-comparison";
import { DataUpdates } from "@/components/home/data-updates";
import { SourceTrust } from "@/components/home/source-trust";

// Rendered per request (not statically prerendered at build time) since the
// page reads live data from Postgres, which isn't reachable during the
// Docker image build. Financial data changes slowly, so this can move to
// ISR once the build pipeline has DB access at build time.
export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main id="inhoud" className="home-page">
        <Suspense fallback={<SectionFallback />}>
          <HomeHero />
        </Suspense>

        <Suspense fallback={<SectionFallback />}>
          <BelgiumOverview />
        </Suspense>

        <NeighbourComparison />

        <PublicAdministrationSummary />

        <Suspense fallback={<SectionFallback />}>
          <HundredEuroBreakdown />
        </Suspense>

        <GovernmentSectorsCta />

        <Suspense fallback={<SectionFallback />}>
          <CofogBreakdown />
        </Suspense>

        <Suspense fallback={<SectionFallback />}>
          <DebtHistory />
        </Suspense>

        <Suspense fallback={<SectionFallback />}>
          <InternationalComparison />
        </Suspense>

        <SectionPlaceholder
          heading="Bekijk jouw gemeente"
          subheading="Gemeentecijfers volgen later."
          note="Er zijn nog geen vergelijkbare gemeentecijfers beschikbaar."
        />

        <Suspense fallback={<SectionFallback />}>
          <DataUpdates />
        </Suspense>

        <Suspense fallback={<SectionFallback />}>
          <SourceTrust />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}

function SectionFallback() {
  return (
    <div className="mx-auto max-w-content px-4 py-16 sm:px-6 lg:px-8">
      <div className="h-40 animate-pulse rounded-lg border border-border bg-surface-muted" />
    </div>
  );
}
