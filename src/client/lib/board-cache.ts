import type { BoardDetailDTO, CardDTO, ColumnDTO, MemberDTO } from "@shared/types";

/** Immutable helpers for editing a cached BoardDetailDTO (used by optimistic updates + DnD). */

export function setColumns(board: BoardDetailDTO, columns: ColumnDTO[]): BoardDetailDTO {
  return { ...board, columns };
}

export function patchColumn(
  board: BoardDetailDTO,
  columnId: string,
  patch: Partial<ColumnDTO>,
): BoardDetailDTO {
  return setColumns(
    board,
    board.columns.map((col) => (col.id === columnId ? { ...col, ...patch } : col)),
  );
}

export function removeColumn(board: BoardDetailDTO, columnId: string): BoardDetailDTO {
  return setColumns(
    board,
    board.columns.filter((col) => col.id !== columnId),
  );
}

export function addColumn(board: BoardDetailDTO, column: ColumnDTO): BoardDetailDTO {
  return setColumns(board, [...board.columns, column]);
}

export function addCard(board: BoardDetailDTO, columnId: string, card: CardDTO): BoardDetailDTO {
  return setColumns(
    board,
    board.columns.map((col) =>
      col.id === columnId ? { ...col, cards: [...col.cards, card] } : col,
    ),
  );
}

export function patchCard(
  board: BoardDetailDTO,
  cardId: string,
  patch: Partial<CardDTO>,
): BoardDetailDTO {
  return setColumns(
    board,
    board.columns.map((col) => ({
      ...col,
      cards: col.cards.map((card) => (card.id === cardId ? { ...card, ...patch } : card)),
    })),
  );
}

export function removeCard(board: BoardDetailDTO, cardId: string): BoardDetailDTO {
  return setColumns(
    board,
    board.columns.map((col) => ({
      ...col,
      cards: col.cards.filter((card) => card.id !== cardId),
    })),
  );
}

export function findCard(
  board: BoardDetailDTO,
  cardId: string,
): { card: CardDTO; columnId: string; index: number } | null {
  for (const col of board.columns) {
    const index = col.cards.findIndex((c) => c.id === cardId);
    if (index !== -1) return { card: col.cards[index], columnId: col.id, index };
  }
  return null;
}

/**
 * Moves a card into `toColumnId` at `toIndex` (array order), returning a new board.
 * Pass `toIndex = null` to append.
 */
export function moveCard(
  board: BoardDetailDTO,
  cardId: string,
  toColumnId: string,
  toIndex: number | null,
): BoardDetailDTO {
  const located = findCard(board, cardId);
  if (!located) return board;
  const moving = located.card;

  const columns = board.columns.map((col) => {
    if (col.id === located.columnId) {
      return { ...col, cards: col.cards.filter((c) => c.id !== cardId) };
    }
    return col;
  });

  const next = columns.map((col) => {
    if (col.id !== toColumnId) return col;
    const cards = [...col.cards];
    const insertAt = toIndex === null ? cards.length : Math.min(Math.max(toIndex, 0), cards.length);
    cards.splice(insertAt, 0, { ...moving, columnId: toColumnId });
    return { ...col, cards };
  });

  return setColumns(board, next);
}

export function addMember(board: BoardDetailDTO, member: MemberDTO): BoardDetailDTO {
  return { ...board, members: [...board.members, member] };
}

/** Removes a member and clears them from any card they were assigned to. */
export function removeMember(board: BoardDetailDTO, userId: string): BoardDetailDTO {
  const cleared = setColumns(
    board,
    board.columns.map((col) => ({
      ...col,
      cards: col.cards.map((card) =>
        card.assignee?.id === userId ? { ...card, assignee: null } : card,
      ),
    })),
  );
  return { ...cleared, members: cleared.members.filter((m) => m.userId !== userId) };
}

const POS_STEP = 1000;

/**
 * Computes a fractional position for the card currently at `index` in `cards`
 * (array already in the desired order), based on its neighbours.
 */
export function positionForIndex(cards: CardDTO[], index: number): number {
  const prev = cards[index - 1];
  const next = cards[index + 1];
  if (prev && next) return (prev.position + next.position) / 2;
  if (prev) return prev.position + POS_STEP;
  if (next) return next.position / 2;
  return POS_STEP;
}
