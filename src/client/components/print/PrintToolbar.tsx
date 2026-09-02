"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Nur am Bildschirm sichtbar: Druck auslösen (Chrome: «Als PDF speichern»). */
export function PrintToolbar({ hint }: { hint: string }) {
  return (
    <div className="print:hidden sticky top-0 z-50 flex items-center gap-3 border-b bg-neutral-100 px-4 py-2 text-sm">
      <Button size="sm" onClick={() => window.print()}>
        <Printer /> Drucken / als PDF speichern
      </Button>
      <span className="text-muted-foreground">{hint}</span>
      <Button variant="ghost" size="sm" className="ml-auto" onClick={() => window.close()}>
        Schliessen
      </Button>
    </div>
  );
}
