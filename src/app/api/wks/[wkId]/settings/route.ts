import { withHandler } from "@/server/http/handler";
import { wkService } from "@/server/services/wkService";
import { settingsPatchSchema } from "@/shared/schemas";

export const PATCH = withHandler(settingsPatchSchema, ({ ctx, params, body }) => wkService.updateSettings(ctx, params.wkId, body));
