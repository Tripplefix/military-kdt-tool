"use client";

import type { CSSProperties, PointerEvent as ReactPointerEvent, MouseEvent as ReactMouseEvent } from "react";
import type { BlockDto, CategoryDto } from "@/shared/types";

export interface BlockViewProps {
  block: BlockDto;
  category: CategoryDto | undefined;
  /** Position/Grösse innerhalb der Tagesspalte */
  style: CSSProperties;
  widthPx: number;
  heightPx: number;
  selected?: boolean;
  printMode?: boolean;
  onOpen?: (block: BlockDto) => void;
  onPointerDown?: (e: ReactPointerEvent<HTMLDivElement>, block: BlockDto) => void;
  onResizeStart?: (e: ReactPointerEvent<HTMLDivElement>, block: BlockDto, edge: "top" | "bottom" | "left" | "right") => void;
  onContextMenu?: (e: ReactMouseEvent<HTMLDivElement>, block: BlockDto) => void;
}

export function blockText(block: BlockDto, titleOnly = false): string {
  return block.location && !titleOnly ? `${block.title} / ${block.location}` : block.title;
}

export function BlockView({ block, category, style, widthPx, heightPx, selected, printMode, onOpen, onPointerDown, onResizeStart, onContextMenu }: BlockViewProps) {
  const color = category?.color ?? "#FFFFFF";
  const textColor = category?.textColor ?? "#000000";
  const shape = category?.shape ?? "rect";
  const bar = shape === "bar" || heightPx <= 16;
  const narrow = widthPx < 34;
  const shortTitle = block.title.length <= 4;
  // Schmale Boxen (Rap/Beso) zeigen nur den Titel; kurze Titel wie "DR" bleiben waagrecht
  const vertical = !bar && widthPx < 60 && heightPx > widthPx * 1.4 && !(narrow && shortTitle);
  const text = blockText(block, narrow);
  const fontPx = bar ? 9 : narrow ? 8 : widthPx < 40 ? 9 : 11;

  return (
    <div
      className="wap-block absolute overflow-hidden rounded-[2px] leading-tight select-none"
      data-shape={shape}
      data-selected={selected ? "true" : "false"}
      data-block-id={block.id}
      style={{ ...style, background: color, color: textColor, fontSize: fontPx, cursor: printMode ? "default" : "grab" }}
      title={printMode ? undefined : `${text}\n${block.responsibility}`}
      onClick={(e) => {
        e.stopPropagation();
        if (e.detail <= 1 && !e.currentTarget.dataset.dragged) onOpen?.(block);
      }}
      onPointerDown={(e) => onPointerDown?.(e, block)}
      onContextMenu={(e) => onContextMenu?.(e, block)}
    >
      {vertical ? (
        <div className="wap-vertical-text flex h-full w-full items-center justify-center px-[1px] text-center whitespace-pre-line">{text}</div>
      ) : (
        <div className="flex h-full w-full items-center justify-center px-1 text-center whitespace-pre-line" style={bar ? { fontWeight: 600 } : undefined}>
          {text}
        </div>
      )}
      {!printMode && onResizeStart && (
        <>
          <div className="absolute inset-x-0 top-0 h-1.5 cursor-ns-resize" onPointerDown={(e) => { e.stopPropagation(); onResizeStart(e, block, "top"); }} />
          <div className="absolute inset-x-0 bottom-0 h-1.5 cursor-ns-resize" onPointerDown={(e) => { e.stopPropagation(); onResizeStart(e, block, "bottom"); }} />
          <div className="absolute inset-y-0 left-0 w-1.5 cursor-ew-resize" onPointerDown={(e) => { e.stopPropagation(); onResizeStart(e, block, "left"); }} />
          <div className="absolute inset-y-0 right-0 w-1.5 cursor-ew-resize" onPointerDown={(e) => { e.stopPropagation(); onResizeStart(e, block, "right"); }} />
        </>
      )}
    </div>
  );
}
