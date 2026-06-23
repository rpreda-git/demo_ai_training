import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { MoreHorizontal, Plus, Trash2, X } from "lucide-react";
import type { ColumnDTO } from "@shared/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { KanbanCard } from "@/components/board/kanban-card";

export function KanbanColumn({
  column,
  onOpenCard,
  onToggleComplete,
  onAddCard,
  onRename,
  onDelete,
}: {
  column: ColumnDTO;
  onOpenCard: (cardId: string) => void;
  onToggleComplete: (cardId: string, next: boolean) => void;
  onAddCard: (title: string) => void;
  onRename: (title: string) => void;
  onDelete: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: "column", columnId: column.id },
  });

  const [renaming, setRenaming] = useState(false);
  const [titleDraft, setTitleDraft] = useState(column.title);
  const [adding, setAdding] = useState(false);
  const [cardDraft, setCardDraft] = useState("");
  const [confirming, setConfirming] = useState(false);

  function commitRename() {
    setRenaming(false);
    const next = titleDraft.trim();
    if (next && next !== column.title) onRename(next);
    else setTitleDraft(column.title);
  }

  function submitCard() {
    const title = cardDraft.trim();
    if (!title) return;
    onAddCard(title);
    setCardDraft("");
  }

  const cardIds = column.cards.map((c) => c.id);

  return (
    <div className="bg-muted/50 flex max-h-full w-72 shrink-0 flex-col rounded-xl border">
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        {renaming ? (
          <Input
            autoFocus
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") {
                setTitleDraft(column.title);
                setRenaming(false);
              }
            }}
            className="h-7"
          />
        ) : (
          <button
            type="button"
            onClick={() => setRenaming(true)}
            className="flex-1 text-left text-sm font-semibold"
          >
            {column.title}
          </button>
        )}
        <span className="bg-background text-muted-foreground rounded-full px-2 py-0.5 text-xs">
          {column.cards.length}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7" aria-label="Column actions">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setRenaming(true)}>Rename</DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={() => setConfirming(true)}>
              <Trash2 className="size-4" /> Delete list
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-2 flex-1 flex-col gap-2 overflow-y-auto px-3 pb-2",
          isOver && "bg-accent/40 rounded-lg",
        )}
      >
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {column.cards.map((card) => (
            <KanbanCard
              key={card.id}
              card={card}
              onOpen={onOpenCard}
              onToggleComplete={(next) => onToggleComplete(card.id, next)}
            />
          ))}
        </SortableContext>
      </div>

      <div className="p-2">
        {adding ? (
          <div className="flex flex-col gap-2">
            <Textarea
              autoFocus
              value={cardDraft}
              onChange={(e) => setCardDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submitCard();
                }
                if (e.key === "Escape") setAdding(false);
              }}
              placeholder="Card title…"
              rows={2}
              className="resize-none bg-background"
            />
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={submitCard} disabled={!cardDraft.trim()}>
                Add card
              </Button>
              <Button size="icon" variant="ghost" className="size-8" onClick={() => setAdding(false)}>
                <X className="size-4" />
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            className="text-muted-foreground w-full justify-start"
            onClick={() => setAdding(true)}
          >
            <Plus className="size-4" /> Add a card
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Delete “${column.title}”?`}
        description={
          column.cards.length > 0
            ? `This list has ${column.cards.length} card(s). They will be deleted too.`
            : undefined
        }
        confirmLabel="Delete list"
        destructive
        onConfirm={onDelete}
      />
    </div>
  );
}
