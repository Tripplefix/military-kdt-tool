import { withHandler } from "@/server/http/handler";
import { categoryService } from "@/server/services/masterDataService";
import { categoryInputSchema } from "@/shared/schemas";

export const POST = withHandler(categoryInputSchema, ({ ctx, params, body }) => categoryService.create(ctx, params.wkId, body));
