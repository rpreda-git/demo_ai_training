import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { Columns3, MoreHorizontal, Pencil, SquareStack, Trash2 } from "lucide-react";
import type { BoardSummaryDTO } from "@shared/types";
import { BOARD_COLORS } from "@shared/types";
import { useDeleteBoard, useUpdateBoard } from "@/hooks/use-boards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ColorSwatches } from "@/components/board/label-pill";

export function BoardTile({ board }: { board: BoardSummaryDTO }) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [title, setTitle] = useState(board.title);
  const [description, setDescription] = useState(board.description ?? "");
  const [color, setColor] = useState(board.color);

  const updateBoard = useUpdateBoard();
  const deleteBoard = useDeleteBoard();

  function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    updateBoard.mutate(
      {
        boardId: board.id,
        data: { title: title.trim() || board.title, description: description.trim() || null, color },
      },
      { onSuccess: () => setEditing(false) },
    );
  }

  return (
    <>
      <div className="group bg-card relative flex flex-col overflow-hidden rounded-xl border shadow-sm transition hover:shadow-md">
        <span className="h-1.5 w-full" style={{ backgroundColor: board.color }} />
        <Link
          to="/boards/$boardId"
          params={{ boardId: board.id }}
          className="flex flex-1 flex-col gap-3 p-4"
        >
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 font-semibold">{board.title}</h3>
          </div>
          <p className="text-muted-foreground line-clamp-2 min-h-[2.5rem] text-sm">
            {board.description || "No description"}
          </p>
          <div className="text-muted-foreground mt-auto flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1">
              <Columns3 className="size-3.5" /> {board.columnCount}
            </span>
            <span className="flex items-center gap-1">
              <SquareStack className="size-3.5" /> {board.cardCount}
            </span>
            <span className="ml-auto">
              {formatDistanceToNow(new Date(board.updatedAt), { addSuffix: true })}
            </span>
          </div>
        </Link>

        <div className="absolute top-2.5 right-2.5 opacity-0 transition group-hover:opacity-100">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="size-7"
                aria-label="Board actions"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setEditing(true)}>
                <Pencil className="size-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={() => setConfirming(true)}>
                <Trash2 className="size-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit board</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveEdit} className="grid gap-4" id={`edit-board-${board.id}`}>
            <div className="grid gap-2">
              <Label htmlFor={`title-${board.id}`}>Title</Label>
              <Input
                id={`title-${board.id}`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`desc-${board.id}`}>Description</Label>
              <Textarea
                id={`desc-${board.id}`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label>Color</Label>
              <ColorSwatches colors={BOARD_COLORS} value={color} onChange={setColor} />
            </div>
          </form>
          <DialogFooter>
            <Button type="submit" form={`edit-board-${board.id}`} disabled={updateBoard.isPending}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Delete “${board.title}”?`}
        description="This permanently removes the board and all of its columns and cards."
        confirmLabel="Delete board"
        destructive
        onConfirm={() => deleteBoard.mutate(board.id)}
      />
    </>
  );
}
