import { ResumeBuilderNav } from "@/components/layout/ResumeBuilderNav";
export default function ResumeBuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <ResumeBuilderNav />
      <div className="flex-1 flex flex-col min-h-0">{children}</div>
    </div>
  );
}
