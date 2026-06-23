import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getSession } from "@/lib/auth-client";
import { AppHeader } from "@/components/app-header";

export const Route = createFileRoute("/_authed")({
  beforeLoad: async () => {
    const { data } = await getSession();
    if (!data?.session) {
      throw redirect({ to: "/login" });
    }
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  return (
    <div className="bg-muted/20 flex min-h-svh flex-col">
      <AppHeader />
      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  );
}
