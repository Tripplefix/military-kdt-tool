"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWkBundle } from "@/client/api/hooks";
import type { WkBundle } from "@/shared/types";
import { GeneralForm } from "./GeneralForm";
import { StandardTimesForm } from "./StandardTimesForm";
import { PersonnelTable } from "./PersonnelTable";
import { UnitsTable } from "./UnitsTable";
import { CategoriesTable } from "./CategoriesTable";
import { TermsTable } from "./TermsTable";
import { WeeksTable } from "./WeeksTable";

export function SettingsPage({ wkId, initialData }: { wkId: string; initialData: WkBundle }) {
  const { data } = useWkBundle(wkId, initialData);
  const bundle = data ?? initialData;
  return (
    <main className="mx-auto w-full max-w-6xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Einstellungen – {bundle.wk.name}</h1>
      <Tabs defaultValue="allgemein">
        <TabsList className="flex-wrap">
          <TabsTrigger value="allgemein">Allgemein</TabsTrigger>
          <TabsTrigger value="zeiten">Standardzeiten</TabsTrigger>
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="zuege">Züge</TabsTrigger>
          <TabsTrigger value="kategorien">Kategorien</TabsTrigger>
          <TabsTrigger value="begriffe">Begriffe</TabsTrigger>
          <TabsTrigger value="wochen">Wochen</TabsTrigger>
        </TabsList>
        <TabsContent value="allgemein" className="mt-4">
          <GeneralForm wkId={wkId} settings={bundle.settings} />
        </TabsContent>
        <TabsContent value="zeiten" className="mt-4">
          <StandardTimesForm wkId={wkId} settings={bundle.settings} />
        </TabsContent>
        <TabsContent value="personal" className="mt-4">
          <PersonnelTable wkId={wkId} personnel={bundle.personnel} units={bundle.units} />
        </TabsContent>
        <TabsContent value="zuege" className="mt-4">
          <UnitsTable wkId={wkId} units={bundle.units} />
        </TabsContent>
        <TabsContent value="kategorien" className="mt-4">
          <CategoriesTable wkId={wkId} categories={bundle.categories} />
        </TabsContent>
        <TabsContent value="begriffe" className="mt-4">
          <TermsTable wkId={wkId} terms={bundle.terms} />
        </TabsContent>
        <TabsContent value="wochen" className="mt-4">
          <WeeksTable wkId={wkId} weeks={bundle.weeks} />
        </TabsContent>
      </Tabs>
    </main>
  );
}
