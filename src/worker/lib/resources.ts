import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import type { DB } from "../db";
import { board, card, column, comment, label } from "../db/schema";
import type { BoardRow, CardRow, ColumnRow, LabelRow } from "../db/schema";

const notFound = (what: string) => new HTTPException(404, { message: `${what} not found` });

/** Loads a board, asserting the user owns it. */
export async function ownedBoard(db: DB, boardId: string, userId: string): Promise<BoardRow> {
  const row = await db.query.board.findFirst({
    where: and(eq(board.id, boardId), eq(board.ownerId, userId)),
  });
  if (!row) throw notFound("Board");
  return row;
}

/** Loads a column and verifies it belongs to a board the user owns. */
export async function ownedColumn(db: DB, columnId: string, userId: string): Promise<ColumnRow> {
  const row = await db.query.column.findFirst({ where: eq(column.id, columnId) });
  if (!row) throw notFound("Column");
  await ownedBoard(db, row.boardId, userId);
  return row;
}

/** Loads a card and verifies it belongs to a board the user owns. */
export async function ownedCard(db: DB, cardId: string, userId: string): Promise<CardRow> {
  const row = await db.query.card.findFirst({ where: eq(card.id, cardId) });
  if (!row) throw notFound("Card");
  await ownedBoard(db, row.boardId, userId);
  return row;
}

/** Loads a label and verifies it belongs to a board the user owns. */
export async function ownedLabel(db: DB, labelId: string, userId: string): Promise<LabelRow> {
  const row = await db.query.label.findFirst({ where: eq(label.id, labelId) });
  if (!row) throw notFound("Label");
  await ownedBoard(db, row.boardId, userId);
  return row;
}

/** Loads a comment authored by the user (only the author may delete it). */
export async function ownComment(db: DB, commentId: string, userId: string) {
  const row = await db.query.comment.findFirst({ where: eq(comment.id, commentId) });
  if (!row) throw notFound("Comment");
  if (row.userId !== userId) throw new HTTPException(403, { message: "Not your comment" });
  return row;
}
