import { createFileRoute, redirect } from "@tanstack/react-router";
import { getSession } from "@/lib/auth-client";
import { AuthForm } from "@/components/auth-form";

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    const { data } = await getSession();
    if (data?.session) throw redirect({ to: "/boards" });
  },
  component: () => <AuthForm mode="login" />,
});
