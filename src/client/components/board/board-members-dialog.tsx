import { useState } from "react";
import { UserPlus, Users, X } from "lucide-react";
import type { BoardRole, MemberDTO } from "@shared/types";
import { useBoardActions } from "@/hooks/use-board";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MemberAvatar } from "@/components/board/member-avatar";

export function BoardMembersDialog({
  boardId,
  members,
  role,
}: {
  boardId: string;
  members: MemberDTO[];
  role: BoardRole;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const { addMember, removeMember } = useBoardActions(boardId);
  const isOwner = role === "owner";

  function invite(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!value) return;
    addMember.mutate(value, { onSuccess: () => setEmail("") });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="size-4" /> Share
          <Badge variant="secondary" className="ml-1">
            {members.length}
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share board</DialogTitle>
          <DialogDescription>
            {isOwner
              ? "Invite people by the email they signed up with."
              : "People with access to this board."}
          </DialogDescription>
        </DialogHeader>

        {isOwner && (
          <form onSubmit={invite} className="flex gap-2">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@example.com"
            />
            <Button type="submit" disabled={!email.trim() || addMember.isPending}>
              <UserPlus className="size-4" /> Add
            </Button>
          </form>
        )}

        <ul className="space-y-1">
          {members.map((m) => (
            <li key={m.userId} className="flex items-center gap-3 rounded-md px-1 py-1.5">
              <MemberAvatar user={m} className="size-8" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{m.name}</div>
                <div className="text-muted-foreground truncate text-xs">{m.email}</div>
              </div>
              <Badge variant={m.role === "owner" ? "default" : "secondary"}>{m.role}</Badge>
              {isOwner && m.role !== "owner" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  aria-label={`Remove ${m.name}`}
                  onClick={() => removeMember.mutate(m.userId)}
                >
                  <X className="size-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
