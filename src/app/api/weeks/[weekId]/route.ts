import { withHandler } from "@/server/http/handler";
import { weekService } from "@/server/services/blockService";
import { weekAdminService } from "@/server/services/weekAdminService";
import { weekPatchSchema } from "@/shared/schemas";

export const GET = withHandler(null, ({ ctx, params }) => weekService.bundle(ctx, params.weekId));
export const PATCH = withHandler(weekPatchSchema, ({ ctx, params, body }) => weekService.update(ctx, params.weekId, body));
export const DELETE = withHandler(null, ({ ctx, params }) => weekAdminService.remove(ctx, params.weekId));
