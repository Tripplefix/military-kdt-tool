"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BlurInput } from "@/client/components/common/BlurInput";
import { ConfirmButton } from "@/client/components/common/ConfirmButton";
import { useTermCrud } from "@/client/api/hooks";
import { TERM_KINDS, TERM_KIND_LABELS, type TermKind } from "@/shared/constants";
import type { TermTemplateDto } from "@/shared/types";

export function TermsTable({ wkId, terms }: { wkId: string; terms: TermTemplateDto[] }) {
  const crud = useTermCrud(wkId);
  const [drafts, setDrafts] = useState<Record<string, { de: string; it: string }>>({});
  const draft = (k: TermKind) => drafts[k] ?? { de: "", it: "" };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {TERM_KINDS.map((kind) => {
        const list = terms.filter((t) => t.kind === kind);
        return (
          <section key={kind} className="rounded-lg border p-4">
            <h2 className="font-medium">{TERM_KIND_LABELS[kind]}</h2>
            <p className="mb-2 text-xs text-muted-foreground">Vorschläge in den Eingabefeldern (Deutsch / Italienisch).</p>
            <table className="w-full text-sm">
              <tbody>
                {list.map((t) => (
                  <tr key={t.id}>
                    <td className="p-1"><BlurInput value={t.de} onCommit={(de) => crud.update.mutate({ id: t.id, patch: { de } })} /></td>
                    <td className="p-1"><BlurInput value={t.it} placeholder="italienisch" onCommit={(it) => crud.update.mutate({ id: t.id, patch: { it } })} /></td>
                    <td className="w-10 p-1"><ConfirmButton size="icon-sm" onConfirm={() => crud.remove.mutate(t.id)}><Trash2 /></ConfirmButton></td>
                  </tr>
                ))}
                <tr className="border-t">
                  <td className="p-1"><Input placeholder="deutsch" value={draft(kind).de} onChange={(e) => setDrafts({ ...drafts, [kind]: { ...draft(kind), de: e.target.value } })} /></td>
                  <td className="p-1"><Input placeholder="italienisch" value={draft(kind).it} onChange={(e) => setDrafts({ ...drafts, [kind]: { ...draft(kind), it: e.target.value } })} /></td>
                  <td className="p-1">
                    <Button
                      size="icon-sm"
                      disabled={!draft(kind).de.trim()}
                      onClick={() =>
                        crud.create.mutate(
                          { kind, de: draft(kind).de, it: draft(kind).it, order: list.length },
                          { onSuccess: () => setDrafts({ ...drafts, [kind]: { de: "", it: "" } }) },
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
      })}
    </div>
  );
}
