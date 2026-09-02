import { redirect } from "next/navigation";

export default async function WkIndex({ params }: { params: Promise<{ wkId: string }> }) {
  const { wkId } = await params;
  redirect(`/wk/${wkId}/week/0`);
}
