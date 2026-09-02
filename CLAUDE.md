# KDT Tool – Hinweise für die Arbeit am Code

- Sprache im UI und in Kommentaren: Deutsch (Schweizer Schreibweise, «ss» statt «ß»).
- Client (`src/client`, `src/shared`) darf nie aus `src/server` importieren; Datenzugriff nur über `/api`.
- Zeiten sind Minuten seit Mitternacht, Raster 0500–2300 in 15-Minuten-Schritten (`src/shared/time.ts`).
- Spalten (Lanes) je Woche in `lane` (dayId = null) mit optionalem Tages-Override (dayId gesetzt);
  Blöcke speichern `laneStartOrder` + `laneSpan` (Index, nicht Lane-IDs).
- Tagesbefehl-Logik ist rein und getestet: `src/shared/tagesbefehl/{generate,merge}.ts`, Tests in `tests/`.
- Schema-Änderung: `src/server/db/schema/index.ts` anpassen, dann `pnpm db:generate && pnpm db:migrate`.
- Prüfen vor Commit: `pnpm typecheck && pnpm lint && pnpm test`.
- Browser-Tests/Screenshots: Playwright ist als Dev-Abhängigkeit installiert (`node_modules/playwright`).
