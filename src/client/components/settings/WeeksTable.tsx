"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/client/components/common/NativeSelect";
import { ConfirmButton } from "@/client/components/common/ConfirmButton";
import { useCreateWeek, useDeleteWeek } from "@/client/api/hooks";
import { STATUS_LABELS } from "@/shared/constants";
import { addDaysIso, formatIsoDe } from "@/shared/time";
import type { WeekDto } from "@/shared/types";

export function WeeksTable({ wkId, weeks }: { wkId: string; weeks: WeekDto[] }) {
  const create = useCreateWeek(wkId);
  const remove = useDeleteWeek(wkId);
  const last = weeks.at(-1);
  const [draft, setDraft] = useState({
    label: `WKW${weeks.length}`,
    startDate: last ? addDaysIso(last.startDate, 7) : "",
    kind: "normal" as WeekDto["kind"],
  });
  return (
    <section className="rounded-lg border p-4">
      <h2 className="font-medium">Wochen</h2>
      <table className="mt-2 w-full text-sm">
        <thead className="text-left text-xs text-muted-foreground">
          <tr>
            <th className="p-1">Label</th>
            <th className="p-1">Titel</th>
            <th className="p-1">Von – Bis</th>
            <th className="p-1">Typ</th>
            <th className="p-1">Status</th>
            <th className="w-10 p-1"></th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((w) => (
            <tr key={w.id}>
              <td className="p-1 font-medium"><Link className="underline" href={`/wk/${wkId}/week/${w.index}`}>{w.label}</Link></td>
              <td className="p-1">{w.title}</td>
              <td className="p-1">{formatIsoDe(w.startDate)} – {formatIsoDe(addDaysIso(w.startDate, 6))}</td>
              <td className="p-1">{w.kind === "kvk" ? "KVK" : "Normal"}</td>
              <td className="p-1">{STATUS_LABELS[w.status]}</td>
              <td className="p-1"><ConfirmButton size="icon-sm" onConfirm={() => remove.mutate(w.id)}><Trash2 /></ConfirmButton></td>
            </tr>
          ))}
          <tr className="border-t">
            <td className="p-1"><Input className="w-24" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} /></td>
            <td className="p-1"></td>
            <td className="p-1"><Input type="date" value={draft.startDate} onChange={(e) => setDraft({ ...draft, startDate: e.target.value })} /></td>
            <td className="p-1"><NativeSelect options={[{ value: "normal", label: "Normal" }, { value: "kvk", label: "KVK" }]} value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as WeekDto["kind"] })} /></td>
            <td className="p-1"></td>
            <td className="p-1">
              <Button size="icon-sm" disabled={!draft.startDate || !draft.label} onClick={() => create.mutate(draft, { onSuccess: () => setDraft({ ...draft, label: `WKW${weeks.length + 1}`, startDate: addDaysIso(draft.startDate, 7) }) })}>
                <Plus />
              </Button>
            </td>
          </tr>
        </tbody>
      </table>
      <p className="mt-2 text-xs text-muted-foreground">Das Startdatum sollte ein Montag sein. Löschen entfernt alle Blöcke und Tagesbefehle der Woche.</p>
    </section>
  );
}
