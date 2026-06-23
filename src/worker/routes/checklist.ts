import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import type { AppEnv } from "../lib/context";
import { requireAuth } from "../lib/middleware";
import { checklistItem } from "../db/schema";
import { accessibleCard } from "../lib/resources";
import { toChecklistItemDTO } from "../lib/serializers";
import type { DB } from "../db";

async function accessibleItem(db: DB, itemId: string, userId: string) {
  const row = await db.query.checklistItem.findFirst({ where: eq(checklistItem.id, itemId) });
  if (!row) throw new HTTPException(404, { message: "Checklist item not found" });
  await accessibleCard(db, row.cardId, userId);
  return row;
}

export const checklistRouter = new Hono<AppEnv>()
  .use(requireAuth)

  .patch(
    "/:itemId",
    zValidator(
      "json",
      z.object({
        text: z.string().trim().min(1).max(300).optional(),
        completed: z.boolean().optional(),
        position: z.number().optional(),
      }),
    ),
    async (c) => {
      const db = c.get("db");
      const existing = await accessibleItem(db, c.req.param("itemId"), c.get("user").id);
      const input = c.req.valid("json");
      const [updated] = await db
        .update(checklistItem)
        .set({
          text: input.text ?? existing.text,
          completed: input.completed ?? existing.completed,
          position: input.position ?? existing.position,
        })
        .where(eq(checklistItem.id, existing.id))
        .returning();
      return c.json(toChecklistItemDTO(updated));
    },
  )

  .delete("/:itemId", async (c) => {
    const db = c.get("db");
    const existing = await accessibleItem(db, c.req.param("itemId"), c.get("user").id);
    await db.delete(checklistItem).where(eq(checklistItem.id, existing.id));
    return c.body(null, 204);
  });
