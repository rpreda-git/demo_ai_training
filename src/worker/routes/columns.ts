import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq } from "drizzle-orm";
import type { AppEnv } from "../lib/context";
import { requireAuth } from "../lib/middleware";
import { card, column } from "../db/schema";
import { accessibleColumn } from "../lib/resources";
import { EMPTY_CARD_EXTRAS, toCardDTO, toColumnDTO } from "../lib/serializers";

const POS_STEP = 1000;

export const columnsRouter = new Hono<AppEnv>()
  .use(requireAuth)

  .patch(
    "/:columnId",
    zValidator(
      "json",
      z.object({
        title: z.string().trim().min(1).max(80).optional(),
        position: z.number().optional(),
      }),
    ),
    async (c) => {
      const db = c.get("db");
      const existing = await accessibleColumn(db, c.req.param("columnId"), c.get("user").id);
      const input = c.req.valid("json");
      const [updated] = await db
        .update(column)
        .set({
          title: input.title ?? existing.title,
          position: input.position ?? existing.position,
        })
        .where(eq(column.id, existing.id))
        .returning();
      return c.json(toColumnDTO(updated, []));
    },
  )

  .delete("/:columnId", async (c) => {
    const db = c.get("db");
    const existing = await accessibleColumn(db, c.req.param("columnId"), c.get("user").id);
    await db.delete(column).where(eq(column.id, existing.id));
    return c.body(null, 204);
  })

  // Append a card to the column.
  .post(
    "/:columnId/cards",
    zValidator("json", z.object({ title: z.string().trim().min(1).max(200) })),
    async (c) => {
      const db = c.get("db");
      const col = await accessibleColumn(db, c.req.param("columnId"), c.get("user").id);
      const last = await db.query.card.findFirst({
        where: eq(card.columnId, col.id),
        orderBy: (cd, { desc }) => [desc(cd.position)],
      });
      const position = (last?.position ?? 0) + POS_STEP;
      const [created] = await db
        .insert(card)
        .values({
          columnId: col.id,
          boardId: col.boardId,
          title: c.req.valid("json").title,
          position,
        })
        .returning();
      return c.json(toCardDTO(created, EMPTY_CARD_EXTRAS), 201);
    },
  );
