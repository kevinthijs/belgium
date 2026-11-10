import { CompleteCountryComparison } from "@/components/belgium/complete-country-comparison";
import { PublicAdministrationComparison } from "@/components/belgium/public-administration-comparison";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { CountryComparisonSection } from "@/components/belgium/country-comparison-section";

export const metadata: Metadata = {
  title: "Vergelijk België met Frankrijk, Nederland, Duitsland en Spanje",
  description: "Vergelijk btw-opbrengsten, werkloosheid, NAVO-budgetten, autobelastingen en bestuurskosten voor België, Frankrijk, Nederland, Duitsland en Spanje. Met bronjaren en officiële bronnen.",
  alternates: { canonical: "/vergelijk" },
};

export default function VergelijkPage() {
  return (
    <>
      <SiteHeader />
      <main id="inhoud">
        <div className="mx-auto max-w-content border-b border-border px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <h1 className="text-[clamp(2.25rem,4vw,3.5rem)] font-semibold tracking-tight text-foreground">België in Europees perspectief</h1>
          <p className="mt-4 max-w-2xl text-foreground-muted">Van bestuurskosten tot publieke resultaten: vergelijk de cijfers, de context en de evolutie. Per indicator zie je de definitie, het jaar en de bron.</p>
          <nav aria-label="Onderwerpen in de landenvergelijking" className="mt-5 flex flex-wrap gap-x-6 gap-y-1 text-sm font-medium text-accent">{[{ id: "geldstromen", label: "Volledige overheidsrekening" }, { id: "actuele-vergelijking", label: "Btw, werkloosheid, NAVO en auto’s" }, { id: "landenkaart", label: "Verken de kaart" }, { id: "bestuurskosten", label: "Bestuurskosten" }, { id: "publieke-resultaten", label: "Onderwijs en zorg" }, { id: "demografische-context", label: "Demografische context" }, { id: "evolutie-bestuurskosten", label: "Evolutie" }, { id: "landenvergelijking", label: "Belastingen en bestedingen" }, { id: "overheid-en-burgemeesters", label: "Burgemeesters" }].map((item) => <a key={item.id} href={`#${item.id}`} className="inline-flex min-h-11 items-center underline underline-offset-4">{item.label}</a>)}</nav>
        </div>
        <CompleteCountryComparison />

        <CountryComparisonSection />

        <PublicAdministrationComparison />
      </main>
      <SiteFooter />
    </>
  );
}
