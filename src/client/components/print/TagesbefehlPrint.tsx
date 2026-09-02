"use client";

import { Fragment, useEffect } from "react";
import { GROUP_ALLE, TB_SECTIONS, TB_SECTION_TITLES, WEEKDAY_NAMES_DE, type TbSection } from "@/shared/constants";
import { formatIsoDe } from "@/shared/time";
import type { TagesbefehlBundle, TagesbefehlRowDto } from "@/shared/types";
import "./print.css";
import { PrintToolbar } from "./PrintToolbar";

export function TagesbefehlPrint({ bundle }: { bundle: TagesbefehlBundle }) {
  const { day, tagesbefehl: tb, rows, groups, settings } = bundle;
  const title = `Tagesbefehl Nr ${tb?.number ?? "–"} für ${WEEKDAY_NAMES_DE[day.weekday].toUpperCase()}, ${formatIsoDe(day.date)}`;
  useEffect(() => {
    document.title = `Tagesbefehl ${tb?.number ?? ""} ${formatIsoDe(day.date)}`;
  }, [tb, day]);

  const rowsIn = (section: TbSection, groupKey: string | null) =>
    rows.filter((r) => !r.deleted && r.section === section && (section !== "dienstbetrieb" || r.groupKey === groupKey)).sort((a, b) => a.order - b.order);

  const Row = ({ r }: { r: TagesbefehlRowDto }) => (
    <tr className="break-inside-avoid align-top">
      <td className="w-[22mm] py-0.5 pr-1 font-mono">{r.timeText}</td>
      <td className="py-0.5 pr-1 whitespace-pre-line">{r.activity}</td>
      <td className="w-[38mm] py-0.5 pr-1">{r.responsibility}</td>
      <td className="w-[42mm] py-0.5">{r.location}</td>
    </tr>
  );

  return (
    <div className="print-a4">
      <PrintToolbar hint="A4 hoch." />
      <div className="print-page-a4 relative text-[9pt] leading-snug">
        {(!tb || tb.status !== "genehmigt") && <div className="tb-watermark">PROVISORISCH</div>}
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-bold">{settings.companyName}</div>
              <div className="text-[13pt] font-bold">Tagesbefehl / Ordine del giorno</div>
            </div>
            <div className="text-right text-[8pt]">
              <div>Gültig ab: {tb?.validFrom || "–"}</div>
              <div>Revision: {tb?.revision ?? "–"}</div>
              <div>Ersetzt Version: {tb?.replacesVersion || "–"}</div>
            </div>
          </div>
          <div className="mt-3 text-[11pt] font-bold">{title}</div>

          {!tb ? (
            <p className="mt-4">Für diesen Tag existiert noch kein Tagesbefehl.</p>
          ) : (
            <>
              <table className="mt-3 w-full border-collapse">
                <thead className="text-left">
                  <tr className="border-b border-black">
                    <th className="w-[22mm] py-0.5 pr-1">Zeit</th>
                    <th className="py-0.5 pr-1">Aktivität</th>
                    <th className="w-[38mm] py-0.5 pr-1">Verantwortung</th>
                    <th className="w-[42mm] py-0.5">Standort</th>
                  </tr>
                </thead>
                {TB_SECTIONS.map((section) => (
                  <tbody key={section}>
                    <tr className="break-inside-avoid">
                      <td colSpan={4} className="bg-neutral-200 px-1 pt-2 pb-0.5 font-bold" style={{ paddingTop: "4mm" }}>
                        {TB_SECTION_TITLES[section]}
                      </td>
                    </tr>
                    {section === "dienstbetrieb" ? (
                      groups.map((g) => {
                        const list = rowsIn(section, g.key);
                        return (
                          <Fragment key={g.key}>
                            <tr className="break-inside-avoid">
                              <td colSpan={4} className={`pt-1.5 pb-0.5 font-bold ${g.key === GROUP_ALLE ? "" : "italic"}`}>
                                {g.label}
                              </td>
                            </tr>
                            {list.map((r) => <Row key={r.id} r={r} />)}
                          </Fragment>
                        );
                      })
                    ) : (
                      <>
                        {rowsIn(section, null).map((r) => <Row key={r.id} r={r} />)}
                        {rowsIn(section, null).length === 0 && (
                          <tr><td colSpan={4} className="py-0.5">absichtlich leer</td></tr>
                        )}
                      </>
                    )}
                  </tbody>
                ))}
              </table>

              <div className="mt-8 grid grid-cols-2 gap-6 break-inside-avoid text-[8pt]">
                <div>
                  <div>Eingesehen von</div>
                  <div className="mt-10 border-t border-black pt-0.5">{settings.batKdtName}</div>
                  <div>{settings.distribution.eingesehenVon}</div>
                </div>
                <div>
                  <div>{settings.companyName}</div>
                  <div className="mt-10 border-t border-black pt-0.5">{settings.kpKdtName}</div>
                  <div>Einh Kdt</div>
                </div>
                <div>
                  <div className="font-bold">Geht an</div>
                  {settings.distribution.gehtAn.map((x) => <div key={x}>{x}</div>)}
                </div>
                <div>
                  <div className="font-bold">z K an</div>
                  {settings.distribution.zKAn.map((x) => <div key={x}>{x}</div>)}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
