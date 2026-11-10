import Link from "next/link";

export function Pager({
  page,
  totalPages,
  total,
  basePath,
  searchParams,
}: {
  page: number;
  totalPages: number;
  total: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
}) {
  function hrefFor(targetPage: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value) params.set(key, value);
    }
    params.set("page", String(targetPage));
    return `${basePath}?${params.toString()}`;
  }

  return (
    <div className="mt-3 flex items-center justify-between text-sm text-foreground-subtle">
      <span>
        Pagina {page} van {totalPages} ({total} resultaten)
      </span>
      <div className="flex gap-2">
        <Link
          href={hrefFor(Math.max(1, page - 1))}
          aria-disabled={page <= 1}
          className="rounded-sm border border-border px-2.5 py-1 text-foreground-muted hover:bg-surface-muted aria-disabled:pointer-events-none aria-disabled:opacity-40"
        >
          Vorige
        </Link>
        <Link
          href={hrefFor(Math.min(totalPages, page + 1))}
          aria-disabled={page >= totalPages}
          className="rounded-sm border border-border px-2.5 py-1 text-foreground-muted hover:bg-surface-muted aria-disabled:pointer-events-none aria-disabled:opacity-40"
        >
          Volgende
        </Link>
      </div>
    </div>
  );
}
