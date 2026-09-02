"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type Props = { onConfirm: () => void; children: ReactNode } & Omit<ComponentProps<typeof Button>, "onClick" | "children">;

/** Löschen-Button mit zweistufiger Bestätigung (erst Klick, dann "Wirklich?"). */
export function ConfirmButton({ onConfirm, children, variant, ...props }: Props) {
  const [armed, setArmed] = useState(false);
  return (
    <Button
      {...props}
      variant={armed ? "destructive" : (variant ?? "ghost")}
      onClick={() => {
        if (armed) {
          onConfirm();
          setArmed(false);
        } else {
          setArmed(true);
          setTimeout(() => setArmed(false), 3000);
        }
      }}
    >
      {armed ? "Wirklich?" : children}
    </Button>
  );
}
