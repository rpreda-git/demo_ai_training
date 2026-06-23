import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format, isPast, isToday } from "date-fns";
import { CalendarClock, CheckCircle2, CheckSquare, MessageSquare } from "lucide-react";
import type { CardDTO } from "@shared/types";
import { cn } from "@/lib/utils";
import { LabelPill } from "@/components/board/label-pill";
import { MemberAvatar } from "@/components/board/member-avatar";

export function KanbanCardView({
  card,
  onToggleComplete,
  dragging,
}: {
  card: CardDTO;
  onToggleComplete?: (next: boolean) => void;
  dragging?: boolean;
}) {
  const due = card.dueDate ? new Date(card.dueDate) : null;
  const overdue = due && !card.completed && isPast(due) && !isToday(due);

  return (
    <div
      className={cn(
        "bg-card flex flex-col gap-2 rounded-lg border p-3 text-sm shadow-sm",
        dragging && "rotate-2 shadow-lg",
        card.completed && "opacity-70",
      )}
    >
      {card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {card.labels.map((label) => (
            <LabelPill key={label.id} label={label} />
          ))}
        </div>
      )}

      <div className="flex items-start gap-2">
        <button
          type="button"
          aria-label={card.completed ? "Mark incomplete" : "Mark complete"}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete?.(!card.completed);
          }}
          className="mt-0.5 shrink-0"
        >
          <CheckCircle2
            className={cn(
              "size-4 transition",
              card.completed ? "text-green-500" : "text-muted-foreground/40 hover:text-muted-foreground",
            )}
          />
        </button>
        <span className={cn("flex-1 leading-snug", card.completed && "line-through")}>
          {card.title}
        </span>
      </div>

      {(due || card.commentCount > 0 || card.checklistTotal > 0 || card.assignee) && (
        <div className="text-muted-foreground flex items-center gap-3 text-xs">
          {due && (
            <span
              className={cn(
                "flex items-center gap-1",
                overdue && "text-destructive font-medium",
              )}
            >
              <CalendarClock className="size-3.5" />
              {format(due, "MMM d")}
            </span>
          )}
          {card.checklistTotal > 0 && (
            <span
              className={cn(
                "flex items-center gap-1",
                card.checklistDone === card.checklistTotal && "text-green-500",
              )}
            >
              <CheckSquare className="size-3.5" />
              {card.checklistDone}/{card.checklistTotal}
            </span>
          )}
          {card.commentCount > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare className="size-3.5" />
              {card.commentCount}
            </span>
          )}
          {card.assignee && <MemberAvatar user={card.assignee} className="ml-auto size-6" />}
        </div>
      )}
    </div>
  );
}

export function KanbanCard({
  card,
  onOpen,
  onToggleComplete,
}: {
  card: CardDTO;
  onOpen: (cardId: string) => void;
  onToggleComplete: (next: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: "card", columnId: card.columnId },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(card.id)}
      className={cn("cursor-grab touch-none active:cursor-grabbing", isDragging && "opacity-40")}
    >
      <KanbanCardView card={card} onToggleComplete={onToggleComplete} />
    </div>
  );
}
