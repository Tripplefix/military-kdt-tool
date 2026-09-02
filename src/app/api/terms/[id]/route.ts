import { withHandler } from "@/server/http/handler";
import { termService } from "@/server/services/masterDataService";
import { termPatchSchema } from "@/shared/schemas";

export const PATCH = withHandler(termPatchSchema, ({ ctx, params, body }) => termService.update(ctx, params.id, body));
export const DELETE = withHandler(null, ({ ctx, params }) => termService.remove(ctx, params.id));
