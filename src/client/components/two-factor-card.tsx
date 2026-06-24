import { useState } from "react";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
import { authClient, useSession } from "@/lib/auth-client";
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

export function TwoFactorCard() {
  const { data: session } = useSession();
  const enabled = Boolean(session?.user?.twoFactorEnabled);

  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [setup, setSetup] = useState<{ totpURI: string; backupCodes: string[] } | null>(null);
  const [code, setCode] = useState("");

  async function enable(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await authClient.twoFactor.enable({ password });
    setBusy(false);
    setPassword("");
    if (error || !data) {
      toast.error(error?.message ?? "Could not start 2FA setup");
      return;
    }
    setSetup({ totpURI: data.totpURI, backupCodes: data.backupCodes });
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await authClient.twoFactor.verifyTotp({ code });
    setBusy(false);
    setCode("");
    if (error) {
      toast.error(error.message ?? "Invalid code");
      return;
    }
    setSetup(null);
    toast.success("Two-factor authentication enabled");
  }

  async function disable(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await authClient.twoFactor.disable({ password });
    setBusy(false);
    setPassword("");
    if (error) {
      toast.error(error.message ?? "Could not disable 2FA");
      return;
    }
    toast.success("Two-factor authentication disabled");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="size-5" /> Two-factor authentication
          {enabled && (
            <span className="rounded bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
              On
            </span>
          )}
        </CardTitle>
        <CardDescription>
          Add a time-based one-time code (TOTP) from an authenticator app.
        </CardDescription>
      </CardHeader>

      {enabled ? (
        <form onSubmit={disable} id="2fa-disable">
          <CardContent className="space-y-2">
            <Label htmlFor="disable-pw">Confirm password to disable</Label>
            <Input
              id="disable-pw"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </CardContent>
          <CardFooter className="mt-4">
            <Button type="submit" form="2fa-disable" variant="destructive" disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin" />}
              Disable 2FA
            </Button>
          </CardFooter>
        </form>
      ) : setup ? (
        <CardContent className="space-y-4">
          <p className="text-sm">
            Scan this QR code with your authenticator app, then enter the 6-digit code to confirm.
          </p>
          <div className="w-fit rounded-lg bg-white p-3">
            <QRCode value={setup.totpURI} size={160} />
          </div>
          <div className="space-y-1">
            <Label>Backup codes (store these somewhere safe)</Label>
            <div className="bg-muted grid grid-cols-2 gap-1 rounded-md p-3 font-mono text-xs">
              {setup.backupCodes.map((c) => (
                <span key={c}>{c}</span>
              ))}
            </div>
          </div>
          <form onSubmit={verify} className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              <Label htmlFor="totp">Verification code</Label>
              <Input
                id="totp"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
              />
            </div>
            <Button type="submit" disabled={busy || code.length < 6}>
              {busy && <Loader2 className="size-4 animate-spin" />}
              Verify &amp; activate
            </Button>
          </form>
        </CardContent>
      ) : (
        <form onSubmit={enable} id="2fa-enable">
          <CardContent className="space-y-2">
            <Label htmlFor="enable-pw">Confirm password to begin</Label>
            <Input
              id="enable-pw"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </CardContent>
          <CardFooter className="mt-4">
            <Button type="submit" form="2fa-enable" disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin" />}
              Enable 2FA
            </Button>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}
