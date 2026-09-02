import { withHandler } from "@/server/http/handler";
import { footnoteService } from "@/server/services/blockService";
import { footnoteInputSchema } from "@/shared/schemas";

export const POST = withHandler(footnoteInputSchema, ({ ctx, body }) => footnoteService.create(ctx, body));
