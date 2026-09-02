"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { BlurInput } from "@/client/components/common/BlurInput";
import { NativeSelect } from "@/client/components/common/NativeSelect";
import { ConfirmButton } from "@/client/components/common/ConfirmButton";
import { useCategoryCrud } from "@/client/api/hooks";
import { CATEGORY_SHAPES, TB_SECTIONS } from "@/shared/constants";
import type { CategoryDto } from "@/shared/types";

const SHAPE_OPTIONS = CATEGORY_SHAPES.map((s) => ({ value: s, label: { rect: "Rechteck", bar: "Balken", chevron: "Reserve-Form" }[s] }));
const SECTION_OPTIONS = TB_SECTIONS.map((s) => ({
  value: s,
  label: { dienstbetrieb: "1 Dienstbetrieb", besonderes: "2 Besonderes", rapporte: "3 Rapporte", kommandierungen: "4 Kontakte" }[s],
}));

export function CategoriesTable({ wkId, categories }: { wkId: string; categories: CategoryDto[] }) {
  const crud = useCategoryCrud(wkId);
  const [draft, setDraft] = useState({ key: "", label: "", color: "#DDDDDD" });
  return (
    <section className="rounded-lg border p-4">
      <h2 className="font-medium">Kategorien</h2>
      <p className="mb-3 text-sm text-muted-foreground">
        Farbe und Form der Blöcke im WAP. «Nicht im TB» blendet Blöcke dieser Kategorie im Tagesbefehl aus (z. B. Essen, die als Standardzeit erscheinen).
      </p>
      <table className="w-full text-sm">
        <thead className="text-left text-xs text-muted-foreground">
          <tr>
            <th className="w-14 p-1">Farbe</th>
            <th className="w-14 p-1">Text</th>
            <th className="w-32 p-1">Schlüssel</th>
            <th className="p-1">Bezeichnung</th>
            <th className="w-32 p-1">Form</th>
            <th className="w-40 p-1">TB-Abschnitt</th>
            <th className="w-24 p-1">Nicht im TB</th>
            <th className="w-10 p-1"></th>
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c.id}>
              <td className="p-1"><input type="color" value={c.color} onChange={(e) => crud.update.mutate({ id: c.id, patch: { color: e.target.value.toUpperCase() } })} className="h-8 w-10 cursor-pointer rounded border" /></td>
              <td className="p-1"><input type="color" value={c.textColor} onChange={(e) => crud.update.mutate({ id: c.id, patch: { textColor: e.target.value.toUpperCase() } })} className="h-8 w-10 cursor-pointer rounded border" /></td>
              <td className="p-1"><BlurInput className="font-mono" value={c.key} onCommit={(key) => crud.update.mutate({ id: c.id, patch: { key } })} /></td>
              <td className="p-1"><BlurInput value={c.label} onCommit={(label) => crud.update.mutate({ id: c.id, patch: { label } })} /></td>
              <td className="p-1"><NativeSelect options={SHAPE_OPTIONS} value={c.shape} onChange={(e) => crud.update.mutate({ id: c.id, patch: { shape: e.target.value as CategoryDto["shape"] } })} className="w-full" /></td>
              <td className="p-1"><NativeSelect options={SECTION_OPTIONS} value={c.tagesbefehlSection} onChange={(e) => crud.update.mutate({ id: c.id, patch: { tagesbefehlSection: e.target.value as CategoryDto["tagesbefehlSection"] } })} className="w-full" /></td>
              <td className="p-1 text-center"><Checkbox checked={c.excludeFromTagesbefehl} onCheckedChange={(v) => crud.update.mutate({ id: c.id, patch: { excludeFromTagesbefehl: v === true } })} /></td>
              <td className="p-1"><ConfirmButton size="icon-sm" onConfirm={() => crud.remove.mutate(c.id)}><Trash2 /></ConfirmButton></td>
            </tr>
          ))}
          <tr className="border-t">
            <td className="p-1"><input type="color" value={draft.color} onChange={(e) => setDraft({ ...draft, color: e.target.value.toUpperCase() })} className="h-8 w-10 rounded border" /></td>
            <td className="p-1"></td>
            <td className="p-1"><Input className="font-mono" placeholder="schluessel" value={draft.key} onChange={(e) => setDraft({ ...draft, key: e.target.value })} /></td>
            <td className="p-1"><Input placeholder="Bezeichnung" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} /></td>
            <td className="p-1" colSpan={3}></td>
            <td className="p-1">
              <Button
                size="icon-sm"
                disabled={!draft.key.trim() || !draft.label.trim()}
                onClick={() =>
                  crud.create.mutate(
                    { ...draft, textColor: "#000000", shape: "rect", excludeFromTagesbefehl: false, tagesbefehlSection: "dienstbetrieb", order: categories.length },
                    { onSuccess: () => setDraft({ key: "", label: "", color: "#DDDDDD" }) },
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
