import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { and, asc, count, desc, eq, inArray } from "drizzle-orm";
import type { AppEnv } from "../lib/context";
import { requireAuth } from "../lib/middleware";
import { board, boardMember, card, column, comment, label } from "../db/schema";
import { accessibleBoard, boardAccess, requireOwner } from "../lib/resources";
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

async function boardCounts(db: AppEnv["Variables"]["db"], boardId: string) {
  const [[{ columnCount }], [{ cardCount }], [{ memberCount }]] = await Promise.all([
    db.select({ columnCount: count() }).from(column).where(eq(column.boardId, boardId)),
    db.select({ cardCount: count() }).from(card).where(eq(card.boardId, boardId)),
    db.select({ memberCount: count() }).from(boardMember).where(eq(boardMember.boardId, boardId)),
  ]);
  return { columnCount, cardCount, memberCount };
}

export const boardsRouter = new Hono<AppEnv>()
  .use(requireAuth)

  // List every board the user owns or is a member of.
  .get("/", async (c) => {
    const db = c.get("db");
    const userId = c.get("user").id;

    const rows = await db
      .select({ board, role: boardMember.role })
      .from(boardMember)
      .innerJoin(board, eq(board.id, boardMember.boardId))
      .where(eq(boardMember.userId, userId))
      .orderBy(desc(board.updatedAt));

    const summaries = await Promise.all(
      rows.map(async ({ board: b, role }) => {
        const counts = await boardCounts(db, b.id);
        return toBoardSummaryDTO(b, { ...counts, role });
      }),
    );

    return c.json(summaries);
  })

  // Create a board (pre-populated) and register the creator as its owner.
  .post("/", zValidator("json", createBoardSchema), async (c) => {
    const db = c.get("db");
    const userId = c.get("user").id;
    const input = c.req.valid("json");

    const [created] = await db
      .insert(board)
      .values({
        ownerId: userId,
        title: input.title,
        description: input.description,
        color: input.color ?? BOARD_COLORS[0],
      })
      .returning();

    await db.insert(boardMember).values({ boardId: created.id, userId, role: "owner" });

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
      toBoardSummaryDTO(created, { columnCount: 3, cardCount: 0, role: "owner", memberCount: 1 }),
      201,
    );
  })

  // Full board with columns, cards (labels/assignee/checklist counts), members.
  .get("/:boardId", async (c) => {
    const db = c.get("db");
    const userId = c.get("user").id;
    const access = await boardAccess(db, c.req.param("boardId"), userId);
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

    const members = await db.query.boardMember.findMany({
      where: eq(boardMember.boardId, boardRow.id),
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

  // Any member may edit board settings.
  .patch("/:boardId", zValidator("json", updateBoardSchema), async (c) => {
    const db = c.get("db");
    const userId = c.get("user").id;
    const access = await boardAccess(db, c.req.param("boardId"), userId);
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

    const counts = await boardCounts(db, existing.id);
    return c.json(toBoardSummaryDTO(updated, { ...counts, role: access.role }));
  })

  // Only the owner may delete a board.
  .delete("/:boardId", async (c) => {
    const db = c.get("db");
    const access = await boardAccess(db, c.req.param("boardId"), c.get("user").id);
    requireOwner(access);
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
  )

  // --- Members --------------------------------------------------------------

  .get("/:boardId/members", async (c) => {
    const db = c.get("db");
    await accessibleBoard(db, c.req.param("boardId"), c.get("user").id);
    const members = await db.query.boardMember.findMany({
      where: eq(boardMember.boardId, c.req.param("boardId")),
      with: { user: true },
      orderBy: (m, { asc: a }) => [a(m.createdAt)],
    });
    return c.json(members.map((m) => toMemberDTO({ role: m.role, user: m.user })));
  })

  // Invite an existing user by email (owner only).
  .post(
    "/:boardId/members",
    zValidator("json", z.object({ email: z.string().trim().toLowerCase().email() })),
    async (c) => {
      const db = c.get("db");
      const access = await boardAccess(db, c.req.param("boardId"), c.get("user").id);
      requireOwner(access);

      const invitee = await db.query.user.findFirst({
        where: (u, { eq: e }) => e(u.email, c.req.valid("json").email),
      });
      if (!invitee) {
        return c.json({ error: "No user with that email. They must sign up first." }, 404);
      }

      const existing = await db.query.boardMember.findFirst({
        where: and(
          eq(boardMember.boardId, access.board.id),
          eq(boardMember.userId, invitee.id),
        ),
      });
      if (existing) return c.json({ error: "Already a member" }, 409);

      await db
        .insert(boardMember)
        .values({ boardId: access.board.id, userId: invitee.id, role: "editor" });

      return c.json(
        toMemberDTO({
          role: "editor",
          user: { id: invitee.id, name: invitee.name, email: invitee.email, image: invitee.image },
        }),
        201,
      );
    },
  )

  // Remove a member (owner only; the owner cannot remove themselves).
  .delete("/:boardId/members/:userId", async (c) => {
    const db = c.get("db");
    const access = await boardAccess(db, c.req.param("boardId"), c.get("user").id);
    requireOwner(access);

    const targetId = c.req.param("userId");
    if (targetId === access.board.ownerId) {
      return c.json({ error: "The owner cannot be removed" }, 400);
    }

    // Unassign the removed user from this board's cards.
    await db
      .update(card)
      .set({ assigneeId: null })
      .where(and(eq(card.boardId, access.board.id), eq(card.assigneeId, targetId)));

    await db
      .delete(boardMember)
      .where(and(eq(boardMember.boardId, access.board.id), eq(boardMember.userId, targetId)));

    return c.body(null, 204);
  });
