import type { DB } from "../db";
import type { AuthUser } from "../auth";

export type AppEnv = {
  Bindings: Env;
  Variables: {
    db: DB;
    user: AuthUser | null;
  };
};
