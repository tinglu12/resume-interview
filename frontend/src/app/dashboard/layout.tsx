import { DashboardNav } from "@/components/layout/DashboardNav";
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <DashboardNav />
      <div className="flex-1 flex flex-col min-h-0">{children}</div>
    </div>
  );
}
