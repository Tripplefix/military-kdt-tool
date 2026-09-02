import { withHandler } from "@/server/http/handler";
import { wkService } from "@/server/services/wkService";
import { wkPatchSchema } from "@/shared/schemas";

export const GET = withHandler(null, ({ ctx, params }) => wkService.bundle(ctx, params.wkId));
export const PATCH = withHandler(wkPatchSchema, ({ ctx, params, body }) => wkService.update(ctx, params.wkId, body));
export const DELETE = withHandler(null, ({ ctx, params }) => wkService.remove(ctx, params.wkId));
