import { notFound } from "next/navigation";
import { getRequestContext } from "@/server/auth/context";
import { weekRepo } from "@/server/repositories/weekRepo";
import { weekService } from "@/server/services/blockService";
import { WeekGrid } from "@/client/components/week-grid/WeekGrid";

export const dynamic = "force-dynamic";

export default async function WeekPage({ params }: { params: Promise<{ wkId: string; index: string }> }) {
  const { wkId, index } = await params;
  const ctx = getRequestContext();
  const week = weekRepo.byWkAndIndex(ctx.db, wkId, Number(index));
  if (!week) notFound();
  const bundle = weekService.bundle(ctx, week.id);
  return <WeekGrid wkId={wkId} weekId={week.id} initialData={bundle} />;
}
