import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";

// Same-origin: the client talks to /api/auth/* on the current host.
export const authClient = createAuthClient({
  plugins: [twoFactorClient()],
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
