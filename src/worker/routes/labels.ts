import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq } from "drizzle-orm";
import type { AppEnv } from "../lib/context";
import { requireAuth } from "../lib/middleware";
import { label } from "../db/schema";
import { accessibleLabel } from "../lib/resources";
import { toLabelDTO } from "../lib/serializers";
import { LABEL_COLORS } from "@shared/types";

export const labelsRouter = new Hono<AppEnv>()
  .use(requireAuth)

  .patch(
    "/:labelId",
    zValidator(
      "json",
      z.object({
        name: z.string().trim().min(1).max(40).optional(),
        color: z.enum(LABEL_COLORS).optional(),
      }),
    ),
    async (c) => {
      const db = c.get("db");
      const existing = await accessibleLabel(db, c.req.param("labelId"), c.get("user").id);
      const input = c.req.valid("json");
      const [updated] = await db
        .update(label)
        .set({ name: input.name ?? existing.name, color: input.color ?? existing.color })
        .where(eq(label.id, existing.id))
        .returning();
      return c.json(toLabelDTO(updated));
    },
  )

  .delete("/:labelId", async (c) => {
    const db = c.get("db");
    const existing = await accessibleLabel(db, c.req.param("labelId"), c.get("user").id);
    await db.delete(label).where(eq(label.id, existing.id));
    return c.body(null, 204);
  });
