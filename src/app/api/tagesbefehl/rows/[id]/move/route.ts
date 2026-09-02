import { z } from "zod";
import { withHandler } from "@/server/http/handler";
import { tagesbefehlService } from "@/server/services/tagesbefehlService";

export const POST = withHandler(z.object({ dir: z.union([z.literal(-1), z.literal(1)]) }), ({ ctx, params, body }) => tagesbefehlService.moveRow(ctx, params.id, body.dir));
