import type { ReactNode } from "react";

/** Druckansichten: keine Navigation, weisser Hintergrund. */
export default function PrintLayout({ children }: { children: ReactNode }) {
  return <div className="print-root min-h-screen bg-white text-black">{children}</div>;
}
