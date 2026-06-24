import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import type { DB } from "../db";
import { board, card, column, comment, label, orgMember, user } from "../db/schema";
import type { BoardRow, CardRow, ColumnRow, LabelRow, OrgRole } from "../db/schema";

const notFound = (what: string) => new HTTPException(404, { message: `${what} not found` });

/** Resolves the user's active organization (falling back to their first membership). */
export async function activeOrg(
  db: DB,
  userId: string,
): Promise<{ organizationId: string; role: OrgRole }> {
  const u = await db.query.user.findFirst({
    where: eq(user.id, userId),
    columns: { activeOrganizationId: true },
  });

  if (u?.activeOrganizationId) {
    const m = await db.query.orgMember.findFirst({
      where: and(
        eq(orgMember.organizationId, u.activeOrganizationId),
        eq(orgMember.userId, userId),
      ),
    });
    if (m) return { organizationId: m.organizationId, role: m.role };
  }

  const first = await db.query.orgMember.findFirst({
    where: eq(orgMember.userId, userId),
    orderBy: (m, { asc }) => [asc(m.createdAt)],
  });
  if (!first) throw new HTTPException(400, { message: "You have no organization" });

  await db
    .update(user)
    .set({ activeOrganizationId: first.organizationId })
    .where(eq(user.id, userId));
  return { organizationId: first.organizationId, role: first.role };
}

export async function orgRole(
  db: DB,
  organizationId: string,
  userId: string,
): Promise<OrgRole | undefined> {
  const m = await db.query.orgMember.findFirst({
    where: and(eq(orgMember.organizationId, organizationId), eq(orgMember.userId, userId)),
  });
  return m?.role;
}

/** Throws 403 unless the role can manage the org (owner or admin). */
export function requireOrgManager(role: OrgRole): void {
  if (role !== "owner" && role !== "admin") {
    throw new HTTPException(403, { message: "Requires admin or owner" });
  }
}

export interface BoardAccess {
  board: BoardRow;
  /** The user's role in the board's organization. */
  role: OrgRole;
}

/** Loads a board the user can access via org membership, with their org role. */
export async function boardAccess(db: DB, boardId: string, userId: string): Promise<BoardAccess> {
  const row = await db.query.board.findFirst({ where: eq(board.id, boardId) });
  if (!row || !row.organizationId) throw notFound("Board");
  const role = await orgRole(db, row.organizationId, userId);
  if (!role) throw notFound("Board");
  return { board: row, role };
}

export async function accessibleBoard(db: DB, boardId: string, userId: string): Promise<BoardRow> {
  return (await boardAccess(db, boardId, userId)).board;
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
