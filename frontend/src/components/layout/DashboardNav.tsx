"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/dashboard/blocks", label: "Block Library" },
  { href: "/dashboard", label: "Resumes" },
] as const;

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <header className="h-16 shrink-0 border-b border-hairline bg-panel px-7 flex items-center justify-between">
      <Link href="/dashboard" className="flex items-center gap-2.5">
        <div className="w-5 h-5 bg-foreground rounded-[5px]" />
        <span className="font-bold text-[15px]">Blocks</span>
      </Link>
      <nav className="flex items-center gap-5">
        {NAV_LINKS.map((link) => {
          const active =
            link.label === "Resumes"
              ? pathname === "/dashboard" || pathname.startsWith("/dashboard/resumes")
              : pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.label}
              href={link.href}
              className={cn(
                "text-[13px] hover:text-foreground",
                active ? "font-semibold text-foreground" : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          );
        })}
        <UserButton />
      </nav>
    </header>
  );
}
