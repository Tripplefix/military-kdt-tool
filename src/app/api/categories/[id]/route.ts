import { withHandler } from "@/server/http/handler";
import { categoryService } from "@/server/services/masterDataService";
import { categoryPatchSchema } from "@/shared/schemas";

export const PATCH = withHandler(categoryPatchSchema, ({ ctx, params, body }) => categoryService.update(ctx, params.id, body));
export const DELETE = withHandler(null, ({ ctx, params }) => categoryService.remove(ctx, params.id));
