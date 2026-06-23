import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { and, asc, count, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import type { AppEnv } from "../lib/context";
import { requireAuth } from "../lib/middleware";
import { card, cardLabel, comment } from "../db/schema";
import type { CardRow } from "../db/schema";
import { ownedCard, ownedColumn, ownedLabel } from "../lib/resources";
import { toCardDTO, toCommentDTO } from "../lib/serializers";
import type { DB } from "../db";
import type { CardDetailDTO } from "@shared/types";

/** Fetches a card's labels and comment count, then serializes to a DTO. */
async function cardDTO(db: DB, row: CardRow) {
  const links = await db.query.cardLabel.findMany({
    where: eq(cardLabel.cardId, row.id),
    with: { label: true },
  });
  const [{ n }] = await db
    .select({ n: count() })
    .from(comment)
    .where(eq(comment.cardId, row.id));
  return toCardDTO(
    row,
    links.map((l) => l.label),
    n,
  );
}

export const cardsRouter = new Hono<AppEnv>()
  .use(requireAuth)

  // Card with its full comment thread.
  .get("/:cardId", async (c) => {
    const db = c.get("db");
    const row = await ownedCard(db, c.req.param("cardId"), c.get("user").id);
    const base = await cardDTO(db, row);

    const comments = await db.query.comment.findMany({
      where: eq(comment.cardId, row.id),
      orderBy: [asc(comment.createdAt)],
      with: { user: true },
    });

    const detail: CardDetailDTO = {
      ...base,
      comments: comments.map((cm) =>
        toCommentDTO({
          id: cm.id,
          cardId: cm.cardId,
          body: cm.body,
          createdAt: cm.createdAt,
          author: { id: cm.user.id, name: cm.user.name, image: cm.user.image },
        }),
      ),
    };
    return c.json(detail);
  })

  // Edit and/or move a card.
  .patch(
    "/:cardId",
    zValidator(
      "json",
      z.object({
        title: z.string().trim().min(1).max(200).optional(),
        description: z.string().trim().max(5000).nullable().optional(),
        dueDate: z.coerce.date().nullable().optional(),
        completed: z.boolean().optional(),
        columnId: z.string().optional(),
        position: z.number().optional(),
      }),
    ),
    async (c) => {
      const db = c.get("db");
      const userId = c.get("user").id;
      const existing = await ownedCard(db, c.req.param("cardId"), userId);
      const input = c.req.valid("json");

      // Moving to another column: the target must be on the same board.
      let columnId = existing.columnId;
      if (input.columnId && input.columnId !== existing.columnId) {
        const target = await ownedColumn(db, input.columnId, userId);
        if (target.boardId !== existing.boardId) {
          throw new HTTPException(400, { message: "Cannot move card across boards" });
        }
        columnId = target.id;
      }

      const [updated] = await db
        .update(card)
        .set({
          title: input.title ?? existing.title,
          description:
            input.description === undefined ? existing.description : input.description,
          dueDate: input.dueDate === undefined ? existing.dueDate : input.dueDate,
          completed: input.completed ?? existing.completed,
          columnId,
          position: input.position ?? existing.position,
        })
        .where(eq(card.id, existing.id))
        .returning();

      return c.json(await cardDTO(db, updated));
    },
  )

  .delete("/:cardId", async (c) => {
    const db = c.get("db");
    const existing = await ownedCard(db, c.req.param("cardId"), c.get("user").id);
    await db.delete(card).where(eq(card.id, existing.id));
    return c.body(null, 204);
  })

  // Attach a label.
  .post(
    "/:cardId/labels",
    zValidator("json", z.object({ labelId: z.string() })),
    async (c) => {
      const db = c.get("db");
      const userId = c.get("user").id;
      const cardRow = await ownedCard(db, c.req.param("cardId"), userId);
      const labelRow = await ownedLabel(db, c.req.valid("json").labelId, userId);
      if (labelRow.boardId !== cardRow.boardId) {
        throw new HTTPException(400, { message: "Label belongs to another board" });
      }
      await db
        .insert(cardLabel)
        .values({ cardId: cardRow.id, labelId: labelRow.id })
        .onConflictDoNothing();
      return c.json(await cardDTO(db, cardRow));
    },
  )

  // Detach a label.
  .delete("/:cardId/labels/:labelId", async (c) => {
    const db = c.get("db");
    const cardRow = await ownedCard(db, c.req.param("cardId"), c.get("user").id);
    await db
      .delete(cardLabel)
      .where(
        and(eq(cardLabel.cardId, cardRow.id), eq(cardLabel.labelId, c.req.param("labelId"))),
      );
    return c.json(await cardDTO(db, cardRow));
  })

  // Add a comment.
  .post(
    "/:cardId/comments",
    zValidator("json", z.object({ body: z.string().trim().min(1).max(2000) })),
    async (c) => {
      const db = c.get("db");
      const user = c.get("user");
      const cardRow = await ownedCard(db, c.req.param("cardId"), user.id);
      const [created] = await db
        .insert(comment)
        .values({ cardId: cardRow.id, userId: user.id, body: c.req.valid("json").body })
        .returning();
      return c.json(
        toCommentDTO({
          id: created.id,
          cardId: created.cardId,
          body: created.body,
          createdAt: created.createdAt,
          author: { id: user.id, name: user.name, image: user.image ?? null },
        }),
        201,
      );
    },
  );
