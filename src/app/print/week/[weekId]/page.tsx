import { notFound } from "next/navigation";
import { getRequestContext } from "@/server/auth/context";
import { HttpError } from "@/server/http/handler";
import { weekService } from "@/server/services/blockService";
import { WeekPrint } from "@/client/components/print/WeekPrint";
import type { WeekBundle } from "@/shared/types";

export const dynamic = "force-dynamic";

function load(weekId: string): WeekBundle | null {
  try {
    return weekService.bundle(getRequestContext(), weekId);
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) return null;
    throw e;
  }
}

export default async function PrintWeekPage({ params }: { params: Promise<{ weekId: string }> }) {
  const { weekId } = await params;
  const bundle = load(weekId);
  if (!bundle) notFound();
  return <WeekPrint bundle={bundle} />;
}
