# KDT Tool – WK-Planung

Web-App zur Planung von Wiederholungskursen: Wochenarbeitsplan (WAP) mit Drag & Drop
und daraus generierte Tagesbefehle. Ersetzt die bisherige Excel-Lösung
(`docs/reference/WAP & Tagesbefehle 2026.xlsx`).

## Voraussetzungen

- Node.js 22
- pnpm 10

## Starten

```bash
pnpm install
cp .env.example .env
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Danach `http://localhost:3000` öffnen.

## Skripte

| Skript | Zweck |
|---|---|
| `pnpm dev` | Entwicklungsserver |
| `pnpm build` / `pnpm start` | Produktions-Build und -Start |
| `pnpm test` | Unit-Tests (Vitest) |
| `pnpm lint` / `pnpm typecheck` | ESLint / TypeScript |
| `pnpm db:generate` | Migrationen aus dem Drizzle-Schema erzeugen |
| `pnpm db:migrate` | Migrationen auf die SQLite-Datei anwenden |
| `pnpm db:seed` | Beispieldaten (WK 2026) einspielen |
| `pnpm db:reset` | Datenbank löschen, migrieren, seeden |

## Funktionen

- **Wochenarbeitsplan (WAP)**: Raster 0500–2300 in 15-Minuten-Schritten, Spalten je Zug
  (pro Woche und pro Tag konfigurierbar), Blöcke mit Kategorie-Farben, Standort,
  Verantwortung, Termine/Info-Nummer. Klick = neuer Block, Aufziehen = Block über Zeit und
  Spalten, Ziehen = verschieben (Shift: nur Zeit, Alt: duplizieren), Ränder ziehen = Dauer
  bzw. Spalten ändern. Termine/Info-Marker in der Beso-Spalte, Tagesof je Tag, Bemerkungen,
  Telefonnummern und Wochenziele in der Seitenleiste. Wochen können kopiert werden.
- **Tagesbefehl**: wird aus den Blöcken des Tages, den Standardzeiten (Einstellungen),
  Rapporten und Kontakten generiert (Abschnitte 1–4, Gruppen «Alle» und je Zug). Zeilen sind
  editierbar; beim Neu-Generieren bleiben angepasste Zeilen erhalten und werden markiert,
  ausgeblendete Zeilen kehren nicht zurück, manuelle Zeilen bleiben.
- **Druck**: WAP als A3 quer, Tagesbefehl als A4 hoch (Button «Drucken», dann im Browser
  «Als PDF speichern»). Nicht genehmigte Tagesbefehle tragen das Wasserzeichen PROVISORISCH.
- **Einstellungen**: Einheit, Personen, Telefonnummern, Verteiler, Standardzeiten und
  -rapporte, Personal, Züge, Kategorien, Begriffsvorlagen, Wochen.

## Struktur

- `src/app` – Next.js App Router (Seiten, API-Routen, Druckansichten)
- `src/server` – Datenbank (Drizzle + SQLite), Repositories, Services, Auth-Kontext
- `src/shared` – reine Logik ohne Node-/Browser-Abhängigkeiten (Zeit, Lanes, Tagesbefehl-Generierung)
- `src/client` – React-Komponenten, API-Hooks, Styles
- `tests` – Vitest-Tests
- `drizzle` – SQL-Migrationen (mit `pnpm db:generate` aus dem Schema erzeugt)

## Hosting später

Der Client greift nur über `/api`-Routen auf Daten zu (ESLint verbietet Importe aus
`src/server`). Jede Mutation läuft über `getRequestContext()` und die Hooks in
`src/server/auth/authorize.ts`; dort wird später die Benutzer- und Rechteprüfung ergänzt.
Das Schema nutzt keine SQLite-Spezialitäten, ein Wechsel auf Postgres ist über die
Drizzle-Dialekte vorgesehen.
