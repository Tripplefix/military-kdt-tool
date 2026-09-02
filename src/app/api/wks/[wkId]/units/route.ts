import { withHandler } from "@/server/http/handler";
import { unitService } from "@/server/services/masterDataService";
import { unitInputSchema } from "@/shared/schemas";

export const POST = withHandler(unitInputSchema, ({ ctx, params, body }) => unitService.create(ctx, params.wkId, body));
