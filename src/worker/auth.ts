import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "./db";
import * as schema from "./db/schema";

function buildAuth(env: Env) {
  return betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    // When unset, Better Auth infers the base URL from the incoming request.
    baseURL: env.BETTER_AUTH_URL || undefined,
    database: drizzleAdapter(getDb(env), {
      provider: "sqlite",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
      minPasswordLength: 8,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30, // 30 days
      updateAge: 60 * 60 * 24, // refresh once per day
    },
    // Accept the deployed origin without hardcoding the domain.
    trustedOrigins: (request) => (request ? [new URL(request.url).origin] : []),
  });
}

// Cache one Better Auth instance per Worker env (stable within an isolate).
const cache = new WeakMap<Env, ReturnType<typeof buildAuth>>();

export function createAuth(env: Env) {
  let auth = cache.get(env);
  if (!auth) {
    auth = buildAuth(env);
    cache.set(env, auth);
  }
  return auth;
}

export type Auth = ReturnType<typeof createAuth>;
export type AuthUser = Auth["$Infer"]["Session"]["user"];
