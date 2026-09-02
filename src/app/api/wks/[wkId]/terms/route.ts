import { withHandler } from "@/server/http/handler";
import { termService } from "@/server/services/masterDataService";
import { termInputSchema } from "@/shared/schemas";

export const POST = withHandler(termInputSchema, ({ ctx, params, body }) => termService.create(ctx, params.wkId, body));
