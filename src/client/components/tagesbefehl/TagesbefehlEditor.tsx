"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Plus, Printer, RefreshCw, RotateCcw, Trash2, Undo2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BlurInput } from "@/client/components/common/BlurInput";
import { Field } from "@/client/components/common/Field";
import { NativeSelect } from "@/client/components/common/NativeSelect";
import {
  useAddTagesbefehlRow,
  useDeleteTagesbefehlRow,
  useMoveTagesbefehlRow,
  useRegenerateTagesbefehl,
  useRestoreTagesbefehlRow,
  useTagesbefehl,
  useUpdateTagesbefehl,
  useUpdateTagesbefehlRow,
} from "@/client/api/hooks";
import { GROUP_ALLE, STATUSES, STATUS_LABELS, TB_SECTIONS, TB_SECTION_TITLES, WEEKDAY_NAMES_DE, type TbSection } from "@/shared/constants";
import { addDaysIso, formatIsoDe } from "@/shared/time";
import type { TagesbefehlRowPatch } from "@/shared/schemas";
import type { TagesbefehlBundle, TagesbefehlRowDto, TermTemplateDto } from "@/shared/types";

interface Props {
  wkId: string;
  dayId: string;
  initialData: TagesbefehlBundle;
}

function termList(terms: TermTemplateDto[], kind: TermTemplateDto["kind"]) {
  return terms.filter((t) => t.kind === kind).map((t) => (t.it ? `${t.de} / ${t.it}` : t.de));
}

export function TagesbefehlEditor({ wkId, dayId, initialData }: Props) {
  const { data } = useTagesbefehl(dayId, initialData);
  const bundle = data ?? initialData;
  const { day, week, tagesbefehl: tb, rows, groups, settings, terms } = bundle;
  const regenerate = useRegenerateTagesbefehl(dayId);
  const updateTb = useUpdateTagesbefehl(dayId);
  const addRow = useAddTagesbefehlRow(dayId);
  const updateRow = useUpdateTagesbefehlRow(dayId);
  const deleteRow = useDeleteTagesbefehlRow(dayId);
  const restoreRow = useRestoreTagesbefehlRow(dayId);
  const moveRow = useMoveTagesbefehlRow(dayId);
  const [showDeleted, setShowDeleted] = useState(false);

  const title = `Tagesbefehl Nr ${tb?.number ?? "–"} für ${WEEKDAY_NAMES_DE[day.weekday].toUpperCase()}, ${formatIsoDe(day.date)}`;
  const prevDate = addDaysIso(day.date, -1);
  const nextDate = addDaysIso(day.date, 1);

  const rowsIn = (section: TbSection, groupKey: string | null) =>
    rows.filter((r) => r.section === section && (section !== "dienstbetrieb" || r.groupKey === groupKey) && (showDeleted || !r.deleted)).sort((a, b) => a.order - b.order);

  const addManual = (section: TbSection, groupKey: string | null) =>
    addRow.mutate({ section, groupKey, groupLabel: groups.find((g) => g.key === groupKey)?.label ?? "", timeText: "", activity: "", responsibility: "", location: "" });

  function RowLine({ r }: { r: TagesbefehlRowDto }) {
    const patch = (p: TagesbefehlRowPatch) => updateRow.mutate({ id: r.id, patch: p });
    const cls = r.deleted ? "opacity-40 line-through" : "";
    return (
      <tr className={`group border-b border-black/10 align-top ${r.deleted ? "bg-muted/30" : ""}`}>
        <td className={`w-28 p-0.5 ${cls}`}>
          <BlurInput className="h-7 font-mono text-xs" value={r.timeText} onCommit={(timeText) => patch({ timeText })} placeholder="0730-0800" />
        </td>
        <td className={`p-0.5 ${cls}`}>
          <div className="flex items-start gap-1">
            <BlurInput className="h-7 text-xs" value={r.activity} onCommit={(activity) => patch({ activity })} placeholder="Aktivität" />
          </div>
          <div className="mt-0.5 flex flex-wrap gap-1 empty:hidden">
            {r.overridden && !r.orphan && (
              <Badge variant="secondary" className="cursor-pointer text-[10px]" title="Angepasst – Klick setzt auf WAP-Werte zurück" onClick={() => patch({ resetToSource: true })}>
                <RotateCcw className="size-3" /> angepasst
              </Badge>
            )}
            {r.sourceChanged && !r.orphan && r.sourceSnapshot && (
              <Badge
                variant="destructive"
                className="cursor-pointer text-[10px]"
                title={`WAP jetzt: ${r.sourceSnapshot.timeText} ${r.sourceSnapshot.activity} · ${r.sourceSnapshot.responsibility} · ${r.sourceSnapshot.location} – Klick übernimmt`}
                onClick={() => patch({ resetToSource: true })}
              >
                Quelle geändert → übernehmen
              </Badge>
            )}
            {r.orphan && <Badge variant="outline" className="text-[10px]" title="Der Block im WAP existiert nicht mehr">Quelle gelöscht</Badge>}
            {r.sourceKind === "manual" && <Badge variant="outline" className="text-[10px]">manuell</Badge>}
          </div>
        </td>
        <td className={`w-44 p-0.5 ${cls}`}>
          <BlurInput className="h-7 text-xs" value={r.responsibility} onCommit={(responsibility) => patch({ responsibility })} placeholder="Verantwortung" />
        </td>
        <td className={`w-44 p-0.5 ${cls}`}>
          <BlurInput className="h-7 text-xs" value={r.location} onCommit={(location) => patch({ location })} placeholder="Standort" />
        </td>
        <td className="w-24 p-0.5">
          <div className="flex opacity-30 group-hover:opacity-100">
            {r.deleted ? (
              <Button variant="ghost" size="icon-xs" title="Wiederherstellen" onClick={() => restoreRow.mutate(r.id)}><Undo2 /></Button>
            ) : (
              <>
                <Button variant="ghost" size="icon-xs" title="Nach oben" onClick={() => moveRow.mutate({ id: r.id, dir: -1 })}><ArrowUp /></Button>
                <Button variant="ghost" size="icon-xs" title="Nach unten" onClick={() => moveRow.mutate({ id: r.id, dir: 1 })}><ArrowDown /></Button>
                <Button variant="ghost" size="icon-xs" title={r.sourceKind === "manual" ? "Löschen" : "Ausblenden (kommt beim Neu-Generieren nicht zurück)"} onClick={() => deleteRow.mutate(r.id)}><Trash2 /></Button>
              </>
            )}
          </div>
        </td>
      </tr>
    );
  }

  function AddRowButton({ section, groupKey }: { section: TbSection; groupKey: string | null }) {
    return (
      <tr>
        <td colSpan={5} className="p-0.5">
          <Button variant="ghost" size="xs" className="text-muted-foreground" onClick={() => addManual(section, groupKey)}>
            <Plus /> Zeile
          </Button>
        </td>
      </tr>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl p-4">
      <datalist id="tb-activity">{termList(terms, "activity").map((t) => <option key={t} value={t} />)}</datalist>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="icon-sm" nativeButton={false} render={<Link href={`/wk/${wkId}/day/${prevDate}/tagesbefehl`} />} title="Vortag">
          <ChevronLeft />
        </Button>
        <Button variant="ghost" size="icon-sm" nativeButton={false} render={<Link href={`/wk/${wkId}/day/${nextDate}/tagesbefehl`} />} title="Folgetag">
          <ChevronRight />
        </Button>
        <Link href={`/wk/${wkId}/week/${week.index}`} className="text-sm text-muted-foreground underline">
          Zurück zum WAP {week.label}
        </Link>
        <div className="ml-auto flex items-center gap-2">
          {tb && (
            <label className="flex items-center gap-1 text-xs text-muted-foreground">
              <input type="checkbox" checked={showDeleted} onChange={(e) => setShowDeleted(e.target.checked)} /> ausgeblendete Zeilen zeigen
            </label>
          )}
          {tb && (
            <Button variant="outline" size="sm" nativeButton={false} render={<a href={`/print/tagesbefehl/${dayId}`} target="_blank" rel="noreferrer" />} title="Druckansicht A4">
              <Printer /> Drucken
            </Button>
          )}
          <Button variant={tb ? "outline" : "default"} size="sm" disabled={regenerate.isPending} onClick={() => regenerate.mutate()}>
            <RefreshCw /> {tb ? "Aus WAP neu generieren" : "Aus WAP generieren"}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4 text-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="text-xs text-muted-foreground">{settings.companyName}</div>
            <h1 className="text-lg font-semibold">Tagesbefehl / Ordine del giorno</h1>
            <div className="font-medium">{title}</div>
          </div>
          {tb && tb.status !== "genehmigt" && <div className="rounded border border-destructive px-2 py-1 text-xs font-semibold text-destructive">PROVISORISCH</div>}
        </div>

        {!tb ? (
          <p className="mt-4 text-muted-foreground">Für diesen Tag existiert noch kein Tagesbefehl. «Aus WAP generieren» erstellt ihn aus den Blöcken des Tages und den Standardzeiten.</p>
        ) : (
          <>
            <div className="mt-3 grid gap-3 sm:grid-cols-5">
              <Field label="Status">
                <NativeSelect size="sm" options={STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))} value={tb.status} onChange={(e) => updateTb.mutate({ status: e.target.value as typeof tb.status })} />
              </Field>
              <Field label="Nr">
                <Input className="h-7" type="number" value={tb.number} onChange={(e) => updateTb.mutate({ number: Number(e.target.value) })} />
              </Field>
              <Field label="Gültig ab">
                <BlurInput className="h-7" value={tb.validFrom} onCommit={(validFrom) => updateTb.mutate({ validFrom })} />
              </Field>
              <Field label="Revision">
                <Input className="h-7" type="number" value={tb.revision} onChange={(e) => updateTb.mutate({ revision: Number(e.target.value) })} />
              </Field>
              <Field label="Ersetzt Version">
                <BlurInput className="h-7" value={tb.replacesVersion} onCommit={(replacesVersion) => updateTb.mutate({ replacesVersion })} />
              </Field>
            </div>

            {TB_SECTIONS.map((section) => (
              <section key={section} className="mt-5">
                <h2 className="mb-1 border-b-2 border-black/60 pb-0.5 font-semibold">{TB_SECTION_TITLES[section]}</h2>
                <table className="w-full text-xs">
                  <thead className="text-left text-[10px] text-muted-foreground">
                    <tr>
                      <th className="p-0.5">Zeit</th>
                      <th className="p-0.5">Aktivität</th>
                      <th className="p-0.5">Verantwortung</th>
                      <th className="p-0.5">Standort</th>
                      <th></th>
                    </tr>
                  </thead>
                  {section === "dienstbetrieb" ? (
                    groups.map((g) => (
                      <tbody key={g.key}>
                        <tr>
                          <td colSpan={5} className={`pt-2 pb-0.5 font-semibold ${g.key === GROUP_ALLE ? "" : "italic"}`}>{g.label}</td>
                        </tr>
                        {rowsIn(section, g.key).map((r) => <RowLine key={r.id} r={r} />)}
                        <AddRowButton section={section} groupKey={g.key} />
                      </tbody>
                    ))
                  ) : (
                    <tbody>
                      {rowsIn(section, null).map((r) => <RowLine key={r.id} r={r} />)}
                      {rowsIn(section, null).length === 0 && section === "besonderes" && (
                        <tr><td colSpan={5} className="p-0.5 text-muted-foreground">absichtlich leer</td></tr>
                      )}
                      <AddRowButton section={section} groupKey={null} />
                    </tbody>
                  )}
                </table>
              </section>
            ))}

            <div className="mt-6 grid gap-4 text-xs sm:grid-cols-2">
              <div>
                <div className="font-semibold">Eingesehen von</div>
                <div>{settings.distribution.eingesehenVon}</div>
                <div className="mt-6 text-muted-foreground">{settings.batKdtName}</div>
              </div>
              <div>
                <div className="font-semibold">{settings.companyName}</div>
                <div className="mt-6">{settings.kpKdtName}</div>
                <div className="text-muted-foreground">Einh Kdt</div>
              </div>
              <div>
                <div className="font-semibold">Geht an</div>
                {settings.distribution.gehtAn.map((x) => <div key={x}>{x}</div>)}
              </div>
              <div>
                <div className="font-semibold">z K an</div>
                {settings.distribution.zKAn.map((x) => <div key={x}>{x}</div>)}
              </div>
            </div>
            <p className="mt-4 text-[10px] text-muted-foreground">
              Zuletzt aus WAP generiert: {tb.lastRegeneratedAt ? new Date(tb.lastRegeneratedAt).toLocaleString("de-CH") : "–"}. Generierte Zeilen werden beim Neu-Generieren aktualisiert; von dir angepasste Zeilen bleiben erhalten und werden markiert.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
