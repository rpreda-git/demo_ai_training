import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { and, asc, count, eq, inArray } from "drizzle-orm";
import type { AppEnv } from "../lib/context";
import { requireAuth } from "../lib/middleware";
import { board, card, column, comment, label } from "../db/schema";
import { ownedBoard } from "../lib/resources";
import { toBoardSummaryDTO, toCardDTO, toColumnDTO, toLabelDTO } from "../lib/serializers";
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

export const boardsRouter = new Hono<AppEnv>()
  .use(requireAuth)

  // List the current user's boards with lightweight counts.
  .get("/", async (c) => {
    const db = c.get("db");
    const userId = c.get("user").id;

    const boards = await db.query.board.findMany({
      where: eq(board.ownerId, userId),
      orderBy: (b, { desc }) => [desc(b.updatedAt)],
    });

    const summaries = await Promise.all(
      boards.map(async (b) => {
        const [{ columnCount }] = await db
          .select({ columnCount: count() })
          .from(column)
          .where(eq(column.boardId, b.id));
        const [{ cardCount }] = await db
          .select({ cardCount: count() })
          .from(card)
          .where(eq(card.boardId, b.id));
        return toBoardSummaryDTO(b, columnCount, cardCount);
      }),
    );

    return c.json(summaries);
  })

  // Create a board pre-populated with default columns and labels.
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

    return c.json(toBoardSummaryDTO(created, 3, 0), 201);
  })

  // Full board with columns, cards, labels and per-card comment counts.
  .get("/:boardId", async (c) => {
    const db = c.get("db");
    const userId = c.get("user").id;
    const boardRow = await ownedBoard(db, c.req.param("boardId"), userId);

    const columns = await db.query.column.findMany({
      where: eq(column.boardId, boardRow.id),
      orderBy: [asc(column.position)],
      with: {
        cards: {
          orderBy: [asc(card.position)],
          with: { cardLabels: { with: { label: true } } },
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

    const columnDTOs: ColumnDTO[] = columns.map((col) =>
      toColumnDTO(
        col,
        col.cards.map((cd) =>
          toCardDTO(
            cd,
            cd.cardLabels.map((cl) => cl.label),
            commentCounts.get(cd.id) ?? 0,
          ),
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
    };

    return c.json(detail);
  })

  .patch("/:boardId", zValidator("json", updateBoardSchema), async (c) => {
    const db = c.get("db");
    const userId = c.get("user").id;
    const existing = await ownedBoard(db, c.req.param("boardId"), userId);
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

    const [{ columnCount }] = await db
      .select({ columnCount: count() })
      .from(column)
      .where(eq(column.boardId, existing.id));
    const [{ cardCount }] = await db
      .select({ cardCount: count() })
      .from(card)
      .where(eq(card.boardId, existing.id));

    return c.json(toBoardSummaryDTO(updated, columnCount, cardCount));
  })

  .delete("/:boardId", async (c) => {
    const db = c.get("db");
    const userId = c.get("user").id;
    const existing = await ownedBoard(db, c.req.param("boardId"), userId);
    await db.delete(board).where(and(eq(board.id, existing.id), eq(board.ownerId, userId)));
    return c.body(null, 204);
  })

  // Append a new column to the board.
  .post(
    "/:boardId/columns",
    zValidator("json", z.object({ title: z.string().trim().min(1).max(80) })),
    async (c) => {
      const db = c.get("db");
      const userId = c.get("user").id;
      const b = await ownedBoard(db, c.req.param("boardId"), userId);
      const last = await db.query.column.findFirst({
        where: eq(column.boardId, b.id),
        orderBy: (col, { desc }) => [desc(col.position)],
      });
      const position = (last?.position ?? 0) + POS_STEP;
      const [created] = await db
        .insert(column)
        .values({ boardId: b.id, title: c.req.valid("json").title, position })
        .returning();
      return c.json(toColumnDTO(created, []), 201);
    },
  )

  // Create a label on the board.
  .post(
    "/:boardId/labels",
    zValidator(
      "json",
      z.object({ name: z.string().trim().min(1).max(40), color: z.enum(LABEL_COLORS) }),
    ),
    async (c) => {
      const db = c.get("db");
      const userId = c.get("user").id;
      const b = await ownedBoard(db, c.req.param("boardId"), userId);
      const input = c.req.valid("json");
      const [created] = await db
        .insert(label)
        .values({ boardId: b.id, name: input.name, color: input.color })
        .returning();
      return c.json(toLabelDTO(created), 201);
    },
  );
