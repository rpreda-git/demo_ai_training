import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { authClient, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TwoFactorCard } from "@/components/two-factor-card";

export const Route = createFileRoute("/_authed/settings")({
  component: SettingsPage,
});

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function SettingsPage() {
  const { data: session } = useSession();
  const user = session?.user;

  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setImage(user.image ?? "");
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    const { error } = await authClient.updateUser({ name: name.trim(), image: image.trim() || null });
    setSavingProfile(false);
    if (error) toast.error(error.message ?? "Could not update profile");
    else toast.success("Profile updated");
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }
    setSavingPassword(true);
    const { error } = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    });
    setSavingPassword(false);
    if (error) {
      toast.error(error.message ?? "Could not change password");
      return;
    }
    toast.success("Password changed");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="size-8">
          <Link to="/boards" aria-label="Back to boards">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update how you appear across your boards.</CardDescription>
          </CardHeader>
          <form onSubmit={saveProfile} id="profile-form">
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="size-16">
                  {image && <AvatarImage src={image} alt={name} />}
                  <AvatarFallback className="text-lg">
                    {initials(name || user?.email || "?")}
                  </AvatarFallback>
                </Avatar>
                <div className="text-muted-foreground text-sm">{user?.email}</div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="image">Avatar image URL</Label>
                <Input
                  id="image"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://…"
                />
              </div>
            </CardContent>
            <CardFooter className="mt-4">
              <Button type="submit" form="profile-form" disabled={savingProfile}>
                {savingProfile && <Loader2 className="size-4 animate-spin" />}
                Save profile
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>
              Changing your password signs out your other sessions.
            </CardDescription>
          </CardHeader>
          <form onSubmit={changePassword} id="password-form">
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="current">Current password</Label>
                <Input
                  id="current"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new">New password</Label>
                <Input
                  id="new"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm">Confirm new password</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                  autoComplete="new-password"
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="mt-4">
              <Button type="submit" form="password-form" disabled={savingPassword}>
                {savingPassword && <Loader2 className="size-4 animate-spin" />}
                Change password
              </Button>
            </CardFooter>
          </form>
        </Card>

        <TwoFactorCard />
      </div>
    </div>
  );
}
