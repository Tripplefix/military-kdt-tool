"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/client/components/common/Field";
import { useCreateWk, useWks } from "@/client/api/hooks";
import type { WkDto } from "@/shared/types";
import { formatIsoDe } from "@/shared/time";

export function WkListPage({ initialWks }: { initialWks: WkDto[] }) {
  const router = useRouter();
  const { data: wks = initialWks } = useWks();
  const create = useCreateWk();
  const [name, setName] = useState("WK 2027");
  const [companyName, setCompanyName] = useState("Ter Div Stabskp 3");
  const [startDate, setStartDate] = useState("");
  const [weeks, setWeeks] = useState(3);
  const [firstWeekKvk, setFirstWeekKvk] = useState(true);

  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Dienstleistungen</h1>
      <ul className="mt-4 divide-y rounded-lg border">
        {wks.length === 0 && <li className="p-4 text-sm text-muted-foreground">Noch kein WK angelegt.</li>}
        {wks.map((wk) => (
          <li key={wk.id} className="flex items-center justify-between p-4">
            <div>
              <div className="font-medium">{wk.name}</div>
              <div className="text-sm text-muted-foreground">
                {formatIsoDe(wk.startDate)} – {formatIsoDe(wk.endDate)}
              </div>
            </div>
            <Button render={<Link href={`/wk/${wk.id}/week/0`} />}>Öffnen</Button>
          </li>
        ))}
      </ul>

      <h2 className="mt-10 text-lg font-semibold">Neuen WK anlegen</h2>
      <form
        className="mt-3 grid gap-4 rounded-lg border p-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate(
            { name, companyName, startDate, weeks, firstWeekKvk },
            { onSuccess: (wk) => router.push(`/wk/${wk.id}/settings`) },
          );
        }}
      >
        <Field label="Bezeichnung">
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Einheit">
          <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
        </Field>
        <Field label="Startdatum (Montag der ersten Woche)">
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </Field>
        <Field label="Anzahl Wochen">
          <Input type="number" min={1} max={8} value={weeks} onChange={(e) => setWeeks(Number(e.target.value))} />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={firstWeekKvk} onCheckedChange={(v) => setFirstWeekKvk(v === true)} />
          Erste Woche ist KVK-Woche
        </label>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={create.isPending}>
            Anlegen
          </Button>
        </div>
      </form>
    </main>
  );
}
