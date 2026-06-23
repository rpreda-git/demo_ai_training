import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { boardQueryOptions, useBoard } from "@/hooks/use-board";
import { useUpdateBoard } from "@/hooks/use-boards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { KanbanBoard } from "@/components/board/kanban-board";
import { BoardLabelsMenu } from "@/components/board/board-labels-menu";

export const Route = createFileRoute("/_authed/boards/$boardId")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(boardQueryOptions(params.boardId)),
  component: BoardPage,
});

function BoardPage() {
  const { boardId } = Route.useParams();
  const { data: board, isError } = useBoard(boardId);
  const updateBoard = useUpdateBoard();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");

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
        <BoardLabelsMenu boardId={board.id} labels={board.labels} />
      </div>

      <KanbanBoard board={board} />
    </div>
  );
}
