import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { BoardDetailDTO } from "@shared/types";
import { PRIORITY_META } from "@shared/types";
import { useSession } from "@/lib/auth-client";
import { matchesFilters, type BoardFilters } from "@/lib/card-filters";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarView({
  board,
  filters,
  onOpenCard,
}: {
  board: BoardDetailDTO;
  filters: BoardFilters;
  onOpenCard: (cardId: string) => void;
}) {
  const { data: session } = useSession();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  const dueCards = useMemo(() => {
    const all = board.columns.flatMap((c) => c.cards);
    return all.filter((c) => c.dueDate && matchesFilters(c, filters, session?.user?.id));
  }, [board.columns, filters, session?.user?.id]);

  const cardsByDay = useMemo(() => {
    const map = new Map<string, typeof dueCards>();
    for (const card of dueCards) {
      const key = format(new Date(card.dueDate!), "yyyy-MM-dd");
      const list = map.get(key) ?? [];
      list.push(card);
      map.set(key, list);
    }
    return map;
  }, [dueCards]);

  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(month)),
        end: endOfWeek(endOfMonth(month)),
      }),
    [month],
  );

  const undated = useMemo(() => {
    const all = board.columns.flatMap((c) => c.cards);
    return all.filter((c) => !c.dueDate && matchesFilters(c, filters, session?.user?.id)).length;
  }, [board.columns, filters, session?.user?.id]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pb-8 sm:px-6">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-lg font-semibold">{format(month, "MMMM yyyy")}</h2>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={() => setMonth(startOfMonth(new Date()))}>
          Today
        </Button>
        <Button variant="ghost" size="icon" className="size-8" onClick={() => setMonth(subMonths(month, 1))}>
          <ChevronLeft className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" className="size-8" onClick={() => setMonth(addMonths(month, 1))}>
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 overflow-hidden rounded-xl border text-sm">
        {WEEKDAYS.map((d) => (
          <div key={d} className="bg-muted/50 text-muted-foreground border-b px-2 py-1.5 text-xs font-medium">
            {d}
          </div>
        ))}
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const cards = cardsByDay.get(key) ?? [];
          return (
            <div
              key={key}
              className={cn(
                "min-h-24 border-b border-r p-1.5 [&:nth-child(7n+1)]:border-l-0",
                !isSameMonth(day, month) && "bg-muted/30 text-muted-foreground",
              )}
            >
              <div
                className={cn(
                  "mb-1 flex size-6 items-center justify-center rounded-full text-xs",
                  isToday(day) && "bg-primary text-primary-foreground font-semibold",
                )}
              >
                {format(day, "d")}
              </div>
              <div className="space-y-1">
                {cards.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => onOpenCard(card.id)}
                    className="bg-card hover:bg-accent flex w-full items-center gap-1 truncate rounded border px-1.5 py-1 text-left text-xs"
                  >
                    {card.priority !== "none" && (
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: PRIORITY_META[card.priority].color }}
                      />
                    )}
                    <span className={cn("truncate", card.completed && "line-through")}>
                      {card.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {undated > 0 && (
        <p className="text-muted-foreground mt-2 text-xs">
          {undated} card{undated === 1 ? "" : "s"} without a due date {undated === 1 ? "is" : "are"}{" "}
          not shown.
        </p>
      )}
    </div>
  );
}
