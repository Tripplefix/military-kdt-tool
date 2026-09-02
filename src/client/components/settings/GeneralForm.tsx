"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/client/components/common/Field";
import { useUpdateSettings } from "@/client/api/hooks";
import type { SettingsDto } from "@/shared/types";

export function GeneralForm({ wkId, settings }: { wkId: string; settings: SettingsDto }) {
  const update = useUpdateSettings(wkId);
  const [form, setForm] = useState({
    companyName: settings.companyName,
    battalionName: settings.battalionName,
    kpKdtName: settings.kpKdtName,
    kdtStvName: settings.kdtStvName,
    batKdtName: settings.batKdtName,
    phoneKp: settings.phoneKp,
    phoneLvzMcc: settings.phoneLvzMcc,
    phoneTagesof: settings.phoneTagesof,
    phoneWachtof: settings.phoneWachtof,
    eingesehenVon: settings.distribution.eingesehenVon,
    gehtAn: settings.distribution.gehtAn.join("\n"),
    zKAn: settings.distribution.zKAn.join("\n"),
    remarksDefault: settings.remarksDefault,
    wochenzieleDefault: settings.wochenzieleDefault,
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));
  const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);

  return (
    <form
      className="grid gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        const { eingesehenVon, gehtAn, zKAn, ...rest } = form;
        update.mutate({ ...rest, distribution: { eingesehenVon, gehtAn: lines(gehtAn), zKAn: lines(zKAn) } });
      }}
    >
      <section className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
        <h2 className="font-medium sm:col-span-2">Einheit und Personen</h2>
        <Field label="Einheit (Kp)"><Input value={form.companyName} onChange={set("companyName")} required /></Field>
        <Field label="Bataillon"><Input value={form.battalionName} onChange={set("battalionName")} /></Field>
        <Field label="Kp Kdt"><Input value={form.kpKdtName} onChange={set("kpKdtName")} /></Field>
        <Field label="Kp Kdt Stv"><Input value={form.kdtStvName} onChange={set("kdtStvName")} /></Field>
        <Field label="Bat Kdt"><Input value={form.batKdtName} onChange={set("batKdtName")} /></Field>
      </section>
      <section className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
        <h2 className="font-medium sm:col-span-2">Telefonnummern</h2>
        <Field label="KP"><Input value={form.phoneKp} onChange={set("phoneKp")} /></Field>
        <Field label="LVZ / MCC"><Input value={form.phoneLvzMcc} onChange={set("phoneLvzMcc")} /></Field>
        <Field label="Tagesof"><Input value={form.phoneTagesof} onChange={set("phoneTagesof")} /></Field>
        <Field label="Wachtof"><Input value={form.phoneWachtof} onChange={set("phoneWachtof")} /></Field>
      </section>
      <section className="grid gap-4 rounded-lg border p-4 sm:grid-cols-3">
        <h2 className="font-medium sm:col-span-3">Verteiler Tagesbefehl</h2>
        <Field label="Eingesehen von"><Input value={form.eingesehenVon} onChange={set("eingesehenVon")} /></Field>
        <Field label="Geht an (eine Zeile je Empfänger)"><Textarea rows={3} value={form.gehtAn} onChange={set("gehtAn")} /></Field>
        <Field label="z K an (eine Zeile je Empfänger)"><Textarea rows={3} value={form.zKAn} onChange={set("zKAn")} /></Field>
      </section>
      <section className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
        <h2 className="font-medium sm:col-span-2">Standardtexte WAP</h2>
        <Field label="Bemerkungen (Standard je Woche)"><Textarea rows={5} value={form.remarksDefault} onChange={set("remarksDefault")} /></Field>
        <Field label="Wochenziele (Standard)"><Textarea rows={5} value={form.wochenzieleDefault} onChange={set("wochenzieleDefault")} /></Field>
      </section>
      <div>
        <Button type="submit" disabled={update.isPending}>Speichern</Button>
      </div>
    </form>
  );
}
