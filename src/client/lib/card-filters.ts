import { isPast, isThisWeek, isToday } from "date-fns";
import type { CardDTO } from "@shared/types";

export type DueFilter = "overdue" | "today" | "week";

export interface BoardFilters {
  q?: string;
  label?: string;
  due?: DueFilter;
  assignee?: string; // a userId, or "me"
}

export function hasActiveFilters(f: BoardFilters): boolean {
  return Boolean(f.q?.trim() || f.label || f.due || f.assignee);
}

export function matchesFilters(
  card: CardDTO,
  f: BoardFilters,
  currentUserId: string | undefined,
): boolean {
  if (f.q?.trim()) {
    const q = f.q.trim().toLowerCase();
    const haystack = `${card.title} ${card.description ?? ""}`.toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  if (f.label && !card.labels.some((l) => l.id === f.label)) return false;
  if (f.assignee) {
    const wanted = f.assignee === "me" ? currentUserId : f.assignee;
    if (card.assignee?.id !== wanted) return false;
  }
  if (f.due) {
    const due = card.dueDate ? new Date(card.dueDate) : null;
    if (!due) return false;
    if (f.due === "overdue" && !(isPast(due) && !isToday(due) && !card.completed)) return false;
    if (f.due === "today" && !isToday(due)) return false;
    if (f.due === "week" && !isThisWeek(due, { weekStartsOn: 1 })) return false;
  }
  return true;
}
