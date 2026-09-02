import type { StandardReport, StandardTime } from "./schema";
import type { CategoryShape, TbSection, TermKind } from "@/shared/constants";

export const DEFAULT_STANDARD_TIMES: StandardTime[] = [
  { key: "tagwache", label: "Tagwache / diane", startMin: 345, endMin: null, responsibility: "Tagesof", location: "Ukft / cant", days: "all", inTagesbefehl: true, order: 0 },
  { key: "morgenessen", label: "Morgenessen / colazione", startMin: 360, endMin: 420, responsibility: "Fur", location: "Esssaal / refettorio", days: "all", inTagesbefehl: true, order: 1 },
  { key: "av", label: "AV / APE", startMin: 435, endMin: null, responsibility: "Einh Fw / sgtm U", location: "Ukft / cant", days: "weekday", inTagesbefehl: true, order: 2 },
  { key: "mittagessen", label: "Mittagessen / pranzo", startMin: 720, endMin: 780, responsibility: "Fur", location: "Esssaal / refettorio", days: "all", inTagesbefehl: true, order: 3 },
  { key: "nachtessen", label: "Nachtessen / cena", startMin: 1080, endMin: 1140, responsibility: "Fur", location: "Esssaal / refettorio", days: "all", inTagesbefehl: true, order: 4 },
  { key: "hvGross", label: "HV gross / APP", startMin: 1125, endMin: null, responsibility: "Einh Fw / sgtm U", location: "AV-Platz / place d'appel", days: "weekday", inTagesbefehl: false, order: 5 },
  { key: "hvKlein", label: "HV klein / APP", startMin: 1185, endMin: null, responsibility: "Einh Fw / sgtm U", location: "AV-Platz / place d'appel", days: "weekday", inTagesbefehl: false, order: 6 },
  { key: "hvUrlaub", label: "HV Urlaub", startMin: 1080, endMin: null, responsibility: "Einh Fw / sgtm U", location: "AV-Platz / place d'appel", days: "weekend", inTagesbefehl: true, order: 7 },
  { key: "pdId", label: "PD/ID", startMin: 1290, endMin: 1350, responsibility: "Zfhr / caposez", location: "Ukft / cant", days: "all", inTagesbefehl: true, order: 8 },
  { key: "abv", label: "ABV / APS", startMin: 1350, endMin: null, responsibility: "Tagesof", location: "Ukft / cant", days: "all", inTagesbefehl: true, order: 9 },
];

export const DEFAULT_STANDARD_REPORTS: StandardReport[] = [
  { key: "dienstrapport", label: "Dienstrapport", timeText: "0730-0800", responsibility: "Kp Kdt / cdt cp", location: "Rapportraum", days: "weekday", order: 0 },
  { key: "kompanierapport", label: "Kompanierapport", timeText: "1130-1215", responsibility: "Kp Kdt / cdt cp", location: "Rapportraum", days: "weekday", order: 1 },
];

export const DEFAULT_UNITS: Array<{ key: string; label: string; tagesbefehlLabel: string; kvkOnly: boolean }> = [
  { key: "kdo", label: "Kdo Zug", tagesbefehlLabel: "Kdo Z", kvkOnly: false },
  { key: "log", label: "Log Zug", tagesbefehlLabel: "Log Z", kvkOnly: false },
  { key: "vt", label: "VT Zug", tagesbefehlLabel: "VT Zug", kvkOnly: false },
  { key: "stabszBat", label: "Stabsz Bat", tagesbefehlLabel: "Stabsz Bat", kvkOnly: false },
  { key: "stabszGsVb", label: "Stabsz Gs Vb", tagesbefehlLabel: "Stabsz Gs Vb", kvkOnly: false },
  { key: "syst", label: "Syst Z", tagesbefehlLabel: "Syst Z", kvkOnly: false },
  { key: "wachDet", label: "Wach Det", tagesbefehlLabel: "Wach Det", kvkOnly: true },
  { key: "of", label: "Offiziere", tagesbefehlLabel: "Of", kvkOnly: true },
  { key: "uof", label: "Unteroffiziere", tagesbefehlLabel: "Uof", kvkOnly: true },
];

export const DEFAULT_CATEGORIES: Array<{
  key: string;
  label: string;
  color: string;
  textColor: string;
  shape: CategoryShape;
  excludeFromTagesbefehl: boolean;
  tagesbefehlSection: TbSection;
}> = [
  { key: "dienst", label: "Dienstbetrieb / Ausbildung", color: "#FFFFFF", textColor: "#000000", shape: "rect", excludeFromTagesbefehl: false, tagesbefehlSection: "dienstbetrieb" },
  { key: "meal", label: "Essen", color: "#C3D69B", textColor: "#000000", shape: "rect", excludeFromTagesbefehl: true, tagesbefehlSection: "dienstbetrieb" },
  { key: "av", label: "AV / ABV", color: "#FFD966", textColor: "#000000", shape: "bar", excludeFromTagesbefehl: true, tagesbefehlSection: "dienstbetrieb" },
  { key: "ku", label: "KU / Übung", color: "#C6D9F1", textColor: "#000000", shape: "rect", excludeFromTagesbefehl: false, tagesbefehlSection: "dienstbetrieb" },
  { key: "ausbildung", label: "Ausbildung", color: "#F8CBAD", textColor: "#000000", shape: "rect", excludeFromTagesbefehl: false, tagesbefehlSection: "dienstbetrieb" },
  { key: "wache", label: "Wache", color: "#F2F2F2", textColor: "#000000", shape: "rect", excludeFromTagesbefehl: false, tagesbefehlSection: "besonderes" },
  { key: "rapport", label: "Rapport (AR / KR)", color: "#E6B9B8", textColor: "#000000", shape: "rect", excludeFromTagesbefehl: false, tagesbefehlSection: "rapporte" },
  { key: "rapportBlack", label: "Rapport (DR / BR)", color: "#000000", textColor: "#FFFFFF", shape: "rect", excludeFromTagesbefehl: false, tagesbefehlSection: "rapporte" },
  { key: "besonderes", label: "Besonderes", color: "#FCE4D6", textColor: "#000000", shape: "rect", excludeFromTagesbefehl: false, tagesbefehlSection: "besonderes" },
  { key: "reserve", label: "Reserve / Abtreten", color: "#FFFFFF", textColor: "#000000", shape: "chevron", excludeFromTagesbefehl: false, tagesbefehlSection: "dienstbetrieb" },
];

export const DEFAULT_TERMS: Array<{ kind: TermKind; de: string; it: string }> = [
  { kind: "activity", de: "Tagwache", it: "diane" },
  { kind: "activity", de: "Morgenessen", it: "colazione" },
  { kind: "activity", de: "AV", it: "APE" },
  { kind: "activity", de: "gem beso Bf", it: "secondo ordine speciale" },
  { kind: "activity", de: "Ausb gem Zfhr", it: "instr selon c sect" },
  { kind: "activity", de: "Mittagessen", it: "pranzo" },
  { kind: "activity", de: "Nachtessen", it: "cena" },
  { kind: "activity", de: "WEB", it: "REPE" },
  { kind: "activity", de: "PD/ID", it: "" },
  { kind: "activity", de: "HV", it: "APP" },
  { kind: "activity", de: "Ausgang", it: "sortie" },
  { kind: "activity", de: "Fak Ausgang", it: "cena fak" },
  { kind: "activity", de: "Nacharbeit", it: "ratrapage" },
  { kind: "activity", de: "ABV", it: "APS" },
  { kind: "activity", de: "Dienstbetrieb", it: "" },
  { kind: "activity", de: "AVOR", it: "" },
  { kind: "activity", de: "Einrücken", it: "" },
  { kind: "report", de: "Kompanierapport", it: "" },
  { kind: "report", de: "Dienstrapport", it: "" },
  { kind: "report", de: "Bataillonsrapport", it: "" },
  { kind: "report", de: "Ausbildungsrapport", it: "" },
  { kind: "location", de: "MZG Bonaduz", it: "" },
  { kind: "location", de: "Ukft", it: "cant" },
  { kind: "location", de: "Wachtlokal", it: "" },
  { kind: "location", de: "Esssaal", it: "refettorio" },
  { kind: "location", de: "AV-Platz", it: "place d'appel" },
  { kind: "location", de: "Gelände / Terrain", it: "" },
  { kind: "location", de: "Pausensektor", it: "" },
  { kind: "location", de: "Bat KP", it: "" },
  { kind: "location", de: "Rapportraum", it: "" },
  { kind: "location", de: "MCE Ausb Pl C", it: "" },
  { kind: "location", de: "MCE Ausb Pl D", it: "" },
  { kind: "location", de: "MCE KD 41 1/2", it: "" },
  { kind: "location", de: "MCE KD 41 3", it: "" },
  { kind: "location", de: "MCE KD 48a / 300m", it: "" },
  { kind: "location", de: "Mat Mag", it: "" },
  { kind: "location", de: "Mun Mag", it: "" },
  { kind: "location", de: "Waschplatz", it: "" },
  { kind: "responsibility", de: "Kp Kdt", it: "cdt cp" },
  { kind: "responsibility", de: "Zfhr", it: "caposez" },
  { kind: "responsibility", de: "Einh Fw", it: "sgtm U" },
  { kind: "responsibility", de: "Einh Fur", it: "" },
  { kind: "responsibility", de: "Tagesof", it: "" },
  { kind: "responsibility", de: "Bat Kdt", it: "" },
  { kind: "responsibility", de: "Extern", it: "" },
];
