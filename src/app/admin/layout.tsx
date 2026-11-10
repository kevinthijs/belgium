import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/admin-nav";

// Second, redundant layer of "don't index this" on top of robots.txt
// (crawlers that ignore robots.txt sometimes still respect this) and the
// Basic Auth in src/middleware.ts, which is the actual access control.
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
  title: { default: "Data health", template: "%s | Data health | Belgische Staatsrekening" },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-[13px]">
      <AdminNav />
      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
