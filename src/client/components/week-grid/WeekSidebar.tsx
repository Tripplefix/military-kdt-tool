"use client";

import { Input } from "@/components/ui/input";
import { BlurInput } from "@/client/components/common/BlurInput";
import { NativeSelect } from "@/client/components/common/NativeSelect";
import { Field } from "@/client/components/common/Field";
import { STATUSES, STATUS_LABELS } from "@/shared/constants";
import type { WeekPatch } from "@/shared/schemas";
import type { PersonnelDto, SettingsDto, WeekDto } from "@/shared/types";
import { personName } from "./DayFooter";

interface Props {
  week: WeekDto;
  settings: SettingsDto;
  personnel: PersonnelDto[];
  onPatch: (patch: WeekPatch) => void;
}

export function WeekSidebar({ week, settings, personnel, onPatch }: Props) {
  const wachtof = personnel.find((p) => p.id === week.wachtofPersonnelId);
  return (
    <div className="flex flex-col gap-3 p-2 text-xs">
      <Field label="Status">
        <NativeSelect
          size="sm"
          options={STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
          value={week.status}
          onChange={(e) => onPatch({ status: e.target.value as WeekDto["status"] })}
        />
      </Field>
      <Field label="Stand">
        <Input type="date" className="h-7 text-xs" value={week.standDate ?? ""} onChange={(e) => onPatch({ standDate: e.target.value || null })} />
      </Field>
      <Field label="Wachtof (ganze Woche)">
        <NativeSelect
          size="sm"
          options={personnel.map((p) => ({ value: p.id, label: personName(p) }))}
          placeholder="–"
          value={week.wachtofPersonnelId ?? ""}
          onChange={(e) => onPatch({ wachtofPersonnelId: e.target.value || null })}
        />
      </Field>
      <Field label="Bemerkungen">
        <BlurInput multiline rows={6} className="text-xs" value={week.remarks} onCommit={(remarks) => onPatch({ remarks })} placeholder={settings.remarksDefault} />
      </Field>
      <div className="rounded border p-2">
        <div className="font-semibold">Telefonnummern</div>
        <div>KP: {settings.phoneKp}</div>
        <div>LVZ/MCC: {settings.phoneLvzMcc}</div>
        <div>Tagesof: {settings.phoneTagesof}</div>
        <div>Wachtof: {wachtof ? `${personName(wachtof)} ${wachtof.phone}` : settings.phoneWachtof}</div>
      </div>
      <Field label="Wochenziele">
        <BlurInput multiline rows={6} className="text-xs" value={week.wochenziele} onCommit={(wochenziele) => onPatch({ wochenziele })} placeholder={settings.wochenzieleDefault} />
      </Field>
    </div>
  );
}
