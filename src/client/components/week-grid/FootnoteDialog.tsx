"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/client/components/common/Field";
import { TimeInput } from "@/client/components/common/TimeInput";
import type { FootnoteDto } from "@/shared/types";

export interface FootnoteDialogState {
  mode: "create" | "edit";
  footnote: Partial<FootnoteDto> & Pick<FootnoteDto, "dayId" | "startMin" | "endMin">;
}

interface Props {
  state: FootnoteDialogState | null;
  onClose: () => void;
  onSave: (data: { dayId: string; number?: number; text: string; startMin: number; endMin: number }, id?: string) => void;
  onDelete?: (id: string) => void;
}

export function FootnoteDialog(props: Props) {
  if (!props.state) return null;
  return <FootnoteForm key={props.state.footnote.id ?? `new-${props.state.footnote.dayId}-${props.state.footnote.startMin}`} {...props} state={props.state} />;
}

function FootnoteForm({ state, onClose, onSave, onDelete }: Props & { state: FootnoteDialogState }) {
  const [text, setText] = useState(state.footnote.text ?? "");
  const [number, setNumber] = useState<string>(state.footnote.number != null ? String(state.footnote.number) : "");
  const [startMin, setStartMin] = useState(state.footnote.startMin);
  const [endMin, setEndMin] = useState(state.footnote.endMin);

  const submit = () =>
    onSave(
      { dayId: state.footnote.dayId, number: number.trim() === "" ? undefined : Number(number), text: text.trim(), startMin, endMin: Math.max(endMin, startMin + 15) },
      state.footnote.id,
    );

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submit();
        }}
      >
        <DialogHeader>
          <DialogTitle>{state.mode === "create" ? "Neuer Termin / Info" : "Termin / Info bearbeiten"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid grid-cols-3 gap-2">
            <Field label="Nummer" hint="leer = automatisch">
              <Input value={number} onChange={(e) => setNumber(e.target.value)} inputMode="numeric" className="font-mono" />
            </Field>
            <Field label="Von"><TimeInput value={startMin} snap onChange={(v) => v != null && setStartMin(v)} /></Field>
            <Field label="Bis"><TimeInput value={endMin} snap onChange={(v) => v != null && setEndMin(v)} /></Field>
          </div>
          <Field label="Text (erscheint in der Fusszeile des Tages)">
            <Textarea rows={3} value={text} autoFocus onChange={(e) => setText(e.target.value)} />
          </Field>
        </div>
        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <div>
            {state.mode === "edit" && state.footnote.id && onDelete && (
              <Button variant="destructive" size="sm" onClick={() => onDelete(state.footnote.id!)}>
                <Trash2 /> Löschen
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Abbrechen</Button>
            <Button onClick={submit}>Speichern</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
