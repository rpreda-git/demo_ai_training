import { useState } from "react";
import { Plus, Tag } from "lucide-react";
import { LABEL_COLORS, type LabelDTO } from "@shared/types";
import { useBoardActions } from "@/hooks/use-board";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ColorSwatches, LabelPill } from "@/components/board/label-pill";

export function BoardLabelsMenu({ boardId, labels }: { boardId: string; labels: LabelDTO[] }) {
  const { createLabel } = useBoardActions(boardId);
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(LABEL_COLORS[0]);

  function add() {
    const trimmed = name.trim();
    if (!trimmed) return;
    createLabel.mutate({ name: trimmed, color }, { onSuccess: () => setName("") });
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Tag className="size-4" /> Labels
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {labels.map((label) => (
            <LabelPill key={label.id} label={label} />
          ))}
          {labels.length === 0 && (
            <span className="text-muted-foreground text-xs">No labels yet.</span>
          )}
        </div>
        <div className="space-y-2 border-t pt-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="New label name"
            className="h-8"
          />
          <ColorSwatches colors={LABEL_COLORS} value={color} onChange={setColor} />
          <Button size="sm" className="w-full" onClick={add} disabled={!name.trim()}>
            <Plus className="size-4" /> Add label
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
