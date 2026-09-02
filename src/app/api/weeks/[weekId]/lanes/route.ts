import { withHandler } from "@/server/http/handler";
import { weekService } from "@/server/services/blockService";
import { laneConfigSchema } from "@/shared/schemas";

export const PUT = withHandler(laneConfigSchema, ({ ctx, params, body }) => weekService.configureLanes(ctx, params.weekId, body));
