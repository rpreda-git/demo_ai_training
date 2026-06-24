import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { and, asc, count, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import type { AppEnv } from "../lib/context";
import { requireAuth } from "../lib/middleware";
import { board, card, cardLabel, checklistItem, comment, orgMember, user } from "../db/schema";
import type { CardRow } from "../db/schema";
import { accessibleCard, accessibleColumn, accessibleLabel } from "../lib/resources";
import {
  toAuthorDTO,
  toCardDTO,
  toChecklistItemDTO,
  toCommentDTO,
} from "../lib/serializers";
import type { DB } from "../db";
import type { CardDetailDTO } from "@shared/types";

const POS_STEP = 1000;

/** Loads a card's labels, comment count, assignee and checklist progress. */
async function cardDTO(db: DB, row: CardRow) {
  const [links, [{ n }], checklist, assignee] = await Promise.all([
    db.query.cardLabel.findMany({ where: eq(cardLabel.cardId, row.id), with: { label: true } }),
    db.select({ n: count() }).from(comment).where(eq(comment.cardId, row.id)),
    db.query.checklistItem.findMany({ where: eq(checklistItem.cardId, row.id) }),
    row.assigneeId
      ? db.query.user.findFirst({ where: eq(user.id, row.assigneeId) })
      : Promise.resolve(null),
  ]);
  return toCardDTO(row, {
    labels: links.map((l) => l.label),
    commentCount: n,
    assignee: toAuthorDTO(assignee),
    checklistTotal: checklist.length,
    checklistDone: checklist.filter((i) => i.completed).length,
  });
}

export const cardsRouter = new Hono<AppEnv>()
  .use(requireAuth)

  // Card with its comments and checklist.
  .get("/:cardId", async (c) => {
    const db = c.get("db");
    const row = await accessibleCard(db, c.req.param("cardId"), c.get("user").id);
    const base = await cardDTO(db, row);

    const [comments, checklist] = await Promise.all([
      db.query.comment.findMany({
        where: eq(comment.cardId, row.id),
        orderBy: [asc(comment.createdAt)],
        with: { user: true },
      }),
      db.query.checklistItem.findMany({
        where: eq(checklistItem.cardId, row.id),
        orderBy: [asc(checklistItem.position)],
      }),
    ]);

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
      checklist: checklist.map(toChecklistItemDTO),
    };
    return c.json(detail);
  })

  // Edit, move, assign.
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
        assigneeId: z.string().nullable().optional(),
      }),
    ),
    async (c) => {
      const db = c.get("db");
      const userId = c.get("user").id;
      const existing = await accessibleCard(db, c.req.param("cardId"), userId);
      const input = c.req.valid("json");

      let columnId = existing.columnId;
      if (input.columnId && input.columnId !== existing.columnId) {
        const target = await accessibleColumn(db, input.columnId, userId);
        if (target.boardId !== existing.boardId) {
          throw new HTTPException(400, { message: "Cannot move card across boards" });
        }
        columnId = target.id;
      }

      let assigneeId = existing.assigneeId;
      if (input.assigneeId !== undefined) {
        if (input.assigneeId === null) {
          assigneeId = null;
        } else {
          const b = await db.query.board.findFirst({ where: eq(board.id, existing.boardId) });
          const member = b?.organizationId
            ? await db.query.orgMember.findFirst({
                where: and(
                  eq(orgMember.organizationId, b.organizationId),
                  eq(orgMember.userId, input.assigneeId),
                ),
              })
            : undefined;
          if (!member) {
            throw new HTTPException(400, { message: "Assignee must be an organization member" });
          }
          assigneeId = input.assigneeId;
        }
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
          assigneeId,
        })
        .where(eq(card.id, existing.id))
        .returning();

      return c.json(await cardDTO(db, updated));
    },
  )

  .delete("/:cardId", async (c) => {
    const db = c.get("db");
    const existing = await accessibleCard(db, c.req.param("cardId"), c.get("user").id);
    await db.delete(card).where(eq(card.id, existing.id));
    return c.body(null, 204);
  })

  // Attach / detach labels.
  .post(
    "/:cardId/labels",
    zValidator("json", z.object({ labelId: z.string() })),
    async (c) => {
      const db = c.get("db");
      const userId = c.get("user").id;
      const cardRow = await accessibleCard(db, c.req.param("cardId"), userId);
      const labelRow = await accessibleLabel(db, c.req.valid("json").labelId, userId);
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

  .delete("/:cardId/labels/:labelId", async (c) => {
    const db = c.get("db");
    const cardRow = await accessibleCard(db, c.req.param("cardId"), c.get("user").id);
    await db
      .delete(cardLabel)
      .where(
        and(eq(cardLabel.cardId, cardRow.id), eq(cardLabel.labelId, c.req.param("labelId"))),
      );
    return c.json(await cardDTO(db, cardRow));
  })

  // Comments.
  .post(
    "/:cardId/comments",
    zValidator("json", z.object({ body: z.string().trim().min(1).max(2000) })),
    async (c) => {
      const db = c.get("db");
      const user_ = c.get("user");
      const cardRow = await accessibleCard(db, c.req.param("cardId"), user_.id);
      const [created] = await db
        .insert(comment)
        .values({ cardId: cardRow.id, userId: user_.id, body: c.req.valid("json").body })
        .returning();
      return c.json(
        toCommentDTO({
          id: created.id,
          cardId: created.cardId,
          body: created.body,
          createdAt: created.createdAt,
          author: { id: user_.id, name: user_.name, image: user_.image ?? null },
        }),
        201,
      );
    },
  )

  // Checklist: add an item.
  .post(
    "/:cardId/checklist",
    zValidator("json", z.object({ text: z.string().trim().min(1).max(300) })),
    async (c) => {
      const db = c.get("db");
      const cardRow = await accessibleCard(db, c.req.param("cardId"), c.get("user").id);
      const last = await db.query.checklistItem.findFirst({
        where: eq(checklistItem.cardId, cardRow.id),
        orderBy: (i, { desc }) => [desc(i.position)],
      });
      const position = (last?.position ?? 0) + POS_STEP;
      const [created] = await db
        .insert(checklistItem)
        .values({ cardId: cardRow.id, text: c.req.valid("json").text, position })
        .returning();
      return c.json(toChecklistItemDTO(created), 201);
    },
  );
