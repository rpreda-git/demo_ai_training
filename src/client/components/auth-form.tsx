import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { KanbanSquare, Loader2 } from "lucide-react";
import { authClient, signIn, signUp } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const DEMO_CREDENTIALS = { email: "demo@kanban.dev", password: "demo1234" };

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);
  const [code, setCode] = useState("");

  const isLogin = mode === "login";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = isLogin
        ? await signIn.email({ email, password })
        : await signUp.email({ email, password, name: name || email.split("@")[0] });

      if (result.error) {
        toast.error(result.error.message ?? "Authentication failed");
        return;
      }
      if (isLogin && (result.data as { twoFactorRedirect?: boolean })?.twoFactorRedirect) {
        setTwoFactor(true);
        return;
      }
      toast.success(isLogin ? "Welcome back!" : "Account created");
      await navigate({ to: "/boards" });
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await authClient.twoFactor.verifyTotp({ code });
    setLoading(false);
    setCode("");
    if (error) {
      toast.error(error.message ?? "Invalid code");
      return;
    }
    toast.success("Welcome back!");
    await navigate({ to: "/boards" });
  }

  if (twoFactor) {
    return (
      <div className="bg-muted/30 flex min-h-svh flex-col items-center justify-center gap-6 p-6">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Two-factor authentication</CardTitle>
            <CardDescription>Enter the 6-digit code from your authenticator app.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={verifyCode} id="totp-form" className="grid gap-2">
              <Label htmlFor="totp-code">Code</Label>
              <Input
                id="totp-code"
                inputMode="numeric"
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
              />
            </form>
          </CardContent>
          <CardFooter>
            <Button type="submit" form="totp-form" className="w-full" disabled={loading || code.length < 6}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Verify
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  function fillDemo() {
    setEmail(DEMO_CREDENTIALS.email);
    setPassword(DEMO_CREDENTIALS.password);
  }

  return (
    <div className="bg-muted/30 flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <div className="flex items-center gap-2 text-2xl font-semibold">
        <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg">
          <KanbanSquare className="size-5" />
        </span>
        Kanban
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{isLogin ? "Sign in" : "Create your account"}</CardTitle>
          <CardDescription>
            {isLogin
              ? "Enter your credentials to access your boards."
              : "Sign up with an email and password to get started."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4" id="auth-form">
            {!isLogin && (
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ada Lovelace"
                  autoComplete="name"
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-3">
          <Button
            type="submit"
            form="auth-form"
            className="w-full bg-pink-600 text-white hover:bg-pink-700"
            disabled={loading}
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {isLogin ? "Sign in" : "Create account"}
          </Button>
          {isLogin && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={fillDemo}
              disabled={loading}
            >
              Use demo credentials
            </Button>
          )}
          <p className="text-muted-foreground text-center text-sm">
            {isLogin ? (
              <>
                Don&apos;t have an account?{" "}
                <Link to="/signup" className="text-foreground underline-offset-4 hover:underline">
                  Sign up
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link to="/login" className="text-foreground underline-offset-4 hover:underline">
                  Sign in
                </Link>
              </>
            )}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
