import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { boardQueryOptions, useBoard } from "@/hooks/use-board";
import { useUpdateBoard } from "@/hooks/use-boards";
import type { Priority } from "@shared/types";
import { PRIORITY_RANK } from "@shared/types";
import type { BoardFilters, DueFilter } from "@/lib/card-filters";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { KanbanBoard } from "@/components/board/kanban-board";
import { TableView } from "@/components/board/table-view";
import { CalendarView } from "@/components/board/calendar-view";
import { CardDialog } from "@/components/board/card-dialog";
import { BoardLabelsMenu } from "@/components/board/board-labels-menu";
import { BoardMembersDialog } from "@/components/board/board-members-dialog";
import { BoardFilterBar } from "@/components/board/board-filter-bar";
import { ActivityDialog } from "@/components/board/activity-dialog";

type ViewMode = "board" | "table" | "calendar";
interface BoardSearch extends BoardFilters {
  view?: ViewMode;
}

const DUE_VALUES: DueFilter[] = ["overdue", "today", "week"];
const VIEWS: [ViewMode, string][] = [
  ["board", "Board"],
  ["table", "Table"],
  ["calendar", "Calendar"],
];

export const Route = createFileRoute("/_authed/boards/$boardId")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(boardQueryOptions(params.boardId)),
  validateSearch: (search: Record<string, unknown>): BoardSearch => {
    const due = search.due as DueFilter;
    const priority = search.priority as Priority;
    const view = search.view as ViewMode;
    return {
      q: typeof search.q === "string" && search.q ? search.q : undefined,
      label: typeof search.label === "string" && search.label ? search.label : undefined,
      due: DUE_VALUES.includes(due) ? due : undefined,
      assignee:
        typeof search.assignee === "string" && search.assignee ? search.assignee : undefined,
      priority: priority && priority !== "none" && priority in PRIORITY_RANK ? priority : undefined,
      view: view === "table" || view === "calendar" ? view : "board",
    };
  },
  component: BoardPage,
});

function BoardPage() {
  const { boardId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: board, isError } = useBoard(boardId);
  const updateBoard = useUpdateBoard();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [openCardId, setOpenCardId] = useState<string | null>(null);

  if (isError) {
    return (
      <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-3 text-center">
        <h2 className="text-lg font-medium">Board not found</h2>
        <p className="text-muted-foreground text-sm">
          It may have been deleted, or you don&apos;t have access.
        </p>
        <Button asChild variant="outline">
          <Link to="/boards">
            <ArrowLeft className="size-4" /> Back to boards
          </Link>
        </Button>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="flex flex-1 gap-4 p-4 sm:p-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-96 w-72 shrink-0 rounded-xl" />
        ))}
      </div>
    );
  }

  function commitTitle() {
    setEditingTitle(false);
    const next = titleDraft.trim();
    if (next && next !== board!.title) {
      updateBoard.mutate({ boardId: board!.id, data: { title: next } });
    }
  }

  const view = search.view ?? "board";

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-3 px-4 py-4 sm:px-6">
        <Button asChild variant="ghost" size="icon" className="size-8">
          <Link to="/boards" aria-label="Back to boards">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: board.color }} />
        {editingTitle ? (
          <Input
            autoFocus
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitTitle();
              if (e.key === "Escape") setEditingTitle(false);
            }}
            className="h-8 max-w-xs text-lg font-semibold"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setTitleDraft(board.title);
              setEditingTitle(true);
            }}
            className="text-lg font-semibold tracking-tight"
          >
            {board.title}
          </button>
        )}
        <div className="flex-1" />
        <ActivityDialog boardId={board.id} />
        <BoardLabelsMenu boardId={board.id} labels={board.labels} />
        <BoardMembersDialog boardId={board.id} members={board.members} role={board.role} />
      </div>

      <div className="flex flex-wrap items-center gap-3 px-4 pb-4 sm:px-6">
        <div className="bg-muted inline-flex rounded-lg p-0.5">
          {VIEWS.map(([v, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => navigate({ search: (prev) => ({ ...prev, view: v }) })}
              className={cn(
                "rounded-md px-3 py-1 text-sm transition",
                view === v ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <BoardFilterBar
          filters={search}
          labels={board.labels}
          members={board.members}
          onChange={(patch) => navigate({ search: (prev) => ({ ...prev, ...patch }) })}
          onClear={() => navigate({ search: { view } })}
        />
      </div>

      {view === "table" ? (
        <TableView board={board} filters={search} onOpenCard={setOpenCardId} />
      ) : view === "calendar" ? (
        <CalendarView board={board} filters={search} onOpenCard={setOpenCardId} />
      ) : (
        <KanbanBoard board={board} filters={search} onOpenCard={setOpenCardId} />
      )}

      <CardDialog
        boardId={board.id}
        cardId={openCardId}
        labels={board.labels}
        members={board.members}
        open={!!openCardId}
        onOpenChange={(open) => !open && setOpenCardId(null)}
      />
    </div>
  );
}
