import { withHandler } from "@/server/http/handler";
import { unitService } from "@/server/services/masterDataService";
import { unitPatchSchema } from "@/shared/schemas";

export const PATCH = withHandler(unitPatchSchema, ({ ctx, params, body }) => unitService.update(ctx, params.id, body));
export const DELETE = withHandler(null, ({ ctx, params }) => unitService.remove(ctx, params.id));
