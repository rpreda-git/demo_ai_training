import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { createAuth, type AuthUser } from "../auth";
import { getDb } from "../db";
import type { AppEnv } from "./context";

/** Attaches a Drizzle instance to the request context. */
export const withDb = createMiddleware<AppEnv>(async (c, next) => {
  c.set("db", getDb(c.env));
  await next();
});

/** Resolves the current Better Auth session (if any) onto the context. */
export const withSession = createMiddleware<AppEnv>(async (c, next) => {
  const auth = createAuth(c.env);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  c.set("user", session?.user ?? null);
  await next();
});

/** Guards a route, throwing 401 when there is no authenticated user. */
export const requireAuth = createMiddleware<AppEnv & { Variables: { user: AuthUser } }>(
  async (c, next) => {
    if (!c.get("user")) {
      throw new HTTPException(401, { message: "Authentication required" });
    }
    await next();
  },
);
