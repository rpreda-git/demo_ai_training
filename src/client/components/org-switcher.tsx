import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Building2, Check, ChevronsUpDown, Plus } from "lucide-react";
import { useCreateOrg, useOrgs, useSwitchOrg } from "@/hooks/use-orgs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function OrgSwitcher() {
  const { data: orgs } = useOrgs();
  const switchOrg = useSwitchOrg();
  const createOrg = useCreateOrg();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  const active = orgs?.find((o) => o.isActive);

  function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    createOrg.mutate(name.trim(), {
      onSuccess: () => {
        setName("");
        setCreating(false);
        navigate({ to: "/boards" });
      },
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="max-w-[220px] gap-2">
            <Building2 className="size-4 shrink-0" />
            <span className="truncate">{active?.name ?? "Workspace"}</span>
            <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Organizations</DropdownMenuLabel>
          {orgs?.map((o) => (
            <DropdownMenuItem
              key={o.id}
              onSelect={() => {
                if (!o.isActive) switchOrg.mutate(o.id, { onSuccess: () => navigate({ to: "/boards" }) });
              }}
            >
              <span className="flex-1 truncate">{o.name}</span>
              <span className="text-muted-foreground text-xs">{o.memberCount}</span>
              {o.isActive && <Check className="size-4" />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setCreating(true)}>
            <Plus className="size-4" /> New organization
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New organization</DialogTitle>
          </DialogHeader>
          <form onSubmit={create} id="create-org-form" className="grid gap-2">
            <Label htmlFor="org-name">Name</Label>
            <Input
              id="org-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Inc"
            />
          </form>
          <DialogFooter>
            <Button type="submit" form="create-org-form" disabled={!name.trim() || createOrg.isPending}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
