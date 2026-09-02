import { withHandler } from "@/server/http/handler";
import { weekService } from "@/server/services/blockService";
import { dayPatchSchema } from "@/shared/schemas";

export const PATCH = withHandler(dayPatchSchema, ({ ctx, params, body }) => weekService.updateDay(ctx, params.dayId, body));
