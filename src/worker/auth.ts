import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { twoFactor } from "better-auth/plugins/two-factor";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import * as schema from "./db/schema";

function buildAuth(env: Env) {
  const db = getDb(env);
  return betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    // When unset, Better Auth infers the base URL from the incoming request.
    baseURL: env.BETTER_AUTH_URL || undefined,
    databaseHooks: {
      user: {
        create: {
          // Give every new user a personal organization to land in.
          after: async (createdUser) => {
            const orgId = crypto.randomUUID();
            await db.insert(schema.organization).values({
              id: orgId,
              name: `${createdUser.name || "My"}'s Workspace`,
              ownerId: createdUser.id,
            });
            await db
              .insert(schema.orgMember)
              .values({ organizationId: orgId, userId: createdUser.id, role: "owner" });
            await db
              .update(schema.user)
              .set({ activeOrganizationId: orgId })
              .where(eq(schema.user.id, createdUser.id));
          },
        },
      },
    },
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
        twoFactor: schema.twoFactor,
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
    plugins: [twoFactor({ issuer: "Kanban" })],
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
