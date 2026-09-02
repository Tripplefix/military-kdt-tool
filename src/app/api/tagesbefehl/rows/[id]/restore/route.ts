import { withHandler } from "@/server/http/handler";
import { tagesbefehlService } from "@/server/services/tagesbefehlService";

export const POST = withHandler(null, ({ ctx, params }) => tagesbefehlService.restoreRow(ctx, params.id));
