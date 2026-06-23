import { useState } from "react";
import { Plus } from "lucide-react";
import { BOARD_COLORS } from "@shared/types";
import { useCreateBoard } from "@/hooks/use-boards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ColorSwatches } from "@/components/board/label-pill";

export function CreateBoardDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState<string>(BOARD_COLORS[0]);
  const createBoard = useCreateBoard();

  function reset() {
    setTitle("");
    setDescription("");
    setColor(BOARD_COLORS[0]);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    createBoard.mutate(
      { title: title.trim(), description: description.trim() || undefined, color },
      {
        onSuccess: () => {
          reset();
          setOpen(false);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          New board
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a board</DialogTitle>
          <DialogDescription>
            Boards start with To&nbsp;Do / In&nbsp;Progress / Done columns and a few labels.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4" id="create-board-form">
          <div className="grid gap-2">
            <Label htmlFor="board-title">Title</Label>
            <Input
              id="board-title"
              value={title}
              autoFocus
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Product roadmap"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="board-desc">Description</Label>
            <Textarea
              id="board-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
              rows={3}
            />
          </div>
          <div className="grid gap-2">
            <Label>Color</Label>
            <ColorSwatches colors={BOARD_COLORS} value={color} onChange={setColor} />
          </div>
        </form>
        <DialogFooter>
          <Button
            type="submit"
            form="create-board-form"
            disabled={!title.trim() || createBoard.isPending}
          >
            Create board
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
