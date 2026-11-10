import Link from "next/link";
import { getMessages } from "@/i18n";
import { LanguageSelector } from "./language-selector";

const links = [
  { label: "Overzicht", href: "/" },
  { label: "België in detail", href: "/belgie" },
  { label: "Landen vergelijken", href: "/vergelijk" },
  { label: "Bronnen", href: "/#bronnen" },
];

export function SiteHeader() {
  const t = getMessages();
  return (
    <>
      <a href="#inhoud" className="sr-only fixed left-4 top-4 z-50 rounded-md bg-surface p-3 focus:not-sr-only">Naar de inhoud</a>
      <header className="sticky top-0 z-40 border-b border-border bg-background">
        <div className="mx-auto flex min-h-[72px] max-w-content items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 text-sm font-semibold tracking-tight text-foreground sm:text-base">
            <span aria-hidden="true" className="flex h-6 w-5 overflow-hidden rounded-[2px]">
              <span className="flex-1 bg-foreground" /><span className="flex-1 bg-accent" /><span className="flex-1 bg-data-series-5" />
            </span>
            {t.brand.name}
          </Link>
          <nav aria-label="Hoofdnavigatie" className="hidden items-center gap-7 lg:flex">
            {links.map((link) => <Link key={link.href} href={link.href} className="py-3 text-sm text-foreground-muted transition-colors hover:text-accent">{link.label}</Link>)}
          </nav>
          <LanguageSelector />
        </div>
        <nav aria-label="Mobiele hoofdnavigatie" className="mx-auto flex max-w-content items-center justify-between gap-3 border-t border-border px-4 sm:px-6 lg:hidden">
          {links.map((link) => <Link key={link.href} href={link.href} className="flex min-h-11 items-center text-xs font-medium text-foreground-muted hover:text-accent sm:text-sm">{link.label}</Link>)}
        </nav>
      </header>
    </>
  );
}
