import { withHandler } from "@/server/http/handler";
import { blockService } from "@/server/services/blockService";
import { blockPatchSchema } from "@/shared/schemas";

export const PATCH = withHandler(blockPatchSchema, ({ ctx, params, body }) => blockService.update(ctx, params.id, body));
export const DELETE = withHandler(null, ({ ctx, params }) => blockService.remove(ctx, params.id));
