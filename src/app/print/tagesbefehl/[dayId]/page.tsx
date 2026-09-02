import { notFound } from "next/navigation";
import { getRequestContext } from "@/server/auth/context";
import { HttpError } from "@/server/http/handler";
import { tagesbefehlService } from "@/server/services/tagesbefehlService";
import { TagesbefehlPrint } from "@/client/components/print/TagesbefehlPrint";
import type { TagesbefehlBundle } from "@/shared/types";

export const dynamic = "force-dynamic";

function load(dayId: string): TagesbefehlBundle | null {
  try {
    return tagesbefehlService.bundle(getRequestContext(), dayId);
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) return null;
    throw e;
  }
}

export default async function PrintTagesbefehlPage({ params }: { params: Promise<{ dayId: string }> }) {
  const { dayId } = await params;
  const bundle = load(dayId);
  if (!bundle) notFound();
  return <TagesbefehlPrint bundle={bundle} />;
}
