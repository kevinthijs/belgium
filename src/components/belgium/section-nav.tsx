"use client";

const SECTIONS = [
  { id: "schuld", label: "Schuld" },
  { id: "inkomsten", label: "Inkomsten" },
  { id: "uitgaven", label: "Uitgaven" },
  { id: "saldo", label: "Begrotingssaldo" },
  { id: "overheidsniveaus", label: "Overheidsniveaus" },
  { id: "belastingen", label: "Belastingen" },
  { id: "cofog", label: "Uitgaven per functie" },
  { id: "bestedingen", label: "Onderwijs, partijen en NAVO" },
  { id: "historiek", label: "Historiek" },
  { id: "per-inwoner", label: "Per inwoner" },
  { id: "landenkaart", label: "Landenkaart" },
  { id: "actuele-vergelijking", label: "Btw, werkloosheid, NAVO en auto’s" },
  { id: "bestuurskosten", label: "Bestuurskosten vergelijken" },
  { id: "publieke-resultaten", label: "Onderwijs en zorg vergelijken" },
  { id: "demografische-context", label: "Demografische context" },
  { id: "evolutie-bestuurskosten", label: "Evolutie bestuurskosten" },
  { id: "landenvergelijking", label: "Landen vergelijken" },
  { id: "overheid-en-burgemeesters", label: "Overheid en burgemeesters" },
  { id: "vergelijk", label: "Schuld vergelijken" },
  { id: "bronnen", label: "Bronnen" },
];

export function SectionNav() {
  return (
    <nav
      aria-label="Paginanavigatie"
      className="sticky top-0 z-10 overflow-x-auto border-b border-border bg-surface/95 py-2 backdrop-blur"
    >
      <ul className="mx-auto flex max-w-content list-none gap-4 whitespace-nowrap px-4 text-sm sm:px-6 lg:px-8">
        {SECTIONS.map((s) => (
          <li key={s.id}>
            <a href={`#${s.id}`} className="inline-block py-1 text-foreground-muted hover:text-foreground">
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
