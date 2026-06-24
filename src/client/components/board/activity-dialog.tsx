import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { History } from "lucide-react";
import type { ActivityDTO } from "@shared/types";
import { useActivity } from "@/hooks/use-board";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MemberAvatar } from "@/components/board/member-avatar";

function describe(a: ActivityDTO) {
  const title = <span className="font-medium">{a.data.cardTitle}</span>;
  switch (a.type) {
    case "card.created":
      return (
        <>
          added {title} to {a.data.column}
        </>
      );
    case "card.moved":
      return (
        <>
          moved {title} to {a.data.toColumn}
        </>
      );
    case "card.assigned":
      return (
        <>
          assigned {title} to {a.data.assignee}
        </>
      );
    case "card.completed":
      return <>completed {title}</>;
    case "comment.added":
      return <>commented on {title}</>;
    default:
      return a.type;
  }
}

export function ActivityDialog({ boardId }: { boardId: string }) {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useActivity(boardId, open);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="size-4" /> Activity
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Activity</DialogTitle>
          <DialogDescription>Recent changes on this board.</DialogDescription>
        </DialogHeader>
        <div className="max-h-[60svh] space-y-3 overflow-y-auto pr-1">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
          ) : data && data.length > 0 ? (
            data.map((a) => (
              <div key={a.id} className="flex items-start gap-3 text-sm">
                <MemberAvatar user={a.actor} className="mt-0.5 size-7" />
                <div className="flex-1">
                  <p>
                    <span className="font-medium">{a.actor.name}</span> {describe(a)}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground py-8 text-center text-sm">No activity yet.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
