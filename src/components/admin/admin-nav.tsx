import Link from "next/link";

const LINKS = [
  { href: "/admin/data", label: "Overzicht" },
  { href: "/admin/data/datasets", label: "Datasets" },
  { href: "/admin/data/imports", label: "Importruns" },
  { href: "/admin/data/observations", label: "Observaties" },
  { href: "/admin/data/revisions", label: "Revisies" },
  { href: "/admin/data/unmapped", label: "Ongemapt" },
  { href: "/admin/data/errors", label: "Fouten" },
];

export function AdminNav() {
  return (
    <nav className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-1 px-4 py-2 sm:px-6">
        <span className="mr-3 text-xs font-semibold uppercase tracking-wide text-foreground-subtle">
          Data health
        </span>
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-sm px-2.5 py-1 text-sm text-foreground-muted transition hover:bg-surface-muted hover:text-foreground"
          >
            {link.label}
          </Link>
        ))}
        <Link
          href="/"
          className="ml-auto rounded-sm px-2.5 py-1 text-sm text-foreground-subtle underline decoration-dotted underline-offset-2 hover:text-foreground-muted"
        >
          ← Publieke site
        </Link>
      </div>
    </nav>
  );
}
