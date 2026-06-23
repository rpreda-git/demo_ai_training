import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { CalendarClock, Check, Loader2, Send, Tag, Trash2 } from "lucide-react";
import type { CardDetailDTO, LabelDTO } from "@shared/types";
import { useSession } from "@/lib/auth-client";
import { useBoardActions } from "@/hooks/use-board";
import { useCard, useCardActions } from "@/hooks/use-card";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { LabelPill } from "@/components/board/label-pill";

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function toDateInput(iso: string | null) {
  return iso ? new Date(iso).toISOString().slice(0, 10) : "";
}

export function CardDialog({
  boardId,
  cardId,
  labels,
  open,
  onOpenChange,
}: {
  boardId: string;
  cardId: string | null;
  labels: LabelDTO[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] gap-0 overflow-y-auto p-0 sm:max-w-2xl">
        {cardId ? (
          <CardDialogContent
            key={cardId}
            boardId={boardId}
            cardId={cardId}
            boardLabels={labels}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function CardDialogContent({
  boardId,
  cardId,
  boardLabels,
  onClose,
}: {
  boardId: string;
  cardId: string;
  boardLabels: LabelDTO[];
  onClose: () => void;
}) {
  const { data: card, isLoading } = useCard(cardId);

  if (isLoading || !card) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <CardBody
      boardId={boardId}
      card={card}
      boardLabels={boardLabels}
      onClose={onClose}
    />
  );
}

function CardBody({
  boardId,
  card,
  boardLabels,
  onClose,
}: {
  boardId: string;
  card: CardDetailDTO;
  boardLabels: LabelDTO[];
  onClose: () => void;
}) {
  const { data: session } = useSession();
  const { updateCard, deleteCard } = useBoardActions(boardId);
  const { addComment, deleteComment, toggleLabel } = useCardActions(boardId, card.id);

  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description ?? "");
  const [completed, setCompleted] = useState(card.completed);
  const [comment, setComment] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const attachedIds = new Set(card.labels.map((l) => l.id));

  function saveTitle() {
    const next = title.trim();
    if (next && next !== card.title) updateCard.mutate({ cardId: card.id, data: { title: next } });
    else if (!next) setTitle(card.title);
  }

  function saveDescription() {
    const next = description.trim() || null;
    if (next !== (card.description ?? null)) {
      updateCard.mutate({ cardId: card.id, data: { description: next } });
    }
  }

  function toggleCompleted() {
    const next = !completed;
    setCompleted(next);
    updateCard.mutate({ cardId: card.id, data: { completed: next } });
  }

  function setDueDate(value: string) {
    updateCard.mutate({
      cardId: card.id,
      data: { dueDate: value ? new Date(value).toISOString() : null },
    });
  }

  function submitComment() {
    const body = comment.trim();
    if (!body) return;
    addComment.mutate(body, { onSuccess: () => setComment("") });
  }

  return (
    <>
      <DialogHeader className="space-y-0 border-b p-6 pb-4">
        <div className="flex items-start gap-3">
          <button type="button" onClick={toggleCompleted} aria-label="Toggle complete" className="mt-1">
            <span
              className={cn(
                "flex size-5 items-center justify-center rounded-full border transition",
                completed ? "border-green-500 bg-green-500 text-white" : "border-muted-foreground/40",
              )}
            >
              {completed && <Check className="size-3.5" />}
            </span>
          </button>
          <DialogTitle className="sr-only">Card details</DialogTitle>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            className="h-auto border-0 px-0 text-lg font-semibold shadow-none focus-visible:ring-0 md:text-xl"
          />
        </div>
        <DialogDescription className="sr-only">Edit card details, labels and comments.</DialogDescription>
      </DialogHeader>

      <div className="grid gap-6 p-6 md:grid-cols-[1fr_220px]">
        <div className="space-y-6">
          <section className="space-y-2">
            <h4 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Description
            </h4>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={saveDescription}
              placeholder="Add a more detailed description…"
              rows={4}
            />
          </section>

          <section className="space-y-3">
            <h4 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Comments
            </h4>

            <div className="flex gap-2">
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitComment();
                }}
                placeholder="Write a comment… (⌘/Ctrl+Enter to send)"
                rows={2}
              />
              <Button
                size="icon"
                onClick={submitComment}
                disabled={!comment.trim() || addComment.isPending}
                aria-label="Add comment"
              >
                {addComment.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
              </Button>
            </div>

            <ul className="space-y-3">
              {card.comments.map((c) => (
                <li key={c.id} className="flex gap-3">
                  <Avatar className="size-7">
                    <AvatarFallback className="text-xs">{initials(c.author.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{c.author.name}</span>
                      <span className="text-muted-foreground text-xs">
                        {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                      </span>
                      {session?.user?.id === c.author.id && (
                        <button
                          type="button"
                          onClick={() => deleteComment.mutate(c.id)}
                          className="text-muted-foreground hover:text-destructive ml-auto"
                          aria-label="Delete comment"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{c.body}</p>
                  </div>
                </li>
              ))}
              {card.comments.length === 0 && (
                <li className="text-muted-foreground text-sm">No comments yet.</li>
              )}
            </ul>
          </section>
        </div>

        <aside className="space-y-5">
          <div className="space-y-2">
            <h4 className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
              <Tag className="size-3.5" /> Labels
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {boardLabels.map((label) => {
                const attached = attachedIds.has(label.id);
                return (
                  <LabelPill
                    key={label.id}
                    label={label}
                    className={cn(!attached && "opacity-40 grayscale")}
                    onClick={() => toggleLabel.mutate({ labelId: label.id, attached })}
                  />
                );
              })}
              {boardLabels.length === 0 && (
                <span className="text-muted-foreground text-xs">No labels on this board.</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
              <CalendarClock className="size-3.5" /> Due date
            </h4>
            <Input
              type="date"
              defaultValue={toDateInput(card.dueDate)}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <Separator />

          <Button
            variant="outline"
            className="text-destructive hover:text-destructive w-full justify-start"
            onClick={() => setConfirmingDelete(true)}
          >
            <Trash2 className="size-4" /> Delete card
          </Button>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        title="Delete this card?"
        description="This action cannot be undone."
        confirmLabel="Delete card"
        destructive
        onConfirm={() => {
          deleteCard.mutate(card.id);
          onClose();
        }}
      />
    </>
  );
}
