import { withHandler } from "@/server/http/handler";
import { tagesbefehlService } from "@/server/services/tagesbefehlService";
import { tagesbefehlPatchSchema } from "@/shared/schemas";

export const GET = withHandler(null, ({ ctx, params }) => tagesbefehlService.bundle(ctx, params.dayId));
export const PATCH = withHandler(tagesbefehlPatchSchema, ({ ctx, params, body }) => tagesbefehlService.patch(ctx, params.dayId, body));
