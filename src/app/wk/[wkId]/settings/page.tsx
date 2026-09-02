import { getRequestContext } from "@/server/auth/context";
import { wkService } from "@/server/services/wkService";
import { SettingsPage } from "@/client/components/settings/SettingsPage";

export const dynamic = "force-dynamic";

export default async function Settings({ params }: { params: Promise<{ wkId: string }> }) {
  const { wkId } = await params;
  const bundle = wkService.bundle(getRequestContext(), wkId);
  return <SettingsPage wkId={wkId} initialData={bundle} />;
}
