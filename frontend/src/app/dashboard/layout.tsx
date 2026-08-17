import { DashboardNav } from "@/components/layout/DashboardNav";
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      <DashboardNav />
      {/* Single page-level scroll container: pages that overflow scroll here,
          pages that manage their own panes (resume canvas) fill it exactly. */}
      <div className="flex-1 min-h-0 flex flex-col overflow-y-auto">{children}</div>
    </div>
  );
}
