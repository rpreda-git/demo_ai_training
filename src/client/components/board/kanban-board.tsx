import { useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import type { BoardDetailDTO, CardDTO } from "@shared/types";
import { useSession } from "@/lib/auth-client";
import { useBoardActions } from "@/hooks/use-board";
import { queryKeys } from "@/lib/query-keys";
import { findCard, moveCard, positionForIndex } from "@/lib/board-cache";
import { hasActiveFilters, matchesFilters, type BoardFilters } from "@/lib/card-filters";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KanbanColumn } from "@/components/board/kanban-column";
import { KanbanCardView } from "@/components/board/kanban-card";

export function KanbanBoard({
  board,
  filters,
  onOpenCard,
}: {
  board: BoardDetailDTO;
  filters: BoardFilters;
  onOpenCard: (cardId: string) => void;
}) {
  const qc = useQueryClient();
  const boardKey = queryKeys.board(board.id);
  const actions = useBoardActions(board.id);
  const { data: session } = useSession();
  const interactive = !hasActiveFilters(filters);

  const [activeCard, setActiveCard] = useState<CardDTO | null>(null);
  const [addingColumn, setAddingColumn] = useState(false);
  const [columnDraft, setColumnDraft] = useState("");
  const dragStart = useRef<{ columnId: string; index: number } | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const current = () => qc.getQueryData<BoardDetailDTO>(boardKey);

  function resolveTarget(board: BoardDetailDTO, overId: string, overType: string | undefined) {
    if (overType === "column") {
      const col = board.columns.find((c) => c.id === overId);
      return col ? { columnId: col.id, index: col.cards.length } : null;
    }
    const loc = findCard(board, overId);
    return loc ? { columnId: loc.columnId, index: loc.index } : null;
  }

  function onDragStart(event: DragStartEvent) {
    const board = current();
    if (!board) return;
    const loc = findCard(board, String(event.active.id));
    if (loc) {
      setActiveCard(loc.card);
      dragStart.current = { columnId: loc.columnId, index: loc.index };
    }
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const board = current();
    if (!board) return;
    const from = findCard(board, activeId);
    if (!from) return;

    const target = resolveTarget(board, overId, over.data.current?.type as string | undefined);
    if (!target) return;
    if (from.columnId === target.columnId && from.index === target.index) return;

    actions.write((b) => moveCard(b, activeId, target.columnId, target.index));
  }

  function onDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id);
    setActiveCard(null);
    const start = dragStart.current;
    dragStart.current = null;

    const board = current();
    if (!board) return;
    const loc = findCard(board, activeId);
    if (!loc) return;

    // No-op if the card ended where it started.
    if (start && start.columnId === loc.columnId && start.index === loc.index) return;

    const col = board.columns.find((c) => c.id === loc.columnId);
    if (!col) return;
    const position = positionForIndex(col.cards, loc.index);
    actions.updateCard.mutate({
      cardId: activeId,
      data: { columnId: loc.columnId, position },
    });
  }

  function submitColumn() {
    const title = columnDraft.trim();
    if (!title) return;
    actions.createColumn.mutate(title);
    setColumnDraft("");
    setAddingColumn(false);
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActiveCard(null)}
      >
        <div className="flex flex-1 items-start gap-4 overflow-x-auto px-4 pb-6 sm:px-6">
          {board.columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              cards={
                interactive
                  ? column.cards
                  : column.cards.filter((c) => matchesFilters(c, filters, session?.user?.id))
              }
              interactive={interactive}
              onOpenCard={onOpenCard}
              onToggleComplete={(cardId, next) =>
                actions.updateCard.mutate({ cardId, data: { completed: next } })
              }
              onAddCard={(title) => actions.createCard.mutate({ columnId: column.id, title })}
              onRename={(title) => actions.renameColumn.mutate({ columnId: column.id, title })}
              onDelete={() => actions.deleteColumn.mutate(column.id)}
            />
          ))}

          <div className={cn("w-72 shrink-0", !interactive && "hidden")}>
            {addingColumn ? (
              <div className="bg-muted/50 flex flex-col gap-2 rounded-xl border p-2">
                <Input
                  autoFocus
                  value={columnDraft}
                  onChange={(e) => setColumnDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitColumn();
                    if (e.key === "Escape") setAddingColumn(false);
                  }}
                  placeholder="List title…"
                />
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={submitColumn} disabled={!columnDraft.trim()}>
                    Add list
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    onClick={() => setAddingColumn(false)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="text-muted-foreground w-full justify-start border-dashed"
                onClick={() => setAddingColumn(true)}
              >
                <Plus className="size-4" /> Add a list
              </Button>
            )}
          </div>
        </div>

        <DragOverlay>
          {activeCard ? (
            <div className="w-64">
              <KanbanCardView card={activeCard} dragging />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </>
  );
}
