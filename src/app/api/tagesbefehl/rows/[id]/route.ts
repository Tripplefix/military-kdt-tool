import { withHandler } from "@/server/http/handler";
import { tagesbefehlService } from "@/server/services/tagesbefehlService";
import { tagesbefehlRowPatchSchema } from "@/shared/schemas";

export const PATCH = withHandler(tagesbefehlRowPatchSchema, ({ ctx, params, body }) => tagesbefehlService.patchRow(ctx, params.id, body));
export const DELETE = withHandler(null, ({ ctx, params }) => tagesbefehlService.deleteRow(ctx, params.id) ?? undefined);
