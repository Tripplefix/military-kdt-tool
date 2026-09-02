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

## Struktur

- `src/app` – Next.js App Router (Seiten, API-Routen, Druckansichten)
- `src/server` – Datenbank (Drizzle + SQLite), Repositories, Services, Auth-Kontext
- `src/shared` – reine Logik ohne Node-/Browser-Abhängigkeiten (Zeit, Lanes, Tagesbefehl-Generierung)
- `src/client` – React-Komponenten, API-Hooks, Styles
- `tests` – Vitest-Tests
