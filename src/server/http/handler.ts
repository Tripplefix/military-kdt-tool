import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { getRequestContext, type RequestContext } from "@/server/auth/context";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const notFound = (what = "Nicht gefunden") => new HttpError(404, what);
export const badRequest = (msg: string, details?: unknown) => new HttpError(400, msg, details);
export const conflict = (msg: string) => new HttpError(409, msg);

type Params = Record<string, string>;

interface HandlerArgs<TBody> {
  ctx: RequestContext;
  body: TBody;
  params: Params;
  req: Request;
  url: URL;
}

/**
 * Wrapper für Route Handler: parst Body (optional mit zod), löst Params auf,
 * erzeugt den Request-Kontext und übersetzt Fehler in JSON-Antworten.
 */
export function withHandler<TBody = undefined>(
  schema: ZodType<TBody> | null,
  fn: (args: HandlerArgs<TBody>) => Promise<unknown> | unknown,
) {
  return async (req: Request, routeCtx?: { params: Promise<Params> | Params }) => {
    try {
      const params = routeCtx ? await routeCtx.params : {};
      let body = undefined as TBody;
      if (schema) {
        const raw = await req.json().catch(() => ({}));
        body = schema.parse(raw);
      }
      const ctx = getRequestContext(req);
      const result = await fn({ ctx, body, params, req, url: new URL(req.url) });
      if (result instanceof Response) return result;
      if (result === undefined || result === null) return new NextResponse(null, { status: 204 });
      return NextResponse.json(result);
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json({ error: "Ungültige Eingabe", issues: err.issues }, { status: 400 });
      }
      if (err instanceof HttpError) {
        return NextResponse.json({ error: err.message, details: err.details }, { status: err.status });
      }
      console.error(err);
      const message = err instanceof Error ? err.message : "Unbekannter Fehler";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  };
}
