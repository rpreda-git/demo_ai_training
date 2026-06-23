import { Hono } from "hono";
import { eq } from "drizzle-orm";
import type { AppEnv } from "../lib/context";
import { requireAuth } from "../lib/middleware";
import { comment } from "../db/schema";
import { ownComment } from "../lib/resources";

export const commentsRouter = new Hono<AppEnv>()
  .use(requireAuth)

  .delete("/:commentId", async (c) => {
    const db = c.get("db");
    const existing = await ownComment(db, c.req.param("commentId"), c.get("user").id);
    await db.delete(comment).where(eq(comment.id, existing.id));
    return c.body(null, 204);
  });
