import { CompleteCountryComparison } from "@/components/belgium/complete-country-comparison";
import { PublicAdministrationComparison } from "@/components/belgium/public-administration-comparison";
import { Suspense } from "react";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { GovernmentEntityHeader } from "@/components/belgium/entity-header";
import { BelgiumKeyMetrics } from "@/components/belgium/key-metrics";
import { SectionNav } from "@/components/belgium/section-nav";
import { BelgiumDebtSection } from "@/components/belgium/debt-section";
import { RevenueExpenditureSection } from "@/components/belgium/revenue-expenditure-section";
import { GovernmentBalanceSection } from "@/components/belgium/balance-section";
import { GovernmentSectorsSection } from "@/components/belgium/government-sectors-section";
import { BelgiumTaxSection } from "@/components/belgium/tax-section";
import { BelgiumCofogSection } from "@/components/belgium/cofog-section";
import { SpendingTopicsSection } from "@/components/belgium/spending-topics-section";
import { CofogHistorySection } from "@/components/belgium/cofog-history-section";
import { PerCapitaFinanceSection } from "@/components/belgium/per-capita-section";
import { BelgiumInternationalComparison } from "@/components/belgium/international-comparison-section";
import { MethodologySection } from "@/components/belgium/methodology-section";
import { CountryComparisonSection } from "@/components/belgium/country-comparison-section";

// Rendered per request (not statically prerendered at build time) since the
// page reads live data from Postgres, which isn't reachable during the
// Docker image build — same constraint as the homepage.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Belgische overheidsschuld, inkomsten en uitgaven",
  description:
    "Bekijk Belgische overheidsfinanciën en vergelijk belastingen, overheidspersoneel, onderwijs en defensie met Frankrijk, Spanje en Nederland.",
  alternates: {
    canonical: "/belgie",
  },
};

export default function BelgiePage() {
  return (
    <>
      <SiteHeader />
      <main id="inhoud">
        <Suspense fallback={<SectionFallback />}>
          <GovernmentEntityHeader />
        </Suspense>

        <SectionNav />

        <Suspense fallback={<SectionFallback />}>
          <BelgiumKeyMetrics />
        </Suspense>

        <Suspense fallback={<SectionFallback />}>
          <BelgiumDebtSection />
        </Suspense>

        <Suspense fallback={<SectionFallback />}>
          <RevenueExpenditureSection />
        </Suspense>

        <Suspense fallback={<SectionFallback />}>
          <GovernmentBalanceSection />
        </Suspense>

        <Suspense fallback={<SectionFallback />}>
          <GovernmentSectorsSection />
        </Suspense>

        <Suspense fallback={<SectionFallback />}>
          <BelgiumTaxSection />
        </Suspense>

        <Suspense fallback={<SectionFallback />}>
          <BelgiumCofogSection />
        </Suspense>

        <SpendingTopicsSection />

        <Suspense fallback={<SectionFallback />}>
          <CofogHistorySection />
        </Suspense>

        <Suspense fallback={<SectionFallback />}>
          <PerCapitaFinanceSection />
        </Suspense>

        <CompleteCountryComparison />

        <CountryComparisonSection />

        <PublicAdministrationComparison />

        <Suspense fallback={<SectionFallback />}>
          <BelgiumInternationalComparison />
        </Suspense>

        <MethodologySection />
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
