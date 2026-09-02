"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { NativeSelect } from "@/client/components/common/NativeSelect";
import { TimeInput } from "@/client/components/common/TimeInput";
import { useUpdateSettings } from "@/client/api/hooks";
import type { SettingsDto, StandardReportDto, StandardTimeDto } from "@/shared/types";

const DAY_OPTIONS = [
  { value: "all", label: "Alle Tage" },
  { value: "weekday", label: "Mo–Fr" },
  { value: "weekend", label: "Sa/So" },
];

export function StandardTimesForm({ wkId, settings }: { wkId: string; settings: SettingsDto }) {
  const update = useUpdateSettings(wkId);
  const [times, setTimes] = useState<StandardTimeDto[]>(settings.standardTimes);
  const [reports, setReports] = useState<StandardReportDto[]>(settings.standardReports);

  const setTime = (i: number, patch: Partial<StandardTimeDto>) =>
    setTimes((ts) => ts.map((t, j) => (j === i ? { ...t, ...patch } : t)));
  const setReport = (i: number, patch: Partial<StandardReportDto>) =>
    setReports((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  return (
    <div className="grid gap-6">
      <section className="rounded-lg border p-4">
        <h2 className="font-medium">Standardzeiten (Gruppe «Alle» im Tagesbefehl)</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Diese Zeiten erscheinen automatisch im Tagesbefehl, wenn «im TB» aktiv ist. Ohne Ende = Zeitpunkt.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr>
                <th className="p-1">Schlüssel</th>
                <th className="p-1">Bezeichnung</th>
                <th className="p-1">Von</th>
                <th className="p-1">Bis</th>
                <th className="p-1">Verantwortung</th>
                <th className="p-1">Standort</th>
                <th className="p-1">Tage</th>
                <th className="p-1">im TB</th>
                <th className="p-1"></th>
              </tr>
            </thead>
            <tbody>
              {times.map((t, i) => (
                <tr key={i}>
                  <td className="p-1"><Input className="w-28 font-mono" value={t.key} onChange={(e) => setTime(i, { key: e.target.value })} /></td>
                  <td className="p-1"><Input className="w-48" value={t.label} onChange={(e) => setTime(i, { label: e.target.value })} /></td>
                  <td className="p-1"><TimeInput value={t.startMin} onChange={(v) => v != null && setTime(i, { startMin: v })} /></td>
                  <td className="p-1"><TimeInput value={t.endMin} allowEmpty onChange={(v) => setTime(i, { endMin: v })} /></td>
                  <td className="p-1"><Input className="w-36" value={t.responsibility} onChange={(e) => setTime(i, { responsibility: e.target.value })} /></td>
                  <td className="p-1"><Input className="w-36" value={t.location} onChange={(e) => setTime(i, { location: e.target.value })} /></td>
                  <td className="p-1"><NativeSelect options={DAY_OPTIONS} value={t.days} onChange={(e) => setTime(i, { days: e.target.value as StandardTimeDto["days"] })} /></td>
                  <td className="p-1 text-center"><Checkbox checked={t.inTagesbefehl} onCheckedChange={(v) => setTime(i, { inTagesbefehl: v === true })} /></td>
                  <td className="p-1"><Button variant="ghost" size="icon-sm" onClick={() => setTimes((ts) => ts.filter((_, j) => j !== i))}><Trash2 /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => setTimes((ts) => [...ts, { key: `neu${ts.length + 1}`, label: "", startMin: 480, endMin: null, responsibility: "", location: "", days: "all", inTagesbefehl: true, order: ts.length }])}
        >
          <Plus /> Zeit hinzufügen
        </Button>
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="font-medium">Standardrapporte (Abschnitt 3 im Tagesbefehl)</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr>
                <th className="p-1">Schlüssel</th>
                <th className="p-1">Bezeichnung</th>
                <th className="p-1">Zeit (Text)</th>
                <th className="p-1">Verantwortung</th>
                <th className="p-1">Standort</th>
                <th className="p-1">Tage</th>
                <th className="p-1"></th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r, i) => (
                <tr key={i}>
                  <td className="p-1"><Input className="w-32 font-mono" value={r.key} onChange={(e) => setReport(i, { key: e.target.value })} /></td>
                  <td className="p-1"><Input className="w-48" value={r.label} onChange={(e) => setReport(i, { label: e.target.value })} /></td>
                  <td className="p-1"><Input className="w-28 font-mono" value={r.timeText} onChange={(e) => setReport(i, { timeText: e.target.value })} /></td>
                  <td className="p-1"><Input className="w-36" value={r.responsibility} onChange={(e) => setReport(i, { responsibility: e.target.value })} /></td>
                  <td className="p-1"><Input className="w-36" value={r.location} onChange={(e) => setReport(i, { location: e.target.value })} /></td>
                  <td className="p-1"><NativeSelect options={DAY_OPTIONS} value={r.days} onChange={(e) => setReport(i, { days: e.target.value as StandardReportDto["days"] })} /></td>
                  <td className="p-1"><Button variant="ghost" size="icon-sm" onClick={() => setReports((rs) => rs.filter((_, j) => j !== i))}><Trash2 /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => setReports((rs) => [...rs, { key: `rapport${rs.length + 1}`, label: "", timeText: "", responsibility: "", location: "", days: "weekday", order: rs.length }])}
        >
          <Plus /> Rapport hinzufügen
        </Button>
      </section>

      <div>
        <Button
          disabled={update.isPending}
          onClick={() =>
            update.mutate({
              standardTimes: times.map((t, order) => ({ ...t, order })),
              standardReports: reports.map((r, order) => ({ ...r, order })),
            })
          }
        >
          Speichern
        </Button>
      </div>
    </div>
  );
}
