import { createFileRoute } from "@tanstack/react-router";
import { LayoutDashboard } from "lucide-react";
import { useBoards } from "@/hooks/use-boards";
import { BoardTile } from "@/components/board/board-tile";
import { CreateBoardDialog } from "@/components/board/create-board-dialog";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authed/boards/")({
  component: BoardsPage,
});

function BoardsPage() {
  const { data: boards, isLoading } = useBoards();

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your boards</h1>
          <p className="text-muted-foreground text-sm">
            Organize work into boards, columns and cards.
          </p>
        </div>
        <CreateBoardDialog />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : boards && boards.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => (
            <BoardTile key={board.id} board={board} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
          <div className="bg-muted text-muted-foreground mb-4 flex size-12 items-center justify-center rounded-full">
            <LayoutDashboard className="size-6" />
          </div>
          <h2 className="text-lg font-medium">No boards yet</h2>
          <p className="text-muted-foreground mt-1 mb-4 max-w-sm text-sm">
            Create your first board to start organizing tasks into columns.
          </p>
          <CreateBoardDialog />
        </div>
      )}
    </div>
  );
}
