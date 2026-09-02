import { withHandler } from "@/server/http/handler";
import { blockService } from "@/server/services/blockService";

export const POST = withHandler(null, ({ ctx, params }) => blockService.duplicate(ctx, params.id));
