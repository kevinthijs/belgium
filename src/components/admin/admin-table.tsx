import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AdminTable({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-md border border-border bg-surface">
      <table className="w-full min-w-[720px] border-collapse text-sm">{children}</table>
    </div>
  );
}

export function AdminTableHead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-border bg-surface-muted text-left text-xs font-medium uppercase tracking-wide text-foreground-subtle">
      <tr>{children}</tr>
    </thead>
  );
}

export function AdminTh({ children, className }: { children: ReactNode; className?: string }) {
  return <th className={cn("px-3 py-2 font-medium", className)}>{children}</th>;
}

export function AdminTd({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn("px-3 py-2 align-top text-foreground", className)}>{children}</td>;
}

export function AdminRow({ children, className }: { children: ReactNode; className?: string }) {
  return <tr className={cn("border-b border-border last:border-0 hover:bg-surface-muted/60", className)}>{children}</tr>;
}

export function AdminEmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-3 py-8 text-center text-sm text-foreground-subtle">
        {children}
      </td>
    </tr>
  );
}
