import { notFound } from "next/navigation";
import { getRequestContext } from "@/server/auth/context";
import { weekRepo } from "@/server/repositories/weekRepo";
import { tagesbefehlService } from "@/server/services/tagesbefehlService";
import { TagesbefehlEditor } from "@/client/components/tagesbefehl/TagesbefehlEditor";

export const dynamic = "force-dynamic";

export default async function TagesbefehlPage({ params }: { params: Promise<{ wkId: string; date: string }> }) {
  const { wkId, date } = await params;
  const ctx = getRequestContext();
  const day = weekRepo.dayByDate(ctx.db, wkId, date);
  if (!day) notFound();
  const bundle = tagesbefehlService.bundle(ctx, day.id);
  return <TagesbefehlEditor wkId={wkId} dayId={day.id} initialData={bundle} />;
}
