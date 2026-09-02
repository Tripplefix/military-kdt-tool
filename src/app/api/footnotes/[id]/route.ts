import { withHandler } from "@/server/http/handler";
import { footnoteService } from "@/server/services/blockService";
import { footnotePatchSchema } from "@/shared/schemas";

export const PATCH = withHandler(footnotePatchSchema, ({ ctx, params, body }) => footnoteService.update(ctx, params.id, body));
export const DELETE = withHandler(null, ({ ctx, params }) => footnoteService.remove(ctx, params.id));
