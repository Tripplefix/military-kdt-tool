"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WkDto } from "@/shared/types";

interface Props {
  wk: WkDto;
  weeks: Array<{ id: string; index: number; label: string; kind: string }>;
}

export function AppNav({ wk, weeks }: Props) {
  const pathname = usePathname();
  const base = `/wk/${wk.id}`;
  return (
    <header className="border-b bg-card print:hidden">
      <div className="flex h-12 items-center gap-2 px-4">
        <Link href="/wks" className="mr-4 flex items-center gap-2 font-semibold">
          <CalendarDays className="size-5" />
          <span className="hidden sm:inline">{wk.name}</span>
        </Link>
        <nav className="flex items-center gap-1">
          {weeks.map((w) => {
            const href = `${base}/week/${w.index}`;
            const active = pathname.startsWith(href);
            return (
              <Link
                key={w.id}
                href={href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-accent",
                  active ? "bg-accent font-medium" : "text-muted-foreground",
                )}
              >
                {w.label}
                {w.kind === "kvk" ? " (KVK)" : ""}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <Link
            href={`${base}/settings`}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm hover:bg-accent",
              pathname.startsWith(`${base}/settings`) ? "bg-accent font-medium" : "text-muted-foreground",
            )}
          >
            <Settings className="size-4" /> Einstellungen
          </Link>
        </div>
      </div>
    </header>
  );
}
