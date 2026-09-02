"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BlurInput } from "@/client/components/common/BlurInput";
import { NativeSelect } from "@/client/components/common/NativeSelect";
import { ConfirmButton } from "@/client/components/common/ConfirmButton";
import { usePersonnelCrud } from "@/client/api/hooks";
import { PERSONNEL_ROLES, PERSONNEL_ROLE_LABELS } from "@/shared/constants";
import type { PersonnelDto, UnitDto } from "@/shared/types";

const ROLE_OPTIONS = PERSONNEL_ROLES.map((r) => ({ value: r, label: PERSONNEL_ROLE_LABELS[r] }));

export function PersonnelTable({ wkId, personnel, units }: { wkId: string; personnel: PersonnelDto[]; units: UnitDto[] }) {
  const crud = usePersonnelCrud(wkId);
  const unitOptions = units.map((u) => ({ value: u.id, label: u.label }));
  const [draft, setDraft] = useState({ rank: "", name: "", role: "other" as PersonnelDto["role"], unitId: "", phone: "" });

  return (
    <section className="rounded-lg border p-4">
      <h2 className="font-medium">Personal</h2>
      <p className="mb-3 text-sm text-muted-foreground">Kader für Tagesof-/Wachtof-Zuteilung und Verantwortungen. Änderungen werden beim Verlassen des Feldes gespeichert.</p>
      <table className="w-full text-sm">
        <thead className="text-left text-xs text-muted-foreground">
          <tr>
            <th className="w-28 p-1">Grad</th>
            <th className="p-1">Name</th>
            <th className="w-40 p-1">Funktion</th>
            <th className="w-40 p-1">Zug</th>
            <th className="w-36 p-1">Telefon</th>
            <th className="w-10 p-1"></th>
          </tr>
        </thead>
        <tbody>
          {personnel.map((p) => (
            <tr key={p.id}>
              <td className="p-1"><BlurInput value={p.rank} onCommit={(rank) => crud.update.mutate({ id: p.id, patch: { rank } })} /></td>
              <td className="p-1"><BlurInput value={p.name} onCommit={(name) => crud.update.mutate({ id: p.id, patch: { name } })} /></td>
              <td className="p-1"><NativeSelect options={ROLE_OPTIONS} value={p.role} onChange={(e) => crud.update.mutate({ id: p.id, patch: { role: e.target.value as PersonnelDto["role"] } })} className="w-full" /></td>
              <td className="p-1"><NativeSelect options={unitOptions} placeholder="–" value={p.unitId ?? ""} onChange={(e) => crud.update.mutate({ id: p.id, patch: { unitId: e.target.value || null } })} className="w-full" /></td>
              <td className="p-1"><BlurInput value={p.phone} onCommit={(phone) => crud.update.mutate({ id: p.id, patch: { phone } })} /></td>
              <td className="p-1"><ConfirmButton size="icon-sm" onConfirm={() => crud.remove.mutate(p.id)}><Trash2 /></ConfirmButton></td>
            </tr>
          ))}
          <tr className="border-t">
            <td className="p-1"><Input placeholder="Grad" value={draft.rank} onChange={(e) => setDraft({ ...draft, rank: e.target.value })} /></td>
            <td className="p-1"><Input placeholder="Name, Vorname" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></td>
            <td className="p-1"><NativeSelect options={ROLE_OPTIONS} value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value as PersonnelDto["role"] })} className="w-full" /></td>
            <td className="p-1"><NativeSelect options={unitOptions} placeholder="–" value={draft.unitId} onChange={(e) => setDraft({ ...draft, unitId: e.target.value })} className="w-full" /></td>
            <td className="p-1"><Input placeholder="Telefon" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></td>
            <td className="p-1">
              <Button
                size="icon-sm"
                disabled={!draft.name.trim() || crud.create.isPending}
                onClick={() =>
                  crud.create.mutate(
                    { ...draft, unitId: draft.unitId || null, order: personnel.length },
                    { onSuccess: () => setDraft({ rank: "", name: "", role: "other", unitId: "", phone: "" }) },
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
