import { withHandler } from "@/server/http/handler";
import { personnelService } from "@/server/services/masterDataService";
import { personnelInputSchema } from "@/shared/schemas";

export const POST = withHandler(personnelInputSchema, ({ ctx, params, body }) => personnelService.create(ctx, params.wkId, body));
