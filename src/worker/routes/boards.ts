import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { asc, count, desc, eq, inArray } from "drizzle-orm";
import type { AppEnv } from "../lib/context";
import { requireAuth } from "../lib/middleware";
import { board, card, column, comment, label, orgMember } from "../db/schema";
import { accessibleBoard, activeOrg, boardAccess, requireOrgManager } from "../lib/resources";
import {
  toBoardSummaryDTO,
  toCardDTO,
  toColumnDTO,
  toLabelDTO,
  toMemberDTO,
  toAuthorDTO,
} from "../lib/serializers";
import type { BoardDetailDTO, ColumnDTO } from "@shared/types";
import { BOARD_COLORS, LABEL_COLORS } from "@shared/types";

const POS_STEP = 1000;

const createBoardSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional(),
  color: z.enum(BOARD_COLORS).optional(),
});

const updateBoardSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  color: z.enum(BOARD_COLORS).optional(),
});

const orgMemberCount = async (db: AppEnv["Variables"]["db"], orgId: string) => {
  const [{ n }] = await db
    .select({ n: count() })
    .from(orgMember)
    .where(eq(orgMember.organizationId, orgId));
  return n;
};

async function cardColumnCounts(db: AppEnv["Variables"]["db"], boardId: string) {
  const [[{ columnCount }], [{ cardCount }]] = await Promise.all([
    db.select({ columnCount: count() }).from(column).where(eq(column.boardId, boardId)),
    db.select({ cardCount: count() }).from(card).where(eq(card.boardId, boardId)),
  ]);
  return { columnCount, cardCount };
}

export const boardsRouter = new Hono<AppEnv>()
  .use(requireAuth)

  // Boards in the user's active organization.
  .get("/", async (c) => {
    const db = c.get("db");
    const { organizationId, role } = await activeOrg(db, c.get("user").id);

    const boards = await db.query.board.findMany({
      where: eq(board.organizationId, organizationId),
      orderBy: [desc(board.updatedAt)],
    });
    const memberCount = await orgMemberCount(db, organizationId);

    const summaries = await Promise.all(
      boards.map(async (b) =>
        toBoardSummaryDTO(b, { ...(await cardColumnCounts(db, b.id)), role, memberCount }),
      ),
    );
    return c.json(summaries);
  })

  // Create a board in the active organization (pre-populated).
  .post("/", zValidator("json", createBoardSchema), async (c) => {
    const db = c.get("db");
    const userId = c.get("user").id;
    const { organizationId, role } = await activeOrg(db, userId);
    const input = c.req.valid("json");

    const [created] = await db
      .insert(board)
      .values({
        organizationId,
        ownerId: userId,
        title: input.title,
        description: input.description,
        color: input.color ?? BOARD_COLORS[0],
      })
      .returning();

    await db.insert(column).values([
      { boardId: created.id, title: "To Do", position: POS_STEP },
      { boardId: created.id, title: "In Progress", position: POS_STEP * 2 },
      { boardId: created.id, title: "Done", position: POS_STEP * 3 },
    ]);

    await db.insert(label).values([
      { boardId: created.id, name: "Bug", color: "#ef4444" },
      { boardId: created.id, name: "Feature", color: "#22c55e" },
      { boardId: created.id, name: "Urgent", color: "#f97316" },
      { boardId: created.id, name: "Design", color: "#a855f7" },
    ]);

    return c.json(
      toBoardSummaryDTO(created, {
        columnCount: 3,
        cardCount: 0,
        role,
        memberCount: await orgMemberCount(db, organizationId),
      }),
      201,
    );
  })

  // Full board with columns/cards and the organization's members.
  .get("/:boardId", async (c) => {
    const db = c.get("db");
    const access = await boardAccess(db, c.req.param("boardId"), c.get("user").id);
    const boardRow = access.board;

    const columns = await db.query.column.findMany({
      where: eq(column.boardId, boardRow.id),
      orderBy: [asc(column.position)],
      with: {
        cards: {
          orderBy: [asc(card.position)],
          with: {
            cardLabels: { with: { label: true } },
            assignee: true,
            checklist: true,
          },
        },
      },
    });

    const cardIds = columns.flatMap((col) => col.cards.map((cd) => cd.id));
    const commentCounts = new Map<string, number>();
    if (cardIds.length > 0) {
      const rows = await db
        .select({ cardId: comment.cardId, n: count() })
        .from(comment)
        .where(inArray(comment.cardId, cardIds))
        .groupBy(comment.cardId);
      for (const r of rows) commentCounts.set(r.cardId, r.n);
    }

    const labels = await db.query.label.findMany({
      where: eq(label.boardId, boardRow.id),
      orderBy: (l, { asc: a }) => [a(l.name)],
    });

    const members = await db.query.orgMember.findMany({
      where: eq(orgMember.organizationId, boardRow.organizationId!),
      with: { user: true },
      orderBy: (m, { asc: a }) => [a(m.createdAt)],
    });

    const columnDTOs: ColumnDTO[] = columns.map((col) =>
      toColumnDTO(
        col,
        col.cards.map((cd) =>
          toCardDTO(cd, {
            labels: cd.cardLabels.map((cl) => cl.label),
            commentCount: commentCounts.get(cd.id) ?? 0,
            assignee: toAuthorDTO(cd.assignee),
            checklistTotal: cd.checklist.length,
            checklistDone: cd.checklist.filter((i) => i.completed).length,
          }),
        ),
      ),
    );

    const detail: BoardDetailDTO = {
      id: boardRow.id,
      organizationId: boardRow.organizationId!,
      title: boardRow.title,
      description: boardRow.description,
      color: boardRow.color,
      createdAt: boardRow.createdAt.toISOString(),
      updatedAt: boardRow.updatedAt.toISOString(),
      columns: columnDTOs,
      labels: labels.map(toLabelDTO),
      members: members.map((m) => toMemberDTO({ role: m.role, user: m.user })),
      role: access.role,
    };

    return c.json(detail);
  })

  // Any org member may edit board settings.
  .patch("/:boardId", zValidator("json", updateBoardSchema), async (c) => {
    const db = c.get("db");
    const access = await boardAccess(db, c.req.param("boardId"), c.get("user").id);
    const existing = access.board;
    const input = c.req.valid("json");

    const [updated] = await db
      .update(board)
      .set({
        title: input.title ?? existing.title,
        description: input.description === undefined ? existing.description : input.description,
        color: input.color ?? existing.color,
      })
      .where(eq(board.id, existing.id))
      .returning();

    return c.json(
      toBoardSummaryDTO(updated, {
        ...(await cardColumnCounts(db, existing.id)),
        role: access.role,
        memberCount: await orgMemberCount(db, existing.organizationId!),
      }),
    );
  })

  // Owners/admins may delete a board.
  .delete("/:boardId", async (c) => {
    const db = c.get("db");
    const access = await boardAccess(db, c.req.param("boardId"), c.get("user").id);
    requireOrgManager(access.role);
    await db.delete(board).where(eq(board.id, access.board.id));
    return c.body(null, 204);
  })

  // Append a column (members allowed).
  .post(
    "/:boardId/columns",
    zValidator("json", z.object({ title: z.string().trim().min(1).max(80) })),
    async (c) => {
      const db = c.get("db");
      const b = await accessibleBoard(db, c.req.param("boardId"), c.get("user").id);
      const last = await db.query.column.findFirst({
        where: eq(column.boardId, b.id),
        orderBy: (col, { desc: d }) => [d(col.position)],
      });
      const position = (last?.position ?? 0) + POS_STEP;
      const [created] = await db
        .insert(column)
        .values({ boardId: b.id, title: c.req.valid("json").title, position })
        .returning();
      return c.json(toColumnDTO(created, []), 201);
    },
  )

  // Create a label (members allowed).
  .post(
    "/:boardId/labels",
    zValidator(
      "json",
      z.object({ name: z.string().trim().min(1).max(40), color: z.enum(LABEL_COLORS) }),
    ),
    async (c) => {
      const db = c.get("db");
      const b = await accessibleBoard(db, c.req.param("boardId"), c.get("user").id);
      const input = c.req.valid("json");
      const [created] = await db
        .insert(label)
        .values({ boardId: b.id, name: input.name, color: input.color })
        .returning();
      return c.json(toLabelDTO(created), 201);
    },
  );
