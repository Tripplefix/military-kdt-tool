import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { getRequestContext } from "@/server/auth/context";
import { HttpError } from "@/server/http/handler";
import { wkService } from "@/server/services/wkService";
import { AppNav } from "@/client/components/common/AppNav";

export const dynamic = "force-dynamic";

export default async function WkLayout({ children, params }: { children: ReactNode; params: Promise<{ wkId: string }> }) {
  const { wkId } = await params;
  let bundle;
  try {
    bundle = wkService.bundle(getRequestContext(), wkId);
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) notFound();
    throw e;
  }
  return (
    <div className="flex min-h-screen flex-col">
      <AppNav wk={bundle.wk} weeks={bundle.weeks.map((w) => ({ id: w.id, index: w.index, label: w.label, kind: w.kind }))} />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
