import type { RequestContext } from "./context";

/** Berechtigungsprüfungen. Lokal immer erlaubt; Hooks sind bereits an allen Mutationen. */
export function assertCanViewWk(_ctx: RequestContext, _wkId: string): void {}
export function assertCanEditWk(_ctx: RequestContext, _wkId: string): void {}
export function assertCanApprove(_ctx: RequestContext, _wkId: string): void {}
