import { useMemo, useState } from "react";
import { format, isPast, isToday } from "date-fns";
import { ArrowDown, ArrowUp, CheckCircle2 } from "lucide-react";
import type { BoardDetailDTO, CardDTO } from "@shared/types";
import { PRIORITY_META, PRIORITY_RANK } from "@shared/types";
import { useSession } from "@/lib/auth-client";
import { matchesFilters, type BoardFilters } from "@/lib/card-filters";
import { cn } from "@/lib/utils";
import { LabelPill } from "@/components/board/label-pill";
import { MemberAvatar } from "@/components/board/member-avatar";

type SortKey = "title" | "due" | "priority" | "column";

export function TableView({
  board,
  filters,
  onOpenCard,
}: {
  board: BoardDetailDTO;
  filters: BoardFilters;
  onOpenCard: (cardId: string) => void;
}) {
  const { data: session } = useSession();
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "priority", dir: -1 });

  const columnTitle = useMemo(
    () => new Map(board.columns.map((c) => [c.id, c.title])),
    [board.columns],
  );

  const rows = useMemo(() => {
    const all = board.columns.flatMap((col) => col.cards);
    const filtered = all.filter((c) => matchesFilters(c, filters, session?.user?.id));
    const cmp = (a: CardDTO, b: CardDTO) => {
      switch (sort.key) {
        case "title":
          return a.title.localeCompare(b.title);
        case "priority":
          return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
        case "column":
          return (columnTitle.get(a.columnId) ?? "").localeCompare(columnTitle.get(b.columnId) ?? "");
        case "due": {
          const av = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const bv = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          return av - bv;
        }
      }
    };
    return filtered.sort((a, b) => cmp(a, b) * sort.dir);
  }, [board.columns, filters, session?.user?.id, sort, columnTitle]);

  function toggleSort(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: 1 }));
  }

  const Header = ({ k, label, className }: { k: SortKey; label: string; className?: string }) => (
    <th className={cn("px-3 py-2 text-left font-medium", className)}>
      <button
        type="button"
        onClick={() => toggleSort(k)}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
      >
        {label}
        {sort.key === k &&
          (sort.dir === 1 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />)}
      </button>
    </th>
  );

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 pb-8 sm:px-6">
      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <Header k="title" label="Title" />
              <Header k="column" label="List" className="hidden sm:table-cell" />
              <th className="px-3 py-2 text-left font-medium">Assignee</th>
              <Header k="due" label="Due" />
              <Header k="priority" label="Priority" />
              <th className="hidden px-3 py-2 text-left font-medium md:table-cell">Labels</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((card) => {
              const due = card.dueDate ? new Date(card.dueDate) : null;
              const overdue = due && !card.completed && isPast(due) && !isToday(due);
              return (
                <tr
                  key={card.id}
                  onClick={() => onOpenCard(card.id)}
                  className="hover:bg-muted/40 cursor-pointer border-b last:border-0"
                >
                  <td className="px-3 py-2">
                    <span className="flex items-center gap-2">
                      {card.completed && <CheckCircle2 className="size-3.5 text-green-500" />}
                      <span className={cn(card.completed && "text-muted-foreground line-through")}>
                        {card.title}
                      </span>
                    </span>
                  </td>
                  <td className="text-muted-foreground hidden px-3 py-2 sm:table-cell">
                    {columnTitle.get(card.columnId)}
                  </td>
                  <td className="px-3 py-2">
                    {card.assignee ? (
                      <span className="flex items-center gap-2">
                        <MemberAvatar user={card.assignee} className="size-5" />
                        <span className="hidden lg:inline">{card.assignee.name}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className={cn("px-3 py-2", overdue && "text-destructive font-medium")}>
                    {due ? format(due, "MMM d") : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-3 py-2">
                    {card.priority === "none" ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <span
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: PRIORITY_META[card.priority].color }}
                        />
                        {PRIORITY_META[card.priority].label}
                      </span>
                    )}
                  </td>
                  <td className="hidden px-3 py-2 md:table-cell">
                    <span className="flex flex-wrap gap-1">
                      {card.labels.map((l) => (
                        <LabelPill key={l.id} label={l} />
                      ))}
                    </span>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="text-muted-foreground px-3 py-10 text-center">
                  No cards match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
