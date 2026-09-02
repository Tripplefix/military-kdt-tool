"use client";

import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import type { FootnoteDto } from "@/shared/types";

interface Props {
  footnote: FootnoteDto;
  style: CSSProperties;
  printMode?: boolean;
  onOpen?: (fn: FootnoteDto) => void;
  onPointerDown?: (e: ReactPointerEvent<HTMLDivElement>, fn: FootnoteDto) => void;
}

/** Nummerierte weisse Box in der Beso-Spalte (Termine/Info). */
export function FootnoteMarker({ footnote, style, printMode, onOpen, onPointerDown }: Props) {
  return (
    <div
      className="absolute flex items-center justify-center rounded-[2px] border border-black bg-white text-[10px] font-semibold select-none"
      style={{ ...style, cursor: printMode ? "default" : "grab" }}
      title={printMode ? undefined : footnote.text}
      data-footnote-id={footnote.id}
      onClick={(e) => {
        e.stopPropagation();
        if (!e.currentTarget.dataset.dragged) onOpen?.(footnote);
      }}
      onPointerDown={(e) => onPointerDown?.(e, footnote)}
    >
      {footnote.number}
    </div>
  );
}
