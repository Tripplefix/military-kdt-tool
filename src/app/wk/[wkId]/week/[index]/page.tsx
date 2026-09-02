import { notFound } from "next/navigation";
import { getRequestContext } from "@/server/auth/context";
import { weekRepo } from "@/server/repositories/weekRepo";
import { weekService } from "@/server/services/blockService";

export const dynamic = "force-dynamic";

export default async function WeekPage({ params }: { params: Promise<{ wkId: string; index: string }> }) {
  const { wkId, index } = await params;
  const ctx = getRequestContext();
  const week = weekRepo.byWkAndIndex(ctx.db, wkId, Number(index));
  if (!week) notFound();
  const bundle = weekService.bundle(ctx, week.id);
  return (
    <main className="p-4">
      <h1 className="text-xl font-semibold">{bundle.week.title}</h1>
      <p className="text-muted-foreground text-sm">
        {bundle.week.label} · {bundle.days[0]?.date} bis {bundle.days[6]?.date} · {bundle.blocks.length} Blöcke
      </p>
      <p className="mt-4 text-sm">Wochenraster folgt in Phase 2.</p>
    </main>
  );
}
