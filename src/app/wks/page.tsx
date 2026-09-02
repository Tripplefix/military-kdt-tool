import { getRequestContext } from "@/server/auth/context";
import { wkService } from "@/server/services/wkService";
import { WkListPage } from "@/client/components/settings/WkListPage";

export const dynamic = "force-dynamic";

export default function WksPage() {
  const wks = wkService.list(getRequestContext());
  return <WkListPage initialWks={wks} />;
}
