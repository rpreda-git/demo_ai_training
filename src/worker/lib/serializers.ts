import type {
  BoardSummaryDTO,
  CardDTO,
  ColumnDTO,
  CommentDTO,
  LabelDTO,
} from "@shared/types";
import type { BoardRow, CardRow, ColumnRow, LabelRow } from "../db/schema";

const iso = (d: Date | null): string | null => (d ? d.toISOString() : null);

export function toLabelDTO(row: LabelRow): LabelDTO {
  return { id: row.id, boardId: row.boardId, name: row.name, color: row.color };
}

export function toCardDTO(
  row: CardRow,
  labels: LabelRow[],
  commentCount: number,
): CardDTO {
  return {
    id: row.id,
    columnId: row.columnId,
    boardId: row.boardId,
    title: row.title,
    description: row.description,
    position: row.position,
    dueDate: iso(row.dueDate),
    completed: row.completed,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    labels: labels.map(toLabelDTO),
    commentCount,
  };
}

export function toColumnDTO(row: ColumnRow, cards: CardDTO[]): ColumnDTO {
  return {
    id: row.id,
    boardId: row.boardId,
    title: row.title,
    position: row.position,
    cards,
  };
}

export function toBoardSummaryDTO(
  row: BoardRow,
  columnCount: number,
  cardCount: number,
): BoardSummaryDTO {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    color: row.color,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    columnCount,
    cardCount,
  };
}

export function toCommentDTO(row: {
  id: string;
  cardId: string;
  body: string;
  createdAt: Date;
  author: { id: string; name: string; image: string | null };
}): CommentDTO {
  return {
    id: row.id,
    cardId: row.cardId,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    author: row.author,
  };
}
