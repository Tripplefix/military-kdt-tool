import { withHandler } from "@/server/http/handler";
import { weekAdminService } from "@/server/services/weekAdminService";
import { weekCreateSchema } from "@/shared/schemas";

export const POST = withHandler(weekCreateSchema.omit({ wkId: true }), ({ ctx, params, body }) =>
  weekAdminService.create(ctx, { ...body, wkId: params.wkId }),
);
