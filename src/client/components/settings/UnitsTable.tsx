"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { BlurInput } from "@/client/components/common/BlurInput";
import { ConfirmButton } from "@/client/components/common/ConfirmButton";
import { useUnitCrud } from "@/client/api/hooks";
import type { UnitDto } from "@/shared/types";

export function UnitsTable({ wkId, units }: { wkId: string; units: UnitDto[] }) {
  const crud = useUnitCrud(wkId);
  const [draft, setDraft] = useState({ key: "", label: "", tagesbefehlLabel: "" });
  return (
    <section className="rounded-lg border p-4">
      <h2 className="font-medium">Züge / Gruppen</h2>
      <p className="mb-3 text-sm text-muted-foreground">
        Der Schlüssel verbindet eine Spalte im WAP (Zug-Zuordnung) mit der Gruppe im Tagesbefehl. «Nur KVK» kennzeichnet Gruppen, die nur in der KVK-Woche vorkommen.
      </p>
      <table className="w-full text-sm">
        <thead className="text-left text-xs text-muted-foreground">
          <tr>
            <th className="w-36 p-1">Schlüssel</th>
            <th className="p-1">Bezeichnung</th>
            <th className="p-1">Titel im Tagesbefehl</th>
            <th className="w-20 p-1">Reihenf.</th>
            <th className="w-20 p-1">Nur KVK</th>
            <th className="w-10 p-1"></th>
          </tr>
        </thead>
        <tbody>
          {units.map((u) => (
            <tr key={u.id}>
              <td className="p-1"><BlurInput className="font-mono" value={u.key} onCommit={(key) => crud.update.mutate({ id: u.id, patch: { key } })} /></td>
              <td className="p-1"><BlurInput value={u.label} onCommit={(label) => crud.update.mutate({ id: u.id, patch: { label } })} /></td>
              <td className="p-1"><BlurInput value={u.tagesbefehlLabel} onCommit={(tagesbefehlLabel) => crud.update.mutate({ id: u.id, patch: { tagesbefehlLabel } })} /></td>
              <td className="p-1"><BlurInput value={String(u.order)} onCommit={(v) => crud.update.mutate({ id: u.id, patch: { order: Number(v) || 0 } })} /></td>
              <td className="p-1 text-center"><Checkbox checked={u.kvkOnly} onCheckedChange={(v) => crud.update.mutate({ id: u.id, patch: { kvkOnly: v === true } })} /></td>
              <td className="p-1"><ConfirmButton size="icon-sm" onConfirm={() => crud.remove.mutate(u.id)}><Trash2 /></ConfirmButton></td>
            </tr>
          ))}
          <tr className="border-t">
            <td className="p-1"><Input className="font-mono" placeholder="schluessel" value={draft.key} onChange={(e) => setDraft({ ...draft, key: e.target.value })} /></td>
            <td className="p-1"><Input placeholder="Bezeichnung" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} /></td>
            <td className="p-1"><Input placeholder="Titel im TB" value={draft.tagesbefehlLabel} onChange={(e) => setDraft({ ...draft, tagesbefehlLabel: e.target.value })} /></td>
            <td className="p-1" colSpan={2}></td>
            <td className="p-1">
              <Button
                size="icon-sm"
                disabled={!draft.key.trim() || !draft.label.trim()}
                onClick={() =>
                  crud.create.mutate(
                    { ...draft, tagesbefehlLabel: draft.tagesbefehlLabel || draft.label, order: units.length, kvkOnly: false },
                    { onSuccess: () => setDraft({ key: "", label: "", tagesbefehlLabel: "" }) },
                  )
                }
              >
                <Plus />
              </Button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
