import { withHandler } from "@/server/http/handler";
import { blockService } from "@/server/services/blockService";
import { blockInputSchema } from "@/shared/schemas";

export const POST = withHandler(blockInputSchema, ({ ctx, body }) => blockService.create(ctx, body));
