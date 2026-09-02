"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/client/components/common/NativeSelect";
import { Field } from "@/client/components/common/Field";
import { LANE_KINDS } from "@/shared/constants";
import { LANE_PROFILES, LANE_PROFILE_LABELS, type LaneProfileKey } from "@/shared/lanes";
import type { LaneConfigInput } from "@/shared/schemas";
import type { DayDto, LaneDto, UnitDto } from "@/shared/types";
import { WEEKDAY_NAMES_DE } from "@/shared/constants";
import { formatIsoDe } from "@/shared/time";

interface Props {
  open: boolean;
  onClose: () => void;
  days: DayDto[];
  weekLanes: LaneDto[];
  lanesByDay: Record<string, LaneDto[]>;
  units: UnitDto[];
  onApply: (input: LaneConfigInput) => void;
}

type LaneDraft = { key: string; label: string; kind: LaneDto["kind"]; widthWeight: number; zugKey: string | null };

const KIND_LABELS: Record<LaneDto["kind"], string> = { unit: "Zug / Gruppe", report: "Rapporte (Rap)", info: "Termine/Info (Beso)" };

export function LaneConfigDialog({ open, onClose, days, weekLanes, lanesByDay, units, onApply }: Props) {
  const [target, setTarget] = useState<string>("week");
  const source = target === "week" ? weekLanes : (lanesByDay[target] ?? []);
  const isOverride = target !== "week" && (lanesByDay[target] ?? []).some((l) => l.dayId === target);
  const [draft, setDraft] = useState<LaneDraft[] | null>(null);
  const lanes = draft ?? source.map(({ key, label, kind, widthWeight, zugKey }) => ({ key, label, kind, widthWeight, zugKey }));

  const targetOptions = [
    { value: "week", label: "Ganze Woche (Standard)" },
    ...days.map((d) => ({ value: d.id, label: `${WEEKDAY_NAMES_DE[d.weekday]} ${formatIsoDe(d.date)}${(lanesByDay[d.id] ?? []).some((l) => l.dayId === d.id) ? " (eigene Spalten)" : ""}` })),
  ];
  const unitOptions = units.map((u) => ({ value: u.key, label: u.label }));

  const update = (i: number, patch: Partial<LaneDraft>) => setDraft(lanes.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= lanes.length) return;
    const copy = [...lanes];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    setDraft(copy);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setDraft(null);
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Spalten konfigurieren</DialogTitle>
          <DialogDescription>Spalten gelten für die ganze Woche; einzelne Tage (z. B. Wochenende) können eigene Spalten haben. Blöcke werden bei weniger Spalten automatisch angepasst.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Gilt für">
              <NativeSelect
                options={targetOptions}
                value={target}
                onChange={(e) => {
                  setTarget(e.target.value);
                  setDraft(null);
                }}
              />
            </Field>
            <Field label="Profil anwenden">
              <div className="flex gap-1">
                {(Object.keys(LANE_PROFILES) as LaneProfileKey[]).map((p) => (
                  <Button key={p} variant="outline" size="sm" onClick={() => setDraft(LANE_PROFILES[p].map((l) => ({ ...l })))}>
                    {LANE_PROFILE_LABELS[p]}
                  </Button>
                ))}
              </div>
            </Field>
            {isOverride && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onApply({ dayId: target, clearOverride: true });
                  setDraft(null);
                }}
              >
                Eigene Spalten entfernen
              </Button>
            )}
          </div>
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr>
                <th className="p-1">Schlüssel</th>
                <th className="p-1">Beschriftung</th>
                <th className="p-1">Art</th>
                <th className="w-20 p-1">Breite</th>
                <th className="p-1">Zug (Tagesbefehl)</th>
                <th className="w-28 p-1"></th>
              </tr>
            </thead>
            <tbody>
              {lanes.map((l, i) => (
                <tr key={i}>
                  <td className="p-1"><Input className="w-28 font-mono" value={l.key} onChange={(e) => update(i, { key: e.target.value })} /></td>
                  <td className="p-1"><Input value={l.label} onChange={(e) => update(i, { label: e.target.value })} /></td>
                  <td className="p-1">
                    <NativeSelect options={LANE_KINDS.map((k) => ({ value: k, label: KIND_LABELS[k] }))} value={l.kind} onChange={(e) => update(i, { kind: e.target.value as LaneDto["kind"], zugKey: e.target.value === "unit" ? l.zugKey : null })} />
                  </td>
                  <td className="p-1"><Input type="number" step={0.1} min={0.1} value={l.widthWeight} onChange={(e) => update(i, { widthWeight: Number(e.target.value) || 1 })} /></td>
                  <td className="p-1">
                    {l.kind === "unit" ? (
                      <NativeSelect options={unitOptions} placeholder="– (z. B. Kp)" value={l.zugKey ?? ""} onChange={(e) => update(i, { zugKey: e.target.value || null })} className="w-full" />
                    ) : (
                      <span className="text-xs text-muted-foreground">–</span>
                    )}
                  </td>
                  <td className="p-1">
                    <div className="flex gap-0.5">
                      <Button variant="ghost" size="icon-xs" onClick={() => move(i, -1)}><ArrowUp /></Button>
                      <Button variant="ghost" size="icon-xs" onClick={() => move(i, 1)}><ArrowDown /></Button>
                      <Button variant="ghost" size="icon-xs" onClick={() => setDraft(lanes.filter((_, j) => j !== i))}><Trash2 /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div>
            <Button variant="outline" size="sm" onClick={() => setDraft([...lanes, { key: `neu${lanes.length + 1}`, label: "Neu", kind: "unit", widthWeight: 1, zugKey: null }])}>
              <Plus /> Spalte hinzufügen
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setDraft(null); onClose(); }}>Abbrechen</Button>
          <Button
            disabled={lanes.length === 0}
            onClick={() => {
              onApply({ dayId: target === "week" ? null : target, lanes });
              setDraft(null);
            }}
          >
            Übernehmen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
