import { withHandler } from "@/server/http/handler";
import { wkService } from "@/server/services/wkService";
import { wkCreateSchema } from "@/shared/schemas";

export const GET = withHandler(null, ({ ctx }) => wkService.list(ctx));
export const POST = withHandler(wkCreateSchema, ({ ctx, body }) => wkService.create(ctx, body));
