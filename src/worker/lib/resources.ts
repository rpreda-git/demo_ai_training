import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import type { DB } from "../db";
import { board, boardMember, card, column, comment, label } from "../db/schema";
import type { BoardRole, BoardRow, CardRow, ColumnRow, LabelRow } from "../db/schema";

const notFound = (what: string) => new HTTPException(404, { message: `${what} not found` });

export interface BoardAccess {
  board: BoardRow;
  role: BoardRole;
}

/**
 * Loads a board the user can access (owner or member) along with their role.
 * Throws 404 (not 403) when there is no access, so board existence isn't leaked.
 */
export async function boardAccess(db: DB, boardId: string, userId: string): Promise<BoardAccess> {
  const row = await db.query.board.findFirst({ where: eq(board.id, boardId) });
  if (!row) throw notFound("Board");
  const membership = await db.query.boardMember.findFirst({
    where: and(eq(boardMember.boardId, boardId), eq(boardMember.userId, userId)),
  });
  if (!membership) throw notFound("Board");
  return { board: row, role: membership.role };
}

/** Like {@link boardAccess} but returns just the board row. */
export async function accessibleBoard(db: DB, boardId: string, userId: string): Promise<BoardRow> {
  return (await boardAccess(db, boardId, userId)).board;
}

/** Throws 403 unless the access role is "owner". */
export function requireOwner(access: BoardAccess): void {
  if (access.role !== "owner") {
    throw new HTTPException(403, { message: "Only the board owner can do this" });
  }
}

export async function accessibleColumn(db: DB, columnId: string, userId: string): Promise<ColumnRow> {
  const row = await db.query.column.findFirst({ where: eq(column.id, columnId) });
  if (!row) throw notFound("Column");
  await accessibleBoard(db, row.boardId, userId);
  return row;
}

export async function accessibleCard(db: DB, cardId: string, userId: string): Promise<CardRow> {
  const row = await db.query.card.findFirst({ where: eq(card.id, cardId) });
  if (!row) throw notFound("Card");
  await accessibleBoard(db, row.boardId, userId);
  return row;
}

export async function accessibleLabel(db: DB, labelId: string, userId: string): Promise<LabelRow> {
  const row = await db.query.label.findFirst({ where: eq(label.id, labelId) });
  if (!row) throw notFound("Label");
  await accessibleBoard(db, row.boardId, userId);
  return row;
}

/** Only the comment's author may modify it. */
export async function ownComment(db: DB, commentId: string, userId: string) {
  const row = await db.query.comment.findFirst({ where: eq(comment.id, commentId) });
  if (!row) throw notFound("Comment");
  if (row.userId !== userId) throw new HTTPException(403, { message: "Not your comment" });
  return row;
}
