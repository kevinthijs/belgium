import Link from "next/link";
import { getMessages } from "@/i18n";
import { prisma } from "@/lib/prisma";

export async function SourceTrust() {
  const t = getMessages();
  const organisations = await prisma.sourceOrganisation.findMany({
    where: { datasets: { some: {} } },
    orderBy: { name: "asc" },
  });

  return (
    <section id="bronnen" className="border-y border-border bg-surface-muted">
      <div className="mx-auto max-w-content px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <h2 className="text-[clamp(1.5rem,2.5vw,2rem)] font-semibold tracking-tight text-foreground">
          {t.sourceTrust.heading}
        </h2>
        <p className="mt-2 max-w-xl text-foreground-muted">{t.sourceTrust.body}</p>

        {organisations.length > 0 ? (
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-foreground-muted">
            {organisations.map((org) => (
              <li key={org.id}>{org.name}</li>
            ))}
          </ul>
        ) : null}

        <Link href="/belgie#bronnen" className="mt-6 inline-flex min-h-11 items-center rounded-sm border border-border px-4 py-2 text-sm font-medium text-foreground-muted hover:bg-surface hover:text-foreground">
          Bekijk bronnen en methodologie →
        </Link>
      </div>
    </section>
  );
}
