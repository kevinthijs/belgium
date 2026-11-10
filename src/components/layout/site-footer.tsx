import Link from "next/link";
import { getMessages } from "@/i18n";
import { ArrowUpRight } from "lucide-react";

const columns = [
  { title: "De staatsrekening", links: [
    { label: "Overzicht", href: "/" },
    { label: "Inkomsten en uitgaven", href: "/belgie#inkomsten" },
    { label: "Overheidsschuld", href: "/belgie#schuld" },
    { label: "Overheidsniveaus", href: "/belgie#overheidsniveaus" },
  ] },
  { title: "Verder onderzoeken", links: [
    { label: "Landen vergelijken", href: "/vergelijk" },
    { label: "Belastingen", href: "/belgie#belastingen" },
    { label: "Bestedingen per functie", href: "/belgie#cofog" },
    { label: "Bronnen en methodologie", href: "/belgie#bronnen" },
  ] },
];

export function SiteFooter() {
  const t = getMessages();
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-content px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr] md:gap-16">
          <div><Link href="/" className="text-lg font-semibold tracking-tight">{t.brand.name}</Link><p className="mt-3 max-w-sm text-sm text-foreground-muted">{t.footer.tagline}</p><Link href="/vergelijk" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-accent hover:underline">Plaats de cijfers in perspectief <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link></div>
          {columns.map((column) => <div key={column.title}><h2 className="text-sm font-semibold">{column.title}</h2><ul className="mt-3 space-y-1">{column.links.map((link) => <li key={link.href}><Link href={link.href} className="inline-flex min-h-9 items-center py-1 text-sm text-foreground-muted hover:text-accent">{link.label}</Link></li>)}</ul></div>)}
        </div>
        <p className="mt-10 border-t border-border pt-5 text-xs text-foreground-subtle">Officiële gegevens. Inzicht in de cijfers, met de bron erbij.</p>
      </div>
    </footer>
  );
}
