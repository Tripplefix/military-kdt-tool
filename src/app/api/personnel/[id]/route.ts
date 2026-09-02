import { withHandler } from "@/server/http/handler";
import { personnelService } from "@/server/services/masterDataService";
import { personnelPatchSchema } from "@/shared/schemas";

export const PATCH = withHandler(personnelPatchSchema, ({ ctx, params, body }) => personnelService.update(ctx, params.id, body));
export const DELETE = withHandler(null, ({ ctx, params }) => personnelService.remove(ctx, params.id));
