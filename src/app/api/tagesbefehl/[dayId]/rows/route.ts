import { withHandler } from "@/server/http/handler";
import { tagesbefehlService } from "@/server/services/tagesbefehlService";
import { tagesbefehlRowInputSchema } from "@/shared/schemas";

export const POST = withHandler(tagesbefehlRowInputSchema, ({ ctx, params, body }) => tagesbefehlService.addRow(ctx, params.dayId, body));
