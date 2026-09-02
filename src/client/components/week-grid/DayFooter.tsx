"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/client/components/common/NativeSelect";
import type { DayDto, FootnoteDto, PersonnelDto } from "@/shared/types";

interface Props {
  day: DayDto;
  footnotes: FootnoteDto[];
  personnel: PersonnelDto[];
  printMode?: boolean;
  onOpenFootnote?: (fn: FootnoteDto) => void;
  onAddFootnote?: (day: DayDto) => void;
  onTagesofChange?: (day: DayDto, personnelId: string | null) => void;
}

export function personName(p: PersonnelDto | undefined): string {
  if (!p) return "";
  const short = p.name.split(",")[0].trim();
  return p.rank ? `${p.rank} ${short}` : short;
}

export function DayFooter({ day, footnotes, personnel, printMode, onOpenFootnote, onAddFootnote, onTagesofChange }: Props) {
  const sorted = [...footnotes].sort((a, b) => a.number - b.number);
  const tagesof = personnel.find((p) => p.id === day.tagesofPersonnelId);
  return (
    <div className="flex h-full flex-col border-r border-black/40 text-[10px] leading-tight">
      <div className="flex-1 p-1">
        {sorted.map((f) => (
          <div
            key={f.id}
            className={printMode ? "flex gap-1" : "flex cursor-pointer gap-1 rounded hover:bg-muted"}
            onClick={() => !printMode && onOpenFootnote?.(f)}
          >
            <span className="w-5 shrink-0 text-right font-semibold">{f.number}</span>
            <span className="whitespace-pre-line">{f.text}</span>
          </div>
        ))}
        {!printMode && (
          <Button variant="ghost" size="icon-xs" className="mt-0.5 opacity-40 hover:opacity-100" title="Termin/Info hinzufügen" onClick={() => onAddFootnote?.(day)}>
            <Plus />
          </Button>
        )}
      </div>
      <div className="border-t border-black/40 p-1">
        {printMode ? (
          <span>{personName(tagesof)}</span>
        ) : (
          <NativeSelect
            size="sm"
            className="w-full text-[11px]"
            options={personnel.map((p) => ({ value: p.id, label: personName(p) }))}
            placeholder="– Tagesof –"
            value={day.tagesofPersonnelId ?? ""}
            onChange={(e) => onTagesofChange?.(day, e.target.value || null)}
          />
        )}
      </div>
    </div>
  );
}
