import { z } from "zod";
import { withHandler } from "@/server/http/handler";
import { weekAdminService } from "@/server/services/weekAdminService";

const schema = z.object({ targetWeekId: z.string().min(1), overwrite: z.boolean().default(false) });

export const POST = withHandler(schema, ({ ctx, params, body }) => weekAdminService.copy(ctx, params.weekId, body.targetWeekId, body.overwrite));
