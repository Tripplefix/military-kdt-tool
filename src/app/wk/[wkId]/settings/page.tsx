import { notFound } from "next/navigation";
import { getRequestContext } from "@/server/auth/context";
import { HttpError } from "@/server/http/handler";
import { wkService } from "@/server/services/wkService";
import { SettingsPage } from "@/client/components/settings/SettingsPage";
import type { WkBundle } from "@/shared/types";

export const dynamic = "force-dynamic";

function loadBundle(wkId: string): WkBundle | null {
  try {
    return wkService.bundle(getRequestContext(), wkId);
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) return null;
    throw e;
  }
}

export default async function Settings({ params }: { params: Promise<{ wkId: string }> }) {
  const { wkId } = await params;
  const bundle = loadBundle(wkId);
  if (!bundle) notFound();
  return <SettingsPage wkId={wkId} initialData={bundle} />;
}
